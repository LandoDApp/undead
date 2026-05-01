import type { FastifyInstance } from 'fastify';
import { getPlayerQuests, claimQuestReward } from '../services/quests.js';

export async function questRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get all active quests (auto-generates daily/weekly if needed)
  app.get('/', async (request) => {
    try {
      const quests = await getPlayerQuests(request.user.id);
      return { success: true, data: quests };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Claim a completed quest's reward
  app.post('/:id/claim', async (request) => {
    const { id } = request.params as { id: string };
    try {
      const result = await claimQuestReward(request.user.id, id);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
