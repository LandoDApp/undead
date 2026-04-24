import type { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { zombies, safeZones, playerHealthState } from '../db/schema/game.js';

export async function devRoutes(app: FastifyInstance) {
  // Reset game state: delete all zombies, reset safe zone charges, reset player health
  app.post('/reset', async () => {
    await db.delete(zombies);
    await db.update(safeZones).set({ charge: 100, isFallen: false });
    await db.delete(playerHealthState);

    return { success: true, data: { message: 'Game state reset' } };
  });
}
