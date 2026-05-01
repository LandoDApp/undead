import Fastify from 'fastify';
import { corsPlugin } from './plugins/cors.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { playerRoutes } from './routes/player.js';
import { ghoulRoutes } from './routes/ghoul.js';
import { cityStateRoutes } from './routes/city-state.js';
import { meetupRoutes } from './routes/meetup.js';
import { friendRoutes } from './routes/friends.js';
import { legalRoutes } from './routes/legal.js';
import { devRoutes } from './routes/dev.js';
import { pointRoutes } from './routes/points.js';
import { resourceRoutes } from './routes/resources.js';
import { bastionRoutes } from './routes/bastion.js';
import { startCityStateTick } from './services/city-state-tick.js';
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
    await app.register(ghoulRoutes, { prefix: '/api/ghouls' });
    await app.register(cityStateRoutes, { prefix: '/api/city-states' });
    await app.register(meetupRoutes, { prefix: '/api/meetups' });
    await app.register(friendRoutes, { prefix: '/api/friends' });
    await app.register(legalRoutes, { prefix: '/api/legal' });
    await app.register(resourceRoutes, { prefix: '/api/resources' });
    await app.register(bastionRoutes, { prefix: '/api/bastion' });
    // Legacy aliases for transition period
    await app.register(pointRoutes, { prefix: '/api/points' });
    await app.register(ghoulRoutes, { prefix: '/api/zombies' });
    await app.register(cityStateRoutes, { prefix: '/api/zones' });
    // Dev tools (no auth required)
    await app.register(devRoutes, { prefix: '/api/dev' });
    // Health check
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
    // Start server-side city-state tick loop
    startCityStateTick();
    return app;
}
//# sourceMappingURL=app.js.map