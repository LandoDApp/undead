import { z } from 'zod';
import { getOrCreateGhoulsInArea, killGhoul } from '../services/ghoul-world.js';
import { getRoute } from '../services/valhalla.js';
import { processGhoulCatch } from '../services/player-health.js';
import { GHOUL_NEARBY_RADIUS } from '@undead/shared';
const nearbySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
});
const routeSchema = z.object({
    ghoulLat: z.number().min(-90).max(90),
    ghoulLon: z.number().min(-180).max(180),
    playerLat: z.number().min(-90).max(90),
    playerLon: z.number().min(-180).max(180),
});
const catchSchema = z.object({
    ghoulId: z.string(),
    ghoulLat: z.number().min(-90).max(90),
    ghoulLon: z.number().min(-180).max(180),
    playerLat: z.number().min(-90).max(90),
    playerLon: z.number().min(-180).max(180),
});
export async function ghoulRoutes(app) {
    app.addHook('preHandler', app.authenticate);
    // Get nearby ghouls (server-persistent)
    app.get('/nearby', async (request) => {
        const query = nearbySchema.parse(request.query);
        const ghouls = await getOrCreateGhoulsInArea({ latitude: query.lat, longitude: query.lon }, GHOUL_NEARBY_RADIUS);
        return { success: true, data: { ghouls } };
    });
    // Get route for a ghoul to the player
    app.post('/route', async (request) => {
        const body = routeSchema.parse(request.body);
        const result = await getRoute({ latitude: body.ghoulLat, longitude: body.ghoulLon }, { latitude: body.playerLat, longitude: body.playerLon });
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
    // Report a ghoul catching the player (server validates + manages health)
    app.post('/catch', async (request) => {
        const body = catchSchema.parse(request.body);
        // Kill the ghoul on the server
        const ghoulKilled = await killGhoul(body.ghoulId);
        const result = await processGhoulCatch(request.user.id, body.ghoulLat, body.ghoulLon, body.playerLat, body.playerLon);
        return { success: true, data: { ...result, ghoulKilled } };
    });
}
//# sourceMappingURL=ghoul.js.map