import fp from 'fastify-plugin';
import { auth } from '../auth/index.js';
import { db } from '../config/database.js';
import { sessions, users } from '../db/schema/auth.js';
import { and, eq, gt } from 'drizzle-orm';
export const authPlugin = fp(async function authPlugin(app) {
    app.decorate('auth', auth);
    app.decorate('authenticate', async (request, reply) => {
        const betterAuthSession = await auth.api.getSession({
            headers: request.headers,
        });
        if (betterAuthSession) {
            request.user = betterAuthSession.user;
            request.session = betterAuthSession.session;
            return;
        }
        // Internal fallback: accept Bearer session token from mobile client
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }
        const token = authHeader.slice('Bearer '.length).trim();
        if (!token) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }
        const now = new Date();
        const result = await db
            .select({
            session: sessions,
            user: users,
        })
            .from(sessions)
            .innerJoin(users, eq(sessions.userId, users.id))
            .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
            .limit(1);
        if (result.length === 0) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }
        request.user = result[0].user;
        request.session = result[0].session;
    });
});
//# sourceMappingURL=auth.js.map