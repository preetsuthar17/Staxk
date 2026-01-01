"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/login");
        return;
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <SidebarProvider>
      <SettingsSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Button aria-label="Go to home" size="sm" variant="outline">
            <Link href="/">
              <span className="font-[490] text-[13px] text-sm">Go Home</span>
            </Link>
          </Button>
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

