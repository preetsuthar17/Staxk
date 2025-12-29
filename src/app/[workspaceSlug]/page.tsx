import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceDashboard } from "@/components/workspace/workspace-dashboard";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

async function WorkspaceContent({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  try {
    const access = await requireWorkspaceAccess(workspaceSlug);

    return (
      <WorkspaceDashboard
        workspace={{
          id: access.workspace.id,
          name: access.workspace.name,
          slug: access.workspace.slug,
          description: access.workspace.description,
        }}
      />
    );
  } catch {
    notFound();
  }
}

function WorkspaceLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="font-[450] text-muted-foreground text-sm">
          Loading workspace
        </p>
      </div>
    </div>
  );
}

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <WorkspaceContent params={params} />
    </Suspense>
  );
}
