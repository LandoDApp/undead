import type { FastifyInstance, FastifyReply } from 'fastify';
import { auth } from '../auth/index.js';
export declare const authPlugin: (app: FastifyInstance) => Promise<void>;
declare module 'fastify' {
    interface FastifyInstance {
        auth: typeof auth;
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
    interface FastifyRequest {
        user?: any;
        session?: any;
    }
}
//# sourceMappingURL=auth.d.ts.map