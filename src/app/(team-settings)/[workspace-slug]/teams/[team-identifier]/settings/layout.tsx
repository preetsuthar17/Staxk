import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TeamSettingsSidebar } from "@/components/team/team-settings-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/auth";
import { getTeamByIdentifier } from "@/lib/team";

interface TeamSettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "workspace-slug": string; "team-identifier": string }>;
}

async function TeamSettingsLayoutContent({
  children,
  workspaceSlug,
  teamIdentifier,
}: {
  children: React.ReactNode;
  workspaceSlug: string;
  teamIdentifier: string;
}) {
  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/login");
  }

  const userId = sessionData.user.id;
  const team = await getTeamByIdentifier(workspaceSlug, teamIdentifier, userId);

  if (!team) {
    redirect(`/${workspaceSlug}/teams`);
  }

  const canManage =
    team.userRole === "lead" ||
    team.workspaceRole === "owner" ||
    team.workspaceRole === "admin";

  if (!canManage) {
    redirect(`/${workspaceSlug}/teams/${teamIdentifier}`);
  }

  return (
    <SidebarProvider>
      <TeamSettingsSidebar
        teamIdentifier={teamIdentifier}
        workspaceSlug={workspaceSlug}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Button
            aria-label="Go to team"
            className="h-fit w-fit p-0"
            size="sm"
            variant="outline"
          >
            <Link
              className="flex h-8 items-center justify-center px-3.5"
              href={`/${workspaceSlug}/teams/${teamIdentifier}`}
            >
              <span className="font-[490] text-sm">Go to Team</span>
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

function TeamSettingsLayoutSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export default async function TeamSettingsLayout({
  children,
  params,
}: TeamSettingsLayoutProps) {
  const { "workspace-slug": workspaceSlug, "team-identifier": teamIdentifier } =
    await params;

  return (
    <Suspense fallback={<TeamSettingsLayoutSkeleton />}>
      <TeamSettingsLayoutContent
        teamIdentifier={teamIdentifier}
        workspaceSlug={workspaceSlug}
      >
        {children}
      </TeamSettingsLayoutContent>
    </Suspense>
  );
}
