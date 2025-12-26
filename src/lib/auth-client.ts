import { lastLoginMethodClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [lastLoginMethodClient()],
  fetchOptions: {
    onError: (context) => {
      const { response } = context;
      if (response.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
        // You can add toast notification or other error handling here
        toast.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      }
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
