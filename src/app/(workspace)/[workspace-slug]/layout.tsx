import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceTracker } from "@/components/workspace/workspace-tracker";
import {
  getCachedUserWorkspaces,
  getCachedWorkspaceBySlug,
  getCachedWorkspaceTeams,
  getSession,
} from "@/lib/cached-queries";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "workspace-slug": string }>;
}

async function WorkspaceLayoutContent({
  children,
  slug,
}: {
  children: React.ReactNode;
  slug: string;
}) {
  const sessionData = await getSession();

  if (!sessionData?.user) {
    redirect("/login");
  }

  const userId = sessionData.user.id;

  const [workspace, workspaces] = await Promise.all([
    getCachedWorkspaceBySlug(slug, userId),
    getCachedUserWorkspaces(userId),
  ]);

  if (!workspace) {
    redirect("/");
  }

  const teams = await getCachedWorkspaceTeams(workspace.id, userId);

  return (
    <SidebarProvider>
      <WorkspaceTracker slug={slug} />
      <WorkspaceSidebar
        currentSlug={slug}
        initialTeams={teams}
        initialWorkspaces={workspaces}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function WorkspaceLayoutSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { "workspace-slug": slug } = await params;

  return (
    <Suspense fallback={<WorkspaceLayoutSkeleton />}>
      <WorkspaceLayoutContent slug={slug}>{children}</WorkspaceLayoutContent>
    </Suspense>
  );
}
