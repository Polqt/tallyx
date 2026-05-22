import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const isProduction = process.env.NODE_ENV === "production";
// Railway's managed Postgres uses self-signed certs internally, so we allow
// overriding rejectUnauthorized via env var even in production.
const sslConfig = isProduction
  ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" }
  : process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
        max: 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: sslConfig,
        max: 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
      }
);

export const db = drizzle(pool, { schema });
export { pool };
