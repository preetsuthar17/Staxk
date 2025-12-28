"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { LoginCard } from "@/components/authentication/login-card";
import { TwoFactorVerify } from "@/components/authentication/two-factor-verify";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const hasRedirected = useRef(false);
  const initialLoadComplete = useRef(false);

  const is2FAVerify = searchParams.get("verify") === "2fa";

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
    return <Spinner />;
  }

  if (session) {
    return null;
  }

  if (is2FAVerify) {
    return <TwoFactorVerify />;
  }

  return <LoginCard />;
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<Spinner />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
