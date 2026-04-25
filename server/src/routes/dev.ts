import type { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { zombies, safeZones, playerHealthState, collectiblePoints, playerPoints } from '../db/schema/game.js';

export async function devRoutes(app: FastifyInstance) {
  // Reset game state: delete all zombies, reset safe zone charges, reset player health
  app.post('/reset', async () => {
    await db.delete(zombies);
    await db.delete(collectiblePoints);
    await db.delete(playerPoints);
    await db.update(safeZones).set({ charge: 100, isFallen: false, upgradeLevel: 0, maxCharge: 100 });
    await db.delete(playerHealthState);

    return { success: true, data: { message: 'Game state reset' } };
  });
}
