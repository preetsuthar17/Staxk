import { passkeyClient } from "@better-auth/passkey/client";
import {
  lastLoginMethodClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    (typeof window !== "undefined" ? window.location.origin : ""),
  plugins: [usernameClient(), passkeyClient(), lastLoginMethodClient()],
});
