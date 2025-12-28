#!/usr/bin/env tsx

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not defined");
  process.exit(1);
}

const requiredTables = [
  "user",
  "session",
  "account",
  "verification",
  "rateLimit",
];

async function checkDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }
  const sql = neon(databaseUrl);

  console.log("🔍 Checking database tables...\n");

  const missingTables: string[] = [];
  const existingTables: string[] = [];

  for (const table of requiredTables) {
    try {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        ) as exists;
      `;

      const exists = (result as { exists: boolean }[])[0]?.exists ?? false;

      if (exists) {
        existingTables.push(table);
        console.log(`✅ Table '${table}' exists`);
      } else {
        missingTables.push(table);
        console.log(`❌ Table '${table}' is missing`);
      }
    } catch (error) {
      console.error(`❌ Error checking table '${table}':`, error);
      missingTables.push(table);
    }
  }

  console.log(`\n${"=".repeat(50)}`);

  if (missingTables.length > 0) {
    console.error("\n❌ Database is missing required tables!");
    console.error("\nMissing tables:", missingTables.join(", "));
    console.error("\n📝 To fix this, run:");
    console.error("   pnpm drizzle:push");
    console.error("\n   Or generate and run migrations:");
    console.error("   pnpm drizzle:generate");
    console.error("   pnpm drizzle:migrate");
    process.exit(1);
  } else {
    console.log("\n✅ All required tables exist!");
    console.log("\n✅ Database is ready for Better Auth.");
    process.exit(0);
  }
}

checkDatabase().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
