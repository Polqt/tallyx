import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

const isProduction = process.env.NODE_ENV === "production";
// In production, always enforce TLS certificate verification regardless of env vars.
// The escape hatch only applies in non-production environments (e.g. local dev with self-signed certs).
const sslConfig = isProduction
  ? { rejectUnauthorized: true }
  : process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: sslConfig }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: sslConfig,
      }
);

export const db = drizzle(pool, { schema });
