import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InviteMemberDialog } from "@/components/workspace/invite-member-dialog";
import { WorkspaceInvitationsCard } from "@/components/workspace/workspace-invitations-card";
import { WorkspaceMembersCard } from "@/components/workspace/workspace-members-card";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/workspace";

interface MembersPageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { "workspace-slug": slug } = await params;
  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/login");
  }

  const userId = sessionData.user.id;
  const workspaceData = await getWorkspaceBySlug(slug, userId);

  if (!workspaceData) {
    redirect("/workspaces");
  }

  const canManage =
    workspaceData.role === "owner" || workspaceData.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-medium text-2xl">Members</h1>
          <p className="text-muted-foreground text-sm">
            Manage who has access to this workspace
          </p>
        </div>
        {canManage && <InviteMemberDialog workspaceSlug={slug} />}
      </div>

      <WorkspaceMembersCard
        currentUserId={userId}
        currentUserRole={workspaceData.role}
        workspaceSlug={slug}
      />

      {canManage && <WorkspaceInvitationsCard workspaceSlug={slug} />}
    </div>
  );
}
