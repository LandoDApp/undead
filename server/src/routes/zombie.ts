import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getOrCreateZombiesInArea, killZombie } from '../services/zombie-world.js';
import { getRoute } from '../services/valhalla.js';
import { processZombieCatch } from '../services/player-health.js';
import { ZOMBIE_NEARBY_RADIUS } from '@undead/shared';

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const routeSchema = z.object({
  zombieLat: z.number().min(-90).max(90),
  zombieLon: z.number().min(-180).max(180),
  playerLat: z.number().min(-90).max(90),
  playerLon: z.number().min(-180).max(180),
});

const catchSchema = z.object({
  zombieId: z.string(),
  zombieLat: z.number().min(-90).max(90),
  zombieLon: z.number().min(-180).max(180),
  playerLat: z.number().min(-90).max(90),
  playerLon: z.number().min(-180).max(180),
});

export async function zombieRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get nearby zombies (server-persistent)
  app.get('/nearby', async (request) => {
    const query = nearbySchema.parse(request.query);
    const zombies = await getOrCreateZombiesInArea(
      { latitude: query.lat, longitude: query.lon },
      ZOMBIE_NEARBY_RADIUS
    );
    return { success: true, data: { zombies } };
  });

  // Get route for a zombie to the player
  app.post('/route', async (request) => {
    const body = routeSchema.parse(request.body);
    const result = await getRoute(
      { latitude: body.zombieLat, longitude: body.zombieLon },
      { latitude: body.playerLat, longitude: body.playerLon }
    );

    if (!result) {
      return { success: false, error: 'Could not compute route' };
    }

    return {
      success: true,
      data: {
        route: result.route,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds,
      },
    };
  });

  // Report a zombie catching the player (server validates + manages health)
  app.post('/catch', async (request) => {
    const body = catchSchema.parse(request.body);

    // Kill the zombie on the server
    const zombieKilled = await killZombie(body.zombieId);

    const result = await processZombieCatch(
      request.user.id,
      body.zombieLat,
      body.zombieLon,
      body.playerLat,
      body.playerLon
    );

    return { success: true, data: { ...result, zombieKilled } };
  });
}
