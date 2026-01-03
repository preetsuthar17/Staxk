import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSettingsSidebar } from "@/components/workspace/workspace-settings-sidebar";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/workspace";

interface WorkspaceSettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "workspace-slug": string }>;
}

async function WorkspaceSettingsLayoutContent({
  children,
  slug,
}: {
  children: React.ReactNode;
  slug: string;
}) {
  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/login");
  }

  const userId = sessionData.user.id;
  const workspace = await getWorkspaceBySlug(slug, userId);

  if (!workspace) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <WorkspaceSettingsSidebar workspaceSlug={slug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Button
            aria-label="Go to workspace"
            className="h-fit w-fit p-0"
            size="sm"
            variant="outline"
          >
            <Link
              className="flex h-8 items-center justify-center px-3.5"
              href={`/${slug}`}
            >
              <span className="font-[490] text-sm">Go to Workspace</span>
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

function WorkspaceSettingsLayoutSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export default async function WorkspaceSettingsLayout({
  children,
  params,
}: WorkspaceSettingsLayoutProps) {
  const { "workspace-slug": slug } = await params;

  return (
    <Suspense fallback={<WorkspaceSettingsLayoutSkeleton />}>
      <WorkspaceSettingsLayoutContent slug={slug}>
        {children}
      </WorkspaceSettingsLayoutContent>
    </Suspense>
  );
}
