"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LoginCard } from "@/components/authentication/login-card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const hasRedirected = useRef(false);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    if (!isPending) {
      initialLoadComplete.current = true;
    }
    if (!isPending && session && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/");
      router.refresh();
    }
  }, [session, isPending, router]);

  if (isPending && !initialLoadComplete.current) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Spinner />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <LoginCard />
    </div>
  );
}
