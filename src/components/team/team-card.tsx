"use client";

import { IconUsers } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { TeamAvatar } from "./team-avatar";

interface TeamCardProps {
  id: string;
  name: string;
  identifier: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  memberCount: number;
  userRole?: "lead" | "member" | null;
  workspaceSlug: string;
}

export function TeamCard({
  name,
  identifier,
  description,
  icon,
  color,
  memberCount,
  userRole,
  workspaceSlug,
}: TeamCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/${workspaceSlug}/teams/${identifier}`);
  };

  return (
    <button
      className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/50"
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <TeamAvatar
            color={color}
            icon={icon}
            identifier={identifier}
            name={name}
            size="lg"
          />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{name}</span>
            <span className="text-muted-foreground text-xs">{identifier}</span>
          </div>
        </div>
        {userRole && (
          <Badge variant={userRole === "lead" ? "default" : "secondary"}>
            {userRole === "lead" ? "Lead" : "Member"}
          </Badge>
        )}
      </div>
      {description && (
        <p className="line-clamp-2 text-muted-foreground text-sm">
          {description}
        </p>
      )}
      <div className="flex items-center gap-1 text-muted-foreground text-xs">
        <IconUsers className="size-3.5" />
        <span>
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
      </div>
    </button>
  );
}
