import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// biome-ignore lint/performance/noNamespaceImport: Drizzle schema exports are namespace-based
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
