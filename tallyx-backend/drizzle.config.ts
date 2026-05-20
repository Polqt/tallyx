/// <reference types="node" />
import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const dbCredentials = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST!,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME!,
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      ssl: false,
    };

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials,
});
