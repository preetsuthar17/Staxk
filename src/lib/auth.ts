import "dotenv/config";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { lastLoginMethod, username } from "better-auth/plugins";
import { db } from "@/db";

const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;
const HTTP_PROTOCOL_REGEX = /^https?:\/\//;
const PORT_REGEX = /:\d+/;

const baseURL = process.env.BETTER_AUTH_URL;
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL environment variable is not set");
}

const getRpID = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url
      .replace(HTTP_PROTOCOL_REGEX, "")
      .replace(PORT_REGEX, "")
      .split("/")[0];
  }
};

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (username) => {
        return USERNAME_REGEX.test(username);
      },
    }),
    passkey({
      rpID: process.env.BETTER_AUTH_RP_ID || getRpID(baseURL),
      rpName: process.env.BETTER_AUTH_RP_NAME || "Staxk",
      origin: baseURL.replace(/\/$/, ""),
      authenticatorSelection: {
        authenticatorAttachment: undefined,
        residentKey: "preferred",
        userVerification: "preferred",
      },
    }),
    lastLoginMethod(),
  ],
});
