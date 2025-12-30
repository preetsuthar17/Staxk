"use client";

import type { Session, User } from "better-auth";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";

type SessionData = {
  session: Session;
  user: User;
} | null;

interface SessionContextValue {
  data: SessionData;
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const SWR_DURATION = 5 * 60 * 1000;
const MAX_CACHE_DURATION = 15 * 60 * 1000;

export function SessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: SessionData;
}) {
  const [session, setSession] = useState<SessionData>(initialSession);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastFetchRef = useRef<number>(Date.now());
  const isFetchingRef = useRef(false);

  const refetch = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsPending(true);
    setError(null);

    try {
      const result = await authClient.getSession();
      if (result.data) {
        setSession(result.data);
      } else {
        setSession(null);
      }
      lastFetchRef.current = Date.now();
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch session")
      );
    } finally {
      setIsPending(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!initialSession) {
      return;
    }

    const interval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetchRef.current;

      if (timeSinceLastFetch > MAX_CACHE_DURATION) {
        refetch();
      }
    }, SWR_DURATION);

    return () => clearInterval(interval);
  }, [initialSession, refetch]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;
        if (timeSinceLastFetch > SWR_DURATION) {
          refetch();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetch]);

  const value = useMemo<SessionContextValue>(
    () => ({
      data: session,
      isPending,
      error,
      refetch,
    }),
    [session, isPending, error, refetch]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useOptimizedSession(): SessionContextValue {
  const context = useContext(SessionContext);
  const fallbackSession = authClient.useSession();

  if (!context) {
    return {
      data: fallbackSession.data ?? null,
      isPending: fallbackSession.isPending,
      error: fallbackSession.error ?? null,
      refetch: async () => {
        await fallbackSession.refetch?.();
      },
    };
  }

  return context;
}
