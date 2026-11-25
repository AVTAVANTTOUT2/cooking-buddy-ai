import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startLocalApi } from '../server/index.mjs';

// Load the key only in this server process, never in the Angular child process.
const frontendEnvironment = { ...process.env };
delete frontendEnvironment.DEEPSEEK_API_KEY;
delete frontendEnvironment.DEEPSEEK_MODEL;

try {
  const server = await startLocalApi();
  const frontend = spawn(
    process.execPath,
    [
      fileURLToPath(new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url)),
      'serve',
      '--host',
      '127.0.0.1',
      '--port',
      '4200',
    ],
    {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      env: frontendEnvironment,
      stdio: 'inherit',
    },
  );
  let stopping = false;
  function stop(exitCode) {
    if (stopping) return;
    stopping = true;
    frontend.kill('SIGTERM');
    server.close();
    server.closeAllConnections();
    process.exitCode = exitCode;
    const forcedStop = setTimeout(() => {
      frontend.kill('SIGKILL');
      process.exit(exitCode);
    }, 3000);
    forcedStop.unref();
  }
  frontend.once('error', () => {
    console.error('Impossible de démarrer Angular. Vérifiez npm install.');
    stop(1);
  });
  frontend.once('exit', (code) => stop(code ?? 1));
  process.once('SIGINT', () => stop(0));
  process.once('SIGTERM', () => stop(0));
} catch (error) {
  console.error(
    error.code === 'EADDRINUSE'
      ? 'Le port 3001 est déjà utilisé. Arrêtez l’ancien serveur.'
      : 'Impossible de démarrer CookingBuddy.',
  );
  process.exitCode = 1;
}
