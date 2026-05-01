import { z } from 'zod';
import * as resourceService from '../services/resources.js';
import { RESOURCE_NEARBY_RADIUS } from '@undead/shared';
const nearbySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
});
const collectSchema = z.object({
    resourceId: z.string(),
    playerLat: z.number().min(-90).max(90),
    playerLon: z.number().min(-180).max(180),
});
export async function resourceRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    // Get resources nearby
    app.get('/nearby', async (request) => {
        const query = nearbySchema.parse(request.query);
        const resources = await resourceService.getOrCreateResourcesInArea({ latitude: query.lat, longitude: query.lon }, RESOURCE_NEARBY_RADIUS);
        return { success: true, data: { resources } };
    });
    // Collect a resource
    app.post('/collect', async (request) => {
        const body = collectSchema.parse(request.body);
        const result = await resourceService.collectResource(request.user.id, body.resourceId, body.playerLat, body.playerLon);
        return { success: true, data: result };
    });
    // Get player resource balance
    app.get('/balance', async (request) => {
        const balance = await resourceService.getPlayerResourceBalance(request.user.id);
        return { success: true, data: balance };
    });
}
//# sourceMappingURL=resources.js.map