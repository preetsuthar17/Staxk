"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthHeader } from "@/components/authentication/auth-header";
import { TwoFactorVerify } from "@/components/authentication/two-factor-verify";
import { Spinner } from "@/components/ui/spinner";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    twoFactorEnabled?: boolean;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        setUser(data.user);
        // If user is authenticated and doesn't have 2FA enabled, redirect to home
        if (data.user && !data.user.twoFactorEnabled) {
          router.replace("/home");
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        setUser(null);
      } finally {
        setIsPending(false);
      }
    };

    checkSession();
  }, [router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // If user is already authenticated without 2FA, don't render (will redirect)
  if (user && !user.twoFactorEnabled) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6 p-4">
        <AuthHeader />
        <TwoFactorVerify />
      </div>
    </div>
  );
}
