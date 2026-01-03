import { WorkspaceGeneralCard } from "@/components/workspace/workspace-general-card";

interface WorkspaceSettingsPageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default async function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { "workspace-slug": slug } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">General</h1>
      </div>
      <div className="flex flex-col gap-4">
        <WorkspaceGeneralCard workspaceSlug={slug} />
      </div>
    </div>
  );
}
