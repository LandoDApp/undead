import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();

  // 🔥 Crash logging (wichtig im Docker!)
  process.on('uncaughtException', (err) => {
    app.log.error({ err }, 'Uncaught Exception');
  });

  process.on('unhandledRejection', (err) => {
    app.log.error({ err }, 'Unhandled Rejection');
  });

  try {
    await app.listen({
      port: Number(env.PORT) || 3000,
      host: '0.0.0.0', // 🔥 WICHTIG für Docker + Handy Zugriff
    });

    app.log.info(
      `🚀 Server running at http://0.0.0.0:${env.PORT}`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();