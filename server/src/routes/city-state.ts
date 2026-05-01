import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as cityStateService from '../services/city-state.js';

const suggestSchema = z.object({
  name: z.string().min(3).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(20).max(200).default(50),
});

export async function cityStateRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get all approved city-states
  app.get('/', async () => {
    const zones = await cityStateService.getAllCityStates();
    return { success: true, data: zones };
  });

  // Get single city-state
  app.get('/:id', async (request) => {
    const { id } = request.params as { id: string };
    const zone = await cityStateService.getCityStateById(id);
    if (!zone) {
      return { success: false, error: 'City-state not found' };
    }
    return { success: true, data: zone };
  });

  // Enter a city-state
  app.post('/:id/enter', async (request) => {
    const { id } = request.params as { id: string };
    const zone = await cityStateService.enterCityState(request.user.id, id);
    return { success: true, data: zone };
  });

  // Exit a city-state
  app.post('/:id/exit', async (request) => {
    const { id } = request.params as { id: string };
    await cityStateService.exitCityState(request.user.id, id);
    return { success: true };
  });

  // Reconquer a fallen city-state
  app.post('/:id/reconquer', async (request) => {
    const { id } = request.params as { id: string };
    const zone = await cityStateService.reconquerCityState(request.user.id, id);
    return { success: true, data: zone };
  });

  // Suggest a new city-state
  app.post('/suggest', async (request) => {
    const body = suggestSchema.parse(request.body);
    const id = await cityStateService.suggestCityState(
      request.user.id,
      body.name,
      body.latitude,
      body.longitude,
      body.radius
    );
    return { success: true, data: { id } };
  });

  // Heal a city-state with points
  app.post('/:id/heal', async (request) => {
    const { id } = request.params as { id: string };
    const body = z.object({ amount: z.number().int().min(1) }).parse(request.body);
    try {
      const result = await cityStateService.healCityState(request.user.id, id, body.amount);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Upgrade a city-state with points
  app.post('/:id/upgrade', async (request) => {
    const { id } = request.params as { id: string };
    try {
      const result = await cityStateService.upgradeCityState(request.user.id, id);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Get city-state presence (who's nearby)
  app.get('/:id/presence', async (request) => {
    const { id } = request.params as { id: string };
    const presence = await cityStateService.getCityStatePresence(id);
    return { success: true, data: presence };
  });
}
