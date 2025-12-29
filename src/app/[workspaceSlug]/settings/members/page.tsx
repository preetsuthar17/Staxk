import { notFound } from "next/navigation";
import { MembersSettings } from "@/components/settings/workspace-settings/members-settings";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export default async function MembersSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  try {
    const access = await requireWorkspaceAccess(workspaceSlug);

    return (
      <div className="mx-auto max-w-xl p-6">
        <MembersSettings
          userRole={access.role}
          workspace={{
            id: access.workspace.id,
            name: access.workspace.name,
            slug: access.workspace.slug,
          }}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
