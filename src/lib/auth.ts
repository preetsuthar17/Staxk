import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { lastLoginMethod } from "better-auth/plugins";
import { db } from "@/db";
import { account, rateLimit, session, user, verification } from "@/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      rateLimit,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [lastLoginMethod()],
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
  ],
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60, // time window in seconds
    max: 100, // max requests in the window
    storage: "database",
    customRules: {
      "/sign-in/email": {
        window: 10,
        max: 3,
      },
    },
  },
});
