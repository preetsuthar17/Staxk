"use client";

import { IconFolder } from "@tabler/icons-react";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import type { ProjectData } from "@/lib/project";
import { ProjectCard } from "./project-card";

interface ProjectListProps {
  projects: ProjectData[];
  workspaceSlug: string;
  onCreateProject?: () => void;
}

export function ProjectList({
  projects,
  workspaceSlug,
  onCreateProject,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Empty>
        <IconFolder className="size-10 text-muted-foreground" />
        <EmptyTitle className="font-medium tracking-normal">
          No projects yet
        </EmptyTitle>
        <EmptyDescription>
          Create your first project to organize and track work across your
          workspace.
        </EmptyDescription>
        {onCreateProject && (
          <button
            className="mt-2 text-primary text-sm hover:underline"
            onClick={onCreateProject}
            type="button"
          >
            Create a project
          </button>
        )}
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          color={project.color}
          description={project.description}
          icon={project.icon}
          id={project.id}
          identifier={project.identifier}
          key={project.id}
          name={project.name}
          status={project.status}
          teamCount={project.teamCount}
          workspaceSlug={workspaceSlug}
        />
      ))}
    </div>
  );
}
