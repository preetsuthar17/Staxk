import type { ReactNode } from "react";
import { getSessionSafe } from "@/lib/auth-utils";
import { SessionProvider } from "./session-provider";

export async function SessionWrapper({ children }: { children: ReactNode }) {
  const session = await getSessionSafe();

  return <SessionProvider initialSession={session}>{children}</SessionProvider>;
}
