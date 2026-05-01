import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as playerService from '../services/player.js';
import { getHealthState, revivePlayer } from '../services/player-health.js';
import { getStreak, checkAndUpdateStreak, useStreakFreeze } from '../services/streaks.js';
import { getActiveVision, drawDailyVision } from '../services/visions.js';
import { reportSteps } from '../services/steps.js';
import { setClan, getClan } from '../services/clan.js';

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

const stepsSchema = z.object({
  steps: z.number().int().min(0).max(100_000), // plausibility cap
});

const clanSchema = z.object({
  clan: z.enum(['glut', 'frost', 'hain']),
});

export async function playerRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate);

  // Update player position
  app.put('/position', async (request, reply) => {
    const body = positionSchema.parse(request.body);
    await playerService.updatePosition(
      request.user.id,
      body.latitude,
      body.longitude,
      body.accuracy
    );
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

  // ---- Streak ----
  app.get('/streak', async (request) => {
    try {
      const streak = await getStreak(request.user.id);
      return { success: true, data: streak };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  app.post('/streak/checkin', async (request) => {
    try {
      const streak = await checkAndUpdateStreak(request.user.id);
      return { success: true, data: streak };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  app.post('/streak/freeze', async (request) => {
    try {
      const streak = await useStreakFreeze(request.user.id);
      return { success: true, data: streak };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ---- Vision ----
  app.get('/vision', async (request) => {
    try {
      const vision = await getActiveVision(request.user.id);
      return { success: true, data: vision };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  app.post('/vision/draw', async (request) => {
    try {
      const vision = await drawDailyVision(request.user.id);
      return { success: true, data: vision };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ---- Steps ----
  app.post('/steps', async (request) => {
    const body = stepsSchema.parse(request.body);
    try {
      const result = await reportSteps(request.user.id, body.steps);
      return { success: true, data: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // ---- Clan ----
  app.get('/clan', async (request) => {
    try {
      const clan = await getClan(request.user.id);
      return { success: true, data: { clan } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  app.post('/clan', async (request) => {
    const body = clanSchema.parse(request.body);
    try {
      await setClan(request.user.id, body.clan);
      return { success: true, data: { clan: body.clan } };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });
}
