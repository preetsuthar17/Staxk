"use client";

import type { IssueStatus } from "@/db/schema/issue";
import { Badge } from "../ui/badge";
import { IssueStatusBadge } from "./issue-status-select";

interface IssueCardProps {
  id: string;
  number: number;
  title: string;
  status: IssueStatus;
  projectIdentifier: string;
  projectName: string;
  onClick?: () => void;
}

export function IssueCard({
  id: _id,
  number,
  title,
  status,
  projectIdentifier,
  projectName,
  onClick,
}: IssueCardProps) {
  const identifier = `${projectIdentifier}-${number}`;

  return (
    <button
      className="flex w-full items-center gap-4 bg-card p-4 text-left transition-none hover:bg-accent/50"
      onClick={onClick}
      type="button"
    >
      <div className="flex flex-1 flex-col gap-1 overflow-hidden">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IssueStatusBadge status={status} />
            <span className="font-mono text-muted-foreground text-xs">
              {identifier}
            </span>
            <span className="truncate font-medium text-sm">{title}</span>
          </div>
          <div>
            <Badge
              className="h-7 truncate px-4 font-medium text-[13px]"
              variant={"outline"}
            >
              {projectName}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  );
}
