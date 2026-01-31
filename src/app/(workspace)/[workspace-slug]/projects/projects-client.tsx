"use client";

import { IconPlus } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ProjectList } from "@/components/project/project-list";
import { Button } from "@/components/ui/button";
import type { ProjectData } from "@/lib/project";

const CreateProjectDialog = dynamic(
  () =>
    import("@/components/project/create-project-dialog").then((m) => ({
      default: m.CreateProjectDialog,
    })),
  { ssr: false }
);

const preloadCreateProjectDialog = () => {
  import("@/components/project/create-project-dialog").catch(() => undefined);
};

interface ProjectsClientProps {
  initialProjects: ProjectData[];
  workspaceSlug: string;
}

export function ProjectsClient({
  initialProjects,
  workspaceSlug,
}: ProjectsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [projects] = useState(initialProjects);

  const handleCreateSuccess = (project: {
    id: string;
    name: string;
    identifier: string;
  }) => {
    startTransition(() => {
      router.refresh();
      router.push(`/${workspaceSlug}/projects/${project.identifier}`);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl">Projects</h1>
        <Button
          loading={isPending}
          onClick={() => setCreateDialogOpen(true)}
          onFocus={preloadCreateProjectDialog}
          onMouseEnter={preloadCreateProjectDialog}
          size="sm"
        >
          <IconPlus aria-hidden="true" className="size-4" />
          New Project
        </Button>
      </div>

      <ProjectList
        onCreateProject={() => setCreateDialogOpen(true)}
        projects={projects}
        workspaceSlug={workspaceSlug}
      />

      {createDialogOpen && (
        <CreateProjectDialog
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleCreateSuccess}
          open={createDialogOpen}
          workspaceSlug={workspaceSlug}
        />
      )}
    </div>
  );
}
