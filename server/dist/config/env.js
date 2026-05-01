import { z } from 'zod';
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(16),
    BETTER_AUTH_URL: z.string().url(),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.coerce.number().default(1025),
    SMTP_FROM: z.string().email(),
    VALHALLA_URL: z.string().url().default('http://localhost:8002'),
    EXPO_ACCESS_TOKEN: z.string().optional(),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});
export function loadEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('Invalid environment variables:', result.error.format());
        process.exit(1);
    }
    return result.data;
}
export const env = loadEnv();
//# sourceMappingURL=env.js.map