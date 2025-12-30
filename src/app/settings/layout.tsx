import Image from "next/image";
import { Suspense } from "react";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSession } from "@/lib/auth-utils";

async function SettingsLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function SettingsLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
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

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </Suspense>
  );
}
