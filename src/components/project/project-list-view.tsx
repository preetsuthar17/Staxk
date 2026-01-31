"use client";

import { IconFolder } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type { ProjectData } from "@/lib/project";
import { Button } from "../ui/button";
import { ProjectRow } from "./project-row";

interface ProjectListViewProps {
  projects: ProjectData[];
  workspaceSlug: string;
  onCreateProject?: () => void;
}

export function ProjectListView({
  projects,
  workspaceSlug,
  onCreateProject,
}: ProjectListViewProps) {
  const router = useRouter();

  const handleProjectClick = (project: ProjectData) => {
    router.push(`/${workspaceSlug}/projects/${project.identifier}`);
  };

  if (projects.length === 0) {
    return (
      <Empty>
        <IconFolder className="size-10 text-muted-foreground" />
        <EmptyTitle className="font-medium tracking-normal">
          No projects yet
        </EmptyTitle>
        <EmptyDescription>
          Create your first project to start organizing work.
        </EmptyDescription>
        {onCreateProject && (
          <Button onClick={onCreateProject} variant="link">
            Create a project
          </Button>
        )}
      </Empty>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-border">
      {projects.map((project, index) => {
        const isFirst = index === 0;
        const isLast = index === projects.length - 1;

        return (
          <div
            className={[
              isFirst && "overflow-hidden rounded-t-lg",
              isLast && "overflow-hidden rounded-b-lg",
            ]
              .filter(Boolean)
              .join(" ")}
            key={project.id}
          >
            <ProjectRow
              color={project.color}
              description={project.description}
              icon={project.icon}
              id={project.id}
              identifier={project.identifier}
              name={project.name}
              onClick={() => handleProjectClick(project)}
              status={project.status}
              teamCount={project.teamCount}
            />

            {!isLast && <Separator />}
          </div>
        );
      })}
    </div>
  );
}
