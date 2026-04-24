import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { db } from '../config/database.js';
import { meetups, meetupCheckins } from '../db/schema/social.js';
import { safeZones } from '../db/schema/game.js';
import { users } from '../db/schema/auth.js';
import { eq, and, gte } from 'drizzle-orm';

const createMeetupSchema = z.object({
  zoneId: z.string(),
  title: z.string().min(3).max(100),
  scheduledAt: z.string().datetime(),
});

const checkinSchema = z.object({
  notifyBefore: z.number().int().min(5).max(120).default(30),
});

export async function meetupRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Get all active meetups
  app.get('/', async () => {
    const result = await db
      .select({
        id: meetups.id,
        creatorId: meetups.creatorId,
        creatorName: users.displayName,
        zoneId: meetups.zoneId,
        zoneName: safeZones.name,
        title: meetups.title,
        scheduledAt: meetups.scheduledAt,
        isActive: meetups.isActive,
        createdAt: meetups.createdAt,
      })
      .from(meetups)
      .leftJoin(users, eq(meetups.creatorId, users.id))
      .leftJoin(safeZones, eq(meetups.zoneId, safeZones.id))
      .where(
        and(eq(meetups.isActive, true), gte(meetups.scheduledAt, new Date()))
      );

    return { success: true, data: result };
  });

  // Create a meetup
  app.post('/', async (request) => {
    const body = createMeetupSchema.parse(request.body);
    const id = randomUUID();

    await db.insert(meetups).values({
      id,
      creatorId: request.user.id,
      zoneId: body.zoneId,
      title: body.title,
      scheduledAt: new Date(body.scheduledAt),
    });

    return { success: true, data: { id } };
  });

  // Check in to a meetup
  app.post('/:id/checkin', async (request) => {
    const { id } = request.params as { id: string };
    const body = checkinSchema.parse(request.body);

    await db.insert(meetupCheckins).values({
      meetupId: id,
      userId: request.user.id,
      notifyBefore: body.notifyBefore,
    });

    return { success: true };
  });

  // Remove checkin
  app.delete('/:id/checkin', async (request) => {
    const { id } = request.params as { id: string };

    await db
      .delete(meetupCheckins)
      .where(
        and(eq(meetupCheckins.meetupId, id), eq(meetupCheckins.userId, request.user.id))
      );

    return { success: true };
  });

  // Cancel a meetup (creator only)
  app.delete('/:id', async (request) => {
    const { id } = request.params as { id: string };

    await db
      .update(meetups)
      .set({ isActive: false })
      .where(and(eq(meetups.id, id), eq(meetups.creatorId, request.user.id)));

    return { success: true };
  });
}
