import { db } from '../config/database.js';
import { ghouls, cityStates, playerHealthState, collectiblePoints, playerPoints } from '../db/schema/game.js';
export async function devRoutes(app) {
    // Reset game state: delete all ghouls, reset city-state charges, reset player health
    app.post('/reset', async () => {
        await db.delete(ghouls);
        await db.delete(collectiblePoints);
        await db.delete(playerPoints);
        await db.update(cityStates).set({ charge: 100, isFallen: false, upgradeLevel: 0, maxCharge: 100 });
        await db.delete(playerHealthState);
        return { success: true, data: { message: 'Game state reset' } };
    });
}
//# sourceMappingURL=dev.js.map