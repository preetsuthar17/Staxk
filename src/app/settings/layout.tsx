import Image from "next/image";
import { Suspense } from "react";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSession } from "@/lib/auth-utils";

function SettingsContentLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          alt="Logo"
          className="animate-pulse grayscale"
          height={32}
          src="/logo.svg"
          width={32}
        />
        <p className="font-[450] text-muted-foreground text-sm">
          Loading settings
        </p>
      </div>
    </div>
  );
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<SettingsContentLoading />}>{children}</Suspense>
      </main>
    </div>
  );
}
