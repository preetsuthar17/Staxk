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

  const is2FAVerify = searchParams.get("verify") === "2fa";

  useEffect(() => {
    if (session && !hasRedirected.current && !isPending) {
      hasRedirected.current = true;
      router.replace("/");
    }
  }, [session, isPending, router]);

  if (isPending && !session) {
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
