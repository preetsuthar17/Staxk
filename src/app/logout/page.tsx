"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await authClient.signOut();
        router.push("/login");
        router.refresh();
      } catch (error) {
        toast.error("Error during logout");
        router.push("/login");
        router.refresh();
      }
    };

    logout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
      </div>
    </div>
  );
}
