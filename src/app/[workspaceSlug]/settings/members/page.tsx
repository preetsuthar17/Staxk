import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MembersSettings } from "@/components/settings/workspace-settings/members-settings";
import { WorkspaceSettingsSidebar } from "@/components/settings/workspace-settings/workspace-settings-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

async function MembersSettingsContent({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  try {
    const access = await requireWorkspaceAccess(workspaceSlug);

    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <WorkspaceSettingsSidebar workspaceSlug={workspaceSlug} />
        <main className="flex-1 overflow-y-auto">
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
        </main>
      </div>
    );
  } catch {
    notFound();
  }
}

function MembersSettingsLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="font-[450] text-muted-foreground text-sm">Loading</p>
      </div>
    </div>
  );
}

export default function MembersSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  return (
    <Suspense fallback={<MembersSettingsLoading />}>
      <MembersSettingsContent params={params} />
    </Suspense>
  );
}
