"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar/sidebar";

export function WorkspaceLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSettingsRoute = pathname?.includes("/settings");

  if (isSettingsRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
