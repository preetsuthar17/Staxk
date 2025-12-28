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
      const { response, error } = context;
      if (response?.status === 429) {
        const retryAfter = response.headers.get("X-Retry-After");
        toast.error(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
      } else if (
        error?.message?.includes("ERR_RESPONSE_HEADERS_TOO_BIG") ||
        error?.message?.includes("headers too big")
      ) {
        toast.error(
          "Authentication error. Please clear your browser cookies and try again."
        );
      }
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
