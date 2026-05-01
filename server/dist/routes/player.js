import { z } from 'zod';
import * as playerService from '../services/player.js';
import { getHealthState, revivePlayer } from '../services/player-health.js';
const positionSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z.number().min(0),
});
const profileUpdateSchema = z.object({
    displayName: z.string().min(2).max(30),
});
const pushTokenSchema = z.object({
    token: z.string(),
    platform: z.enum(['android', 'ios']),
});
export async function playerRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    // Update player position
    app.put('/position', async (request, reply) => {
        const body = positionSchema.parse(request.body);
        await playerService.updatePosition(request.user.id, body.latitude, body.longitude, body.accuracy);
        return { success: true };
    });
    // Get own profile
    app.get('/profile', async (request) => {
        const profile = await playerService.getProfile(request.user.id);
        return { success: true, data: profile };
    });
    // Update profile
    app.patch('/profile', async (request) => {
        const body = profileUpdateSchema.parse(request.body);
        await playerService.updateProfile(request.user.id, body.displayName);
        return { success: true };
    });
    // Register push token
    app.post('/push-token', async (request) => {
        const body = pushTokenSchema.parse(request.body);
        await playerService.registerPushToken(request.user.id, body.token, body.platform);
        return { success: true };
    });
    // Mark player inactive (app going to background)
    app.post('/inactive', async (request) => {
        await playerService.setInactive(request.user.id);
        return { success: true };
    });
    // Get player health state
    app.get('/health', async (request) => {
        const state = await getHealthState(request.user.id);
        return { success: true, data: state };
    });
    // Revive player (reset health after down timer)
    app.post('/revive', async (request) => {
        const state = await revivePlayer(request.user.id);
        return { success: true, data: state };
    });
}
//# sourceMappingURL=player.js.map