"use client";

import { IconUsersGroup } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProjectAvatar } from "./project-avatar";

interface ProjectCardProps {
  id: string;
  name: string;
  identifier: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  status: "active" | "archived" | "completed";
  teamCount: number;
  workspaceSlug: string;
}

const statusConfig = {
  active: { label: "Active", variant: "default" as const },
  archived: { label: "Archived", variant: "secondary" as const },
  completed: { label: "Completed", variant: "outline" as const },
};

export function ProjectCard({
  name,
  identifier,
  description,
  icon,
  color,
  status,
  teamCount,
  workspaceSlug,
}: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${workspaceSlug}/projects/${identifier}`);
  };

  const statusInfo = statusConfig[status];

  return (
    <button
      className="group flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-[color,background-color,border-color,box-shadow] hover:bg-accent/50 hover:shadow-md"
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted/50 text-2xl transition-transform group-hover:scale-105">
              {icon}
            </div>
          ) : (
            <ProjectAvatar
              className="transition-transform group-hover:scale-105"
              color={color}
              icon={null}
              identifier={identifier}
              name={name}
              size="lg"
            />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-xs">{identifier}</span>
          </div>
        </div>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>
      {description && (
        <p className="line-clamp-2 text-muted-foreground text-sm">
          {description}
        </p>
      )}
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <IconUsersGroup className="size-3.5" />
        <span>
          {teamCount} {teamCount === 1 ? "team" : "teams"}
        </span>
      </div>
    </button>
  );
}
