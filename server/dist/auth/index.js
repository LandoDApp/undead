import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { db } from '../config/database.js';
import { env } from '../config/env.js';
import { sendMagicLinkEmail } from '../services/notification.js';
export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg' }),
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
        enabled: false,
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                await sendMagicLinkEmail(email, url);
            },
        }),
    ],
    user: {
        additionalFields: {
            displayName: {
                type: 'string',
                required: true,
                fieldName: 'display_name',
            },
        },
    },
});
//# sourceMappingURL=index.js.map