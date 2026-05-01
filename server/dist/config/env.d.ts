import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    DATABASE_URL: z.ZodString;
    BETTER_AUTH_SECRET: z.ZodString;
    BETTER_AUTH_URL: z.ZodString;
    SMTP_HOST: z.ZodString;
    SMTP_PORT: z.ZodDefault<z.ZodNumber>;
    SMTP_FROM: z.ZodString;
    VALHALLA_URL: z.ZodDefault<z.ZodString>;
    EXPO_ACCESS_TOKEN: z.ZodOptional<z.ZodString>;
    PORT: z.ZodDefault<z.ZodNumber>;
    HOST: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_FROM: string;
    VALHALLA_URL: string;
    PORT: number;
    HOST: string;
    NODE_ENV: "development" | "production" | "test";
    EXPO_ACCESS_TOKEN?: string | undefined;
}, {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    SMTP_HOST: string;
    SMTP_FROM: string;
    SMTP_PORT?: number | undefined;
    VALHALLA_URL?: string | undefined;
    EXPO_ACCESS_TOKEN?: string | undefined;
    PORT?: number | undefined;
    HOST?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function loadEnv(): Env;
export declare const env: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_FROM: string;
    VALHALLA_URL: string;
    PORT: number;
    HOST: string;
    NODE_ENV: "development" | "production" | "test";
    EXPO_ACCESS_TOKEN?: string | undefined;
};
export {};
//# sourceMappingURL=env.d.ts.map