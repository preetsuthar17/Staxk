"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { Spinner } from "@/components/ui/spinner";

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    isOnboarded?: boolean;
  } | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        setUser(data.user);

        if (!data.user) {
          router.replace("/login");
          return;
        }

        if (data.user.isOnboarded) {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        setUser(null);
        router.replace("/login");
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

  if (!user || user.isOnboarded) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <OnboardingForm />
    </div>
  );
}
