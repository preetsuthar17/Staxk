import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/workspace";

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
      <WorkspaceSidebar currentSlug={slug} />
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
