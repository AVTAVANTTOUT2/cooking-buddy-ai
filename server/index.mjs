import { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';
import { createChatServer } from './chat-server.mjs';

export async function startLocalApi() {
  try {
    loadEnvFile(new URL('../.env', import.meta.url));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Impossible de charger le fichier .env.');
  }
  const server = createChatServer({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-flash',
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(3001, '127.0.0.1', resolve);
  });
  console.log('API CookingBuddy : http://127.0.0.1:3001');
  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    console.log(
      'Ajoutez DEEPSEEK_API_KEY dans .env, puis relancez npm start pour activer le chatbot.',
    );
  }
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startLocalApi().catch((error) => {
    console.error(
      error.code === 'EADDRINUSE'
        ? 'Le port 3001 est déjà utilisé.'
        : 'Impossible de démarrer l’API locale.',
    );
    process.exitCode = 1;
  });
}
