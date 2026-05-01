import { auth } from '../auth/index.js';
import { db } from '../config/database.js';
import { sessions, users, verifications } from '../db/schema/auth.js';
import { and, eq, gt } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { z } from 'zod';
import { sendMagicLinkEmail } from '../services/notification.js';
const sendMobileMagicLinkSchema = z.object({
    email: z.string().email(),
});
const verifyMobileMagicLinkSchema = z.object({
    email: z.string().email(),
    token: z.string().min(10),
});
const signUpSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(30),
});
export async function authRoutes(app) {
    // Register a new user account
    app.post('/sign-up', async (request, reply) => {
        const body = signUpSchema.parse(request.body);
        const email = body.email.trim().toLowerCase();
        const displayName = body.name.trim();
        const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (existing.length > 0) {
            return reply.status(409).send({ success: false, error: 'Account already exists' });
        }
        const now = new Date();
        await db.insert(users).values({
            id: randomUUID(),
            email,
            displayName,
            emailVerified: false,
            createdAt: now,
            updatedAt: now,
        });
        return reply.send({ success: true });
    });
    // Mobile-first magic link flow (deep-link callback)
    app.post('/mobile-magic-link/send', async (request, reply) => {
        const body = sendMobileMagicLinkSchema.parse(request.body);
        const email = body.email.trim().toLowerCase();
        const existingUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        // Do not leak whether account exists
        if (existingUser.length === 0) {
            return reply.send({ success: true });
        }
        const token = randomUUID() + randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
        await db.insert(verifications).values({
            id: randomUUID(),
            identifier: email,
            value: token,
            expiresAt,
            createdAt: now,
            updatedAt: now,
        });
        const deepLink = `undead://auth/callback?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
        await sendMagicLinkEmail(email, deepLink);
        return reply.send({ success: true });
    });
    app.post('/mobile-magic-link/verify', async (request, reply) => {
        const body = verifyMobileMagicLinkSchema.parse(request.body);
        const email = body.email.trim().toLowerCase();
        const token = body.token.trim();
        const now = new Date();
        const verificationResult = await db
            .select()
            .from(verifications)
            .where(and(eq(verifications.identifier, email), eq(verifications.value, token), gt(verifications.expiresAt, now)))
            .limit(1);
        const verification = verificationResult[0];
        if (!verification) {
            return reply.status(400).send({ success: false, error: 'Invalid or expired token' });
        }
        await db.delete(verifications).where(eq(verifications.id, verification.id));
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }
        const sessionToken = randomUUID();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.insert(sessions).values({
            id: randomUUID(),
            userId: user.id,
            token: sessionToken,
            expiresAt,
            createdAt: now,
            updatedAt: now,
        });
        return reply.send({ success: true, data: { token: sessionToken } });
    });
    // Delete user account
    app.delete('/delete-user', {
        preHandler: [app.authenticate],
    }, async (request, reply) => {
        const userId = request.user.id;
        // Delete user (cascades to related tables)
        await db.delete(users).where(eq(users.id, userId));
        return reply.send({ success: true });
    });
    // Dev-only login helper for internal testing without email callback wiring
    app.post('/dev-login', async (request, reply) => {
        if (env.NODE_ENV === 'production') {
            return reply.status(403).send({ success: false, error: 'Disabled in production' });
        }
        const body = request.body;
        const email = body.email?.trim().toLowerCase();
        if (!email) {
            return reply.status(400).send({ success: false, error: 'Email required' });
        }
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }
        const token = randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.insert(sessions).values({
            id: randomUUID(),
            userId: user.id,
            token,
            expiresAt,
            createdAt: now,
            updatedAt: now,
        });
        return reply.send({ success: true, data: { token } });
    });
    // Forward unmatched auth requests to better-auth
    app.setNotFoundHandler(async (request, reply) => {
        const url = `${env.BETTER_AUTH_URL}${request.url}`;
        const webRequest = new Request(url, {
            method: request.method,
            headers: request.headers,
            body: request.method !== 'GET' && request.method !== 'HEAD'
                ? JSON.stringify(request.body)
                : undefined,
        });
        const response = await auth.handler(webRequest);
        response.headers.forEach((value, key) => {
            reply.header(key, value);
        });
        reply.status(response.status);
        const body = await response.text();
        return reply.send(body);
    });
}
//# sourceMappingURL=auth.js.map