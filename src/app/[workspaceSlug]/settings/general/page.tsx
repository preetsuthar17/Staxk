import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GeneralSettings } from "@/components/settings/workspace-settings/general-settings";
import { WorkspaceSettingsSidebar } from "@/components/settings/workspace-settings/workspace-settings-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";

async function getWorkspaceData(slug: string) {
  "use cache";
  const workspaceData = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
    })
    .from(workspace)
    .where(eq(workspace.slug, slug))
    .limit(1);

  return workspaceData[0] || null;
}

async function checkMembership(workspaceId: string, userId: string) {
  "use cache";
  const membership = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  return membership.length > 0;
}

async function getWorkspace(slug: string, userId: string) {
  const ws = await getWorkspaceData(slug);

  if (!ws) {
    return null;
  }

  if (ws.ownerId === userId) {
    return ws;
  }

  const hasMembership = await checkMembership(ws.id, userId);

  if (!hasMembership) {
    return null;
  }

  return ws;
}

async function GeneralSettingsContent({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    notFound();
  }

  const workspaceData = await getWorkspace(workspaceSlug, session.user.id);

  if (!workspaceData) {
    notFound();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <WorkspaceSettingsSidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl p-6">
          <GeneralSettings workspace={workspaceData} />
        </div>
      </main>
    </div>
  );
}

function GeneralSettingsLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="font-[450] text-muted-foreground text-sm">Loading</p>
      </div>
    </div>
  );
}

export default function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  return (
    <Suspense fallback={<GeneralSettingsLoading />}>
      <GeneralSettingsContent params={params} />
    </Suspense>
  );
}
