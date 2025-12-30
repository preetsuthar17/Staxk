"use client";

import type { Session, User } from "better-auth";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SessionProvider } from "./session-provider";

type SessionData = {
  session: Session;
  user: User;
} | null;

export function SessionWrapper({ children }: { children: ReactNode }) {
  const [initialSession, setInitialSession] = useState<SessionData>(null);

  useEffect(() => {
    authClient
      .getSession()
      .then((result) => {
        setInitialSession(result.data ?? null);
      })
      .catch(() => {
        setInitialSession(null);
      });
  }, []);

  return (
    <SessionProvider initialSession={initialSession}>
      {children}
    </SessionProvider>
  );
}
