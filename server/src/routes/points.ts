import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as pointsService from '../services/collectible-points.js';
import { POINT_NEARBY_RADIUS } from '@undead/shared';

const nearbySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const collectSchema = z.object({
  pointId: z.string(),
  playerLat: z.number().min(-90).max(90),
  playerLon: z.number().min(-180).max(180),
});

export async function pointRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get collectible points nearby
  app.get('/nearby', async (request) => {
    const query = nearbySchema.parse(request.query);
    const points = await pointsService.getOrCreatePointsInArea(
      { latitude: query.lat, longitude: query.lon },
      POINT_NEARBY_RADIUS
    );
    return { success: true, data: { points } };
  });

  // Collect a point
  app.post('/collect', async (request) => {
    const body = collectSchema.parse(request.body);
    const result = await pointsService.collectPoint(
      request.user.id,
      body.pointId,
      body.playerLat,
      body.playerLon
    );
    return { success: true, data: result };
  });

  // Get player balance
  app.get('/balance', async (request) => {
    const balance = await pointsService.getPlayerBalance(request.user.id);
    return { success: true, data: balance };
  });
}
