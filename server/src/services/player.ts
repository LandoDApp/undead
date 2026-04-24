import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { playerPositions } from '../db/schema/game.js';
import { users } from '../db/schema/auth.js';
import { pushTokens } from '../db/schema/social.js';
import { randomUUID } from 'crypto';

export async function updatePosition(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy: number
) {
  await db
    .insert(playerPositions)
    .values({
      userId,
      latitude,
      longitude,
      accuracy,
      isActive: true,
      lastSeenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: playerPositions.userId,
      set: {
        latitude,
        longitude,
        accuracy,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
}

export async function getProfile(userId: string) {
  const result = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId));

  return result[0] ?? null;
}

export async function updateProfile(userId: string, displayName: string) {
  await db.update(users).set({ displayName }).where(eq(users.id, userId));
}

export async function registerPushToken(userId: string, token: string, platform: string) {
  await db
    .insert(pushTokens)
    .values({
      id: randomUUID(),
      userId,
      token,
      platform,
    })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId, platform },
    });
}

export async function setInactive(userId: string) {
  await db
    .update(playerPositions)
    .set({ isActive: false })
    .where(eq(playerPositions.userId, userId));
}
