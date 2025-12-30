"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { SignupCard } from "@/components/authentication/signup-card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (session && !hasRedirected.current && !isPending) {
      hasRedirected.current = true;
      router.replace("/");
    }
  }, [session, isPending, router]);

  if (isPending && !session) {
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
      <SignupCard />
    </div>
  );
}
