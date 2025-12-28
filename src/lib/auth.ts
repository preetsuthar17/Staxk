import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { lastLoginMethod, username } from "better-auth/plugins";
import { db } from "@/db";
import { account, rateLimit, session, user, verification } from "@/db/schema";

const USERNAME_STARTS_WITH_LETTER_REGEX = /^[a-z]/i;
const USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX = /^[a-z0-9_]+$/;

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
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update session every 24 hours
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    lastLoginMethod(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (usernameValue) => {
        // Must start with a letter
        if (!USERNAME_STARTS_WITH_LETTER_REGEX.test(usernameValue)) {
          return false;
        }
        // Only lowercase letters, numbers, and underscores
        if (!USERNAME_ALPHANUMERIC_UNDERSCORE_REGEX.test(usernameValue)) {
          return false;
        }
        // Cannot end with underscore
        if (usernameValue.endsWith("_")) {
          return false;
        }
        // Cannot have consecutive underscores
        if (usernameValue.includes("__")) {
          return false;
        }
        return true;
      },
    }),
  ],
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
      // Sign-in endpoints - stricter limits to prevent brute force
      "/sign-in/email": {
        window: 10,
        max: 3,
      },
      "/sign-in/username": {
        window: 10,
        max: 3,
      },
      "/sign-in/social": {
        window: 60,
        max: 10,
      },
      // Sign-up - prevent spam account creation
      "/sign-up/email": {
        window: 60,
        max: 5,
      },
      // Password operations - sensitive
      "/change-password": {
        window: 60,
        max: 3,
      },
      "/forgot-password": {
        window: 60,
        max: 3,
      },
      "/reset-password": {
        window: 60,
        max: 3,
      },
      // Username availability - moderate limit
      "/is-username-available": {
        window: 10,
        max: 10,
      },
      // Session operations - less strict
      "/get-session": {
        window: 10,
        max: 30,
      },
    },
  },
});
