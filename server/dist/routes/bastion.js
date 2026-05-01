import { z } from 'zod';
import * as bastionService from '../services/bastion.js';
import { BASTION_NEARBY_RADIUS } from '@undead/shared';
const createSchema = z.object({
    name: z.string().min(2).max(50),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
});
const healSchema = z.object({
    amount: z.number().int().min(1),
});
const nearbySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
});
export async function bastionRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    // Get own bastion
    app.get('/', async (request) => {
        const bastion = await bastionService.getPlayerBastion(request.user.id);
        return { success: true, data: bastion };
    });
    // Create bastion
    app.post('/', async (request) => {
        const body = createSchema.parse(request.body);
        try {
            const bastion = await bastionService.createBastion(request.user.id, body.name, body.latitude, body.longitude);
            return { success: true, data: bastion };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
    // Upgrade bastion
    app.post('/upgrade', async (request) => {
        try {
            const result = await bastionService.upgradeBastion(request.user.id);
            return { success: true, data: result };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
    // Heal bastion
    app.post('/heal', async (request) => {
        const body = healSchema.parse(request.body);
        try {
            const result = await bastionService.healBastion(request.user.id, body.amount);
            return { success: true, data: result };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
    // Reinforce a friend's bastion
    app.post('/:id/reinforce', async (request) => {
        const { id } = request.params;
        try {
            const result = await bastionService.reinforceBastion(id, request.user.id);
            return { success: true, data: result };
        }
        catch (err) {
            return { success: false, error: err.message };
        }
    });
    // Get nearby bastions
    app.get('/nearby', async (request) => {
        const query = nearbySchema.parse(request.query);
        const bastions = await bastionService.getNearbyBastions(query.lat, query.lon, BASTION_NEARBY_RADIUS);
        return { success: true, data: { bastions } };
    });
}
//# sourceMappingURL=bastion.js.map