"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/lib/auth-client";
import { safeError } from "@/lib/logger";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut();
      } catch (error) {
        safeError("Logout error:", error);
      } finally {
        router.push("/login");
        router.refresh();
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner />
      </div>
    </div>
  );
}
