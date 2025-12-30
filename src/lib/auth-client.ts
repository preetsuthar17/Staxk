import { passkeyClient } from "@better-auth/passkey/client";
import {
  lastLoginMethodClient,
  twoFactorClient,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";

function clearAuthCookies() {
  if (typeof document === "undefined") {
    return;
  }

  const cookies = document.cookie.split(";");
  const domain = window.location.hostname;
  const path = "/";

  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

    if (name.startsWith("staxk")) {
      // biome-ignore lint/suspicious/noDocumentCookie: Intentionally using document.cookie to clear auth cookies
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
      // biome-ignore lint/suspicious/noDocumentCookie: Intentionally using document.cookie to clear auth cookies
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
      // biome-ignore lint/suspicious/noDocumentCookie: Intentionally using document.cookie to clear auth cookies
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain};`;
    }
  }
}

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  plugins: [
    lastLoginMethodClient(),
    passkeyClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/login?verify=2fa";
      },
    }),
    usernameClient(),
  ],
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
        clearAuthCookies();
        toast.error(
          "Authentication cookies cleared. Please try logging in again.",
          {
            duration: 5000,
          }
        );
      }
    },
  },
  session: {
    fetchOnWindowFocus: false,
    refetchInterval: 0,
    refetchOnMount: false,
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  changePassword,
  updateUser,
} = authClient;
