import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { friends } from '../db/schema/social.js';
import { users } from '../db/schema/auth.js';
import { playerPositions } from '../db/schema/game.js';
import { eq, and, or, sql } from 'drizzle-orm';

const friendRequestSchema = z.object({
  friendId: z.string(),
});

export async function friendRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get friends list
  app.get('/', async (request) => {
    const userId = request.user.id;

    const result = await db
      .select({
        friendId: sql<string>`CASE
          WHEN ${friends.userId} = ${userId} THEN ${friends.friendId}
          ELSE ${friends.userId}
        END`,
        displayName: users.displayName,
        status: friends.status,
        createdAt: friends.createdAt,
      })
      .from(friends)
      .leftJoin(
        users,
        sql`users.id = CASE
          WHEN ${friends.userId} = ${userId} THEN ${friends.friendId}
          ELSE ${friends.userId}
        END`
      )
      .where(or(eq(friends.userId, userId), eq(friends.friendId, userId)));

    return { success: true, data: result };
  });

  // Send friend request
  app.post('/request', async (request) => {
    const body = friendRequestSchema.parse(request.body);
    const userId = request.user.id;

    if (userId === body.friendId) {
      return { success: false, error: 'Cannot add yourself' };
    }

    await db.insert(friends).values({
      userId,
      friendId: body.friendId,
      status: 'pending',
    });

    return { success: true };
  });

  // Accept friend request
  app.post('/accept', async (request) => {
    const body = friendRequestSchema.parse(request.body);
    const userId = request.user.id;

    await db
      .update(friends)
      .set({ status: 'accepted' })
      .where(and(eq(friends.userId, body.friendId), eq(friends.friendId, userId)));

    return { success: true };
  });

  // Reject friend request
  app.post('/reject', async (request) => {
    const body = friendRequestSchema.parse(request.body);
    const userId = request.user.id;

    await db
      .update(friends)
      .set({ status: 'rejected' })
      .where(and(eq(friends.userId, body.friendId), eq(friends.friendId, userId)));

    return { success: true };
  });

  // Remove friend
  app.delete('/:friendId', async (request) => {
    const { friendId } = request.params as { friendId: string };
    const userId = request.user.id;

    await db
      .delete(friends)
      .where(
        or(
          and(eq(friends.userId, userId), eq(friends.friendId, friendId)),
          and(eq(friends.userId, friendId), eq(friends.friendId, userId))
        )
      );

    return { success: true };
  });
}
