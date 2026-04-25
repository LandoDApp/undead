import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { playerRoutes } from './routes/player.js';
import { zombieRoutes } from './routes/zombie.js';
import { safeZoneRoutes } from './routes/safe-zone.js';
import { meetupRoutes } from './routes/meetup.js';
import { friendRoutes } from './routes/friends.js';
import { legalRoutes } from './routes/legal.js';
import { devRoutes } from './routes/dev.js';
import { pointRoutes } from './routes/points.js';
import { startZoneTick } from './services/zone-tick.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
    },
  });

  // Plugins
  await app.register(corsPlugin);
  await app.register(authPlugin);

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(playerRoutes, { prefix: '/api/player' });
  await app.register(zombieRoutes, { prefix: '/api/zombies' });
  await app.register(safeZoneRoutes, { prefix: '/api/zones' });
  await app.register(meetupRoutes, { prefix: '/api/meetups' });
  await app.register(friendRoutes, { prefix: '/api/friends' });
  await app.register(legalRoutes, { prefix: '/api/legal' });

  await app.register(pointRoutes, { prefix: '/api/points' });

  // Dev tools (no auth required)
  await app.register(devRoutes, { prefix: '/api/dev' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Start server-side zone tick loop
  startZoneTick();

  return app;
}
