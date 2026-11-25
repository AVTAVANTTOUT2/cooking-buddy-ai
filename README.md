# CookingBuddy

Application Angular de recettes avec un assistant culinaire DeepSeek en français.

## Démarrer en local

Prérequis : une version de Node compatible avec Angular 22 (`^22.22.3`, `^24.15.0` ou `>=26.0.0`) et npm.

```bash
npm install
cp .env.example .env # uniquement si .env n’existe pas encore
```

Dans `.env`, renseigner la clé du compte [DeepSeek](https://platform.deepseek.com/api_keys) :

```dotenv
DEEPSEEK_API_KEY=votre_cle_privee
DEEPSEEK_MODEL=deepseek-flash
```

Puis lancer :

```bash
npm start
```

Ouvrir **http://127.0.0.1:4200/**. Cette commande démarre Angular (port 4200) et l’API Node (port 3001), uniquement sur l’interface locale. `Ctrl+C` arrête les deux. Après toute modification de `.env`, arrêter puis relancer `npm start`. Le bouton de vérification du chatbot actualise ensuite son état.

Sans clé, les recettes restent accessibles et le chatbot indique qu’il n’est pas configuré. La présence d’une clé ne garantit pas sa validité ni le crédit disponible : ces erreurs sont signalées au premier message. Ne pas saisir la clé dans la conversation.

Pour lancer séparément les deux processus : `npm run start:api` et `npm run start:web`, dans deux terminaux. `ng serve` seul ne démarre pas l’API.

## Chatbot

L’assistant propose des idées de repas, des substitutions et des étapes de préparation. Il conserve les échanges dans la mémoire de l’onglet. « Nouvelle conversation » les efface et annule la réponse en cours; un rechargement efface également l’historique. Il n’a pas accès automatiquement aux fiches de recettes de l’application.

Les messages et l’historique récent sont envoyés à DeepSeek lors d’une question. Aucun historique n’est stocké sur disque par CookingBuddy. Les réponses sont affichées comme texte, sans exécuter le HTML éventuellement produit par le modèle.

Le navigateur appelle `/api/chat`; le proxy Angular transmet à l’API Node, qui appelle l’URL fixe `https://api.deepseek.com/chat/completions`. La clé reste dans le processus serveur; `.env` est ignoré par Git et ne doit jamais être placé dans `src/`, `public/` ni partagé. Le modèle par défaut suit la [documentation DeepSeek](https://api-docs.deepseek.com/); `DEEPSEEK_MODEL` permet de le changer.

## Contrat de l’API locale

- `GET /api/chat/status` → `{ "configured": true | false }`, sans exposer la clé.
- `POST /api/chat`, `Content-Type: application/json` → `{ "messages": [{ "role": "user", "content": "Que préparer avec des lentilles ?" }] }`.
- Succès → `{ "message": "Réponse de l’assistant" }`; échec → `{ "error": "Message explicatif" }`.
- Historique strictement alterné `user` / `assistant`, commençant et finissant par `user`, 1 à 19 messages, 4 000 caractères par message et 24 000 au total. L’interface retire les plus anciens tours complets pour respecter les limites. Corps HTTP limité à 100 000 octets.
- Le message système, le modèle, l’URL fournisseur et la limite de réponse (1 024 tokens) sont fixés côté serveur. Le mode de raisonnement est désactivé. Une réponse vide, interrompue (raison de fin différente de `stop`) ou dépassant 4 000 caractères est refusée, afin de rester réutilisable dans l’historique.
- Délai fournisseur : 45 secondes. Limites globales pour cette application locale : 20 appels par minute et 3 simultanés. La fermeture de la requête annule l’appel fournisseur.
- Erreurs : 400 contenu invalide, 403 origine interdite, 413 corps trop grand, 415 format non JSON, 429 limite atteinte, 502 fournisseur inaccessible/configuration refusée/solde insuffisant/réponse invalide, 503 clé absente, 504 délai dépassé.

Cette API est prévue pour le développement local, sans comptes utilisateurs. Avant une mise en ligne, prévoir authentification, quotas par utilisateur, gestion des secrets et configuration HTTPS du proxy. `npm run build` produit uniquement le frontend statique; il ne déploie pas l’API.

## Vérifications

```bash
npm run test:all # API Node puis composants Angular, sans appel réel à DeepSeek
npm run build
```

Les tests API utilisent un serveur HTTP réel et simulent uniquement le fournisseur DeepSeek : limites, validation, refus d’origine, conservation du secret, succès, erreurs, délai et annulation. Les tests du chatbot simulent le réseau pour vérifier ses interactions et son historique. Un essai réel nécessite une clé valide avec du crédit.

Projet généré avec Angular CLI 22.2.6.
