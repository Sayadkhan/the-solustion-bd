import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/bd_tech_ecommerce";

declare global {
  // eslint-disable-next-line no-var
  var pgPoolGlobal: Pool | undefined;
  // eslint-disable-next-line no-var
  var drizzleDbGlobal: NodePgDatabase<typeof schema> | undefined;
}

export const pool =
  global.pgPoolGlobal ||
  new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

pool.on("error", (err) => {
  console.warn("[PostgreSQL] Connection pool event:", err.message);
});

export const db: NodePgDatabase<typeof schema> =
  global.drizzleDbGlobal || drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  global.pgPoolGlobal = pool;
  global.drizzleDbGlobal = db;
}

export type DrizzleDatabase = typeof db;
export default db;
