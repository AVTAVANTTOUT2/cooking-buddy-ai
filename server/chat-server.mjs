import { createServer } from 'node:http';

const SYSTEM_PROMPT = `Tu es CookingBuddy, un assistant culinaire chaleureux et pratique.
Réponds en français, sauf si la personne demande une autre langue.
Aide à choisir des recettes, utiliser les ingrédients disponibles, remplacer un ingrédient et organiser les repas.
Précise les quantités, le nombre de portions, les étapes et les durées utiles. Demande les contraintes manquantes si nécessaire.
Tiens compte des allergies indiquées sans garantir l'absence d'allergènes; ne donne pas de conseil médical.
Ne prétends pas connaître le contenu de l'application ou avoir consulté le web.
Réponds en texte simple, avec des paragraphes courts et des listes si utile, sans tableau Markdown.
Reste concis: moins de 3000 caractères par réponse.`;

class ChatError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, body) {
  if (response.destroyed) return;
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function checkLocalRequest(request) {
  const port = request.socket.localPort;
  const allowedOrigins = new Set([
    `http://127.0.0.1:${port}`,
    `http://localhost:${port}`,
    'http://127.0.0.1:4200',
    'http://localhost:4200',
  ]);
  if (
    !allowedOrigins.has(`http://${request.headers.host}`) ||
    (request.headers.origin && !allowedOrigins.has(request.headers.origin))
  ) {
    throw new ChatError(403, 'Origine de la requête non autorisée.');
  }
}

function readJson(request) {
  if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
    throw new ChatError(415, 'Une requête JSON est attendue.');
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > 100_000) {
        reject(new ChatError(413, 'La conversation est trop volumineuse.'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (bytes > 100_000) return;
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new ChatError(400, 'Le JSON envoyé est invalide.'));
      }
    });
    request.on('error', () => reject(new ChatError(400, 'La requête a été interrompue.')));
    request.on('aborted', () => reject(new ChatError(400, 'La requête a été interrompue.')));
  });
}

function validateMessages(body) {
  const messages = body?.messages;
  if (
    !Array.isArray(messages) ||
    !messages.length ||
    messages.length > 19 ||
    messages.length % 2 !== 1
  ) {
    throw new ChatError(
      400,
      'La conversation doit contenir de 1 à 19 messages et finir par votre question.',
    );
  }
  let totalCharacters = 0;
  return messages.map((message, index) => {
    const expectedRole = index % 2 === 0 ? 'user' : 'assistant';
    if (
      message?.role !== expectedRole ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.trim().length > 4000
    ) {
      throw new ChatError(
        400,
        'Les messages doivent alterner et contenir entre 1 et 4000 caractères.',
      );
    }
    const content = message.content.trim();
    totalCharacters += content.length;
    if (totalCharacters > 24_000) {
      throw new ChatError(
        400,
        'La conversation dépasse 24 000 caractères. Démarrez une nouvelle conversation.',
      );
    }
    return { role: expectedRole, content };
  });
}

export function createChatServer({
  apiKey = '',
  model = 'deepseek-flash',
  fetchImpl = fetch,
  timeoutMs = 45_000,
  maxRequestsPerMinute = 20,
  maxConcurrent = 3,
} = {}) {
  const key = apiKey.trim();
  const requestTimes = [];
  let activeRequests = 0;

  return createServer(
    { requestTimeout: 10_000, headersTimeout: 5000 },
    async (request, response) => {
      try {
        checkLocalRequest(request);
        if (request.method === 'GET' && request.url === '/api/chat/status') {
          sendJson(response, 200, { configured: Boolean(key) });
          return;
        }
        if (request.url !== '/api/chat') {
          throw new ChatError(404, 'Ressource introuvable.');
        }
        if (request.method !== 'POST') {
          throw new ChatError(405, 'Méthode non autorisée.');
        }
        const messages = validateMessages(await readJson(request));
        if (!key) {
          throw new ChatError(503, 'L’assistant n’est pas encore configuré.');
        }

        const now = Date.now();
        while (requestTimes.length && requestTimes[0] <= now - 60_000) requestTimes.shift();
        if (requestTimes.length >= maxRequestsPerMinute || activeRequests >= maxConcurrent) {
          response.setHeader('Retry-After', '60');
          throw new ChatError(429, 'Trop de demandes. Patientez une minute avant de réessayer.');
        }
        requestTimes.push(now);
        activeRequests++;

        const controller = new AbortController();
        let timedOut = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
        const onClose = () => {
          if (!response.writableEnded) controller.abort();
        };
        response.on('close', onClose);
        try {
          const upstream = await fetchImpl('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
              max_tokens: 1024,
              thinking: { type: 'disabled' },
              stream: false,
            }),
            signal: controller.signal,
          });
          if (!upstream.ok) {
            await upstream.body?.cancel();
            if (upstream.status === 429) {
              throw new ChatError(
                429,
                'L’assistant reçoit trop de demandes. Réessayez dans un instant.',
              );
            }
            if (upstream.status === 401 || upstream.status === 403) {
              throw new ChatError(
                502,
                'La connexion à l’assistant a été refusée. Vérifiez sa configuration.',
              );
            }
            if (upstream.status === 402) {
              throw new ChatError(502, 'Le solde du service IA est insuffisant.');
            }
            throw new ChatError(502, 'Le service IA est temporairement indisponible. Réessayez.');
          }
          const data = await upstream.json();
          const choice = data?.choices?.[0];
          if (choice?.finish_reason !== 'stop') {
            throw new ChatError(
              502,
              'La réponse de l’assistant a été interrompue. Réessayez avec une question plus courte.',
            );
          }
          const answer = choice?.message?.content;
          if (typeof answer !== 'string' || !answer.trim() || answer.trim().length > 4000) {
            throw new ChatError(
              502,
              'L’assistant n’a pas fourni de réponse exploitable. Réessayez avec une question plus précise.',
            );
          }
          sendJson(response, 200, { message: answer.trim() });
        } catch (error) {
          if (timedOut)
            throw new ChatError(504, 'La réponse prend trop de temps. Réessayez dans un instant.');
          if (error instanceof ChatError) throw error;
          throw new ChatError(
            502,
            'Impossible de joindre le service IA. Réessayez dans un instant.',
          );
        } finally {
          clearTimeout(timeout);
          response.off('close', onClose);
          activeRequests--;
        }
      } catch (error) {
        const status = error instanceof ChatError ? error.status : 500;
        if (status === 413) response.shouldKeepAlive = false;
        sendJson(response, status, {
          error: error instanceof ChatError ? error.message : 'Une erreur interne est survenue.',
        });
      }
    },
  );
}
