"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function RootPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isPending || isRedirecting) {
      return;
    }

    if (!session) {
      router.push("/home");
      return;
    }

    setIsRedirecting(true);

    fetch("/api/user/onboarding-status")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch onboarding status");
        }
        return res.json();
      })
      .then((data) => {
        if (!data.isOnboarded) {
          router.push("/onboarding");
          return;
        }

        // User is onboarded, proceed with workspace logic
        fetch("/api/workspace/list")
          .then((res) => {
            if (!res.ok) {
              throw new Error("Failed to fetch workspaces");
            }
            return res.json();
          })
          .then((workspaceData) => {
            if (
              workspaceData.workspaces &&
              workspaceData.workspaces.length > 0
            ) {
              const firstWorkspace = workspaceData.workspaces[0];
              localStorage.setItem("currentWorkspaceId", firstWorkspace.id);
              router.push(`/${firstWorkspace.slug}`);
            } else {
              router.push("/onboarding");
            }
          })
          .catch(() => {
            router.push("/onboarding");
          });
      })
      .catch(() => {
        router.push("/onboarding");
      });
  }, [session, isPending, router, isRedirecting]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Spinner />
      <p className="font-[450] text-muted-foreground text-sm">
        Setting up your workspace
      </p>
    </div>
  );
}
