import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as zoneService from '../services/safe-zone.js';

const suggestSchema = z.object({
  name: z.string().min(3).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(20).max(200).default(50),
});

export async function safeZoneRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get all approved zones
  app.get('/', async () => {
    const zones = await zoneService.getAllZones();
    return { success: true, data: zones };
  });

  // Get single zone
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const zone = await zoneService.getZoneById(id);
    if (!zone) {
      return { success: false, error: 'Zone not found' };
    }
    return { success: true, data: zone };
  });

  // Enter a zone
  app.post('/:id/enter', async (request) => {
    const { id } = request.params as { id: string };
    const zone = await zoneService.enterZone(request.user.id, id);
    return { success: true, data: zone };
  });

  // Exit a zone
  app.post('/:id/exit', async (request) => {
    const { id } = request.params as { id: string };
    await zoneService.exitZone(request.user.id, id);
    return { success: true };
  });

  // Reconquer a fallen zone
  app.post('/:id/reconquer', async (request) => {
    const { id } = request.params as { id: string };
    const zone = await zoneService.reconquerZone(request.user.id, id);
    return { success: true, data: zone };
  });

  // Suggest a new zone
  app.post('/suggest', async (request) => {
    const body = suggestSchema.parse(request.body);
    const id = await zoneService.suggestZone(
      request.user.id,
      body.name,
      body.latitude,
      body.longitude,
      body.radius
    );
    return { success: true, data: { id } };
  });

  // Get zone presence (who's nearby)
  app.get('/:id/presence', async (request) => {
    const { id } = request.params as { id: string };
    const presence = await zoneService.getZonePresence(id);
    return { success: true, data: presence };
  });
}
