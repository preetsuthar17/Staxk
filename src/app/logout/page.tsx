"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/lib/auth-client";

export default function LogoutPage() {
  const router = useRouter();
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) {
      return;
    }
    hasLoggedOut.current = true;

    signOut().then(() => {
      router.push("/login");
      router.refresh();
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-muted-foreground text-sm">Signing out</p>
      </div>
    </div>
  );
}
