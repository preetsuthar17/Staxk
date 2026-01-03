"use client";

import { WorkspaceGeneralCard } from "@/components/settings/workspace-general-card";

export default function WorkspaceSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-2xl">General</h1>
      </div>
      <div className="flex flex-col gap-4">
        <WorkspaceGeneralCard />
      </div>
    </div>
  );
}
