"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar/sidebar";

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
    <div className="flex h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full px-4 py-8">
          <div className="flex flex-col gap-6 w-full">
            <div>
              <h1 className="font-medium text-2xl">
                Welcome to {workspace.name}
              </h1>
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
      </main>
    </div>
  );
}
