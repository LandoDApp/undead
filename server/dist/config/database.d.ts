import postgres from 'postgres';
import * as schema from '../db/schema/index.js';
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
export type Database = typeof db;
//# sourceMappingURL=database.d.ts.map