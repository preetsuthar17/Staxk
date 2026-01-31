"use client";

import { IconUsersGroup } from "@tabler/icons-react";
import { ProjectAvatar } from "./project-avatar";

interface ProjectRowProps {
  id: string;
  name: string;
  identifier: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  status: "active" | "archived" | "completed";
  teamCount: number;
  onClick?: () => void;
}

const statusConfig = {
  active: { label: "Active", variant: "default" as const },
  archived: { label: "Archived", variant: "secondary" as const },
  completed: { label: "Completed", variant: "outline" as const },
};

export function ProjectRow({
  name,
  identifier,
  icon,
  color,
  status,
  teamCount,
  onClick,
}: ProjectRowProps) {
  const _statusInfo = statusConfig[status];

  return (
    <button
      className="flex w-full items-center gap-4 bg-card p-4 text-left transition-none hover:bg-accent/50"
      onClick={onClick}
      type="button"
    >
      <div className="flex flex-1 items-center gap-3 overflow-hidden">
        {icon ? (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/50 text-lg">
            {icon}
          </div>
        ) : (
          <ProjectAvatar
            className="shrink-0"
            color={color}
            icon={null}
            identifier={identifier}
            name={name}
            size="md"
          />
        )}

        <span className="truncate font-medium text-sm">{name}</span>

        <div className="flex-1" />

        <div className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          <IconUsersGroup className="size-3.5" />
          <span>{teamCount}</span>
        </div>
      </div>
    </button>
  );
}
