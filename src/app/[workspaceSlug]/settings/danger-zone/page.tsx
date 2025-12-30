import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { DangerZone } from "@/components/settings/workspace-settings/danger-zone";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getWorkspaceData(slug: string) {
  const workspaceData = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      logo: workspace.logo,
      timezone: workspace.timezone,
      ownerId: workspace.ownerId,
      createdAt: workspace.createdAt,
    })
    .from(workspace)
    .where(eq(workspace.slug, slug))
    .limit(1);

  return workspaceData[0] || null;
}

async function checkMembership(workspaceId: string, userId: string) {
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

export default async function DangerZonePage({
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

  if (workspaceData.ownerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <DangerZone
        workspace={{
          id: workspaceData.id,
          name: workspaceData.name,
          slug: workspaceData.slug,
        }}
      />
    </div>
  );
}
