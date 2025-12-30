"use client";

interface WorkspaceProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
}

export function WorkspaceDashboard({ workspace }: WorkspaceProps) {
  return (
    <div className="w-full p-4">
      <div className="flex w-full flex-col gap-6">
        <div>
          <h1 className="font-medium text-2xl">Welcome to {workspace.name}</h1>
          {workspace.description && (
            <p className="mt-2 text-muted-foreground">
              {workspace.description}
            </p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="font-medium">Projects</h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Manage your projects
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-medium">Team</h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Invite and manage team members
            </p>
          </div>
          <div className="rounded-lg border p-6">
            <h3 className="font-medium">Settings</h3>
            <p className="mt-1 text-muted-foreground text-sm">
              Configure workspace settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
