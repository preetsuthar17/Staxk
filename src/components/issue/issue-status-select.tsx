"use client";

import { IconCopy } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IssueStatus } from "@/db/schema/issue";

import {
  IconBacklog,
  IconCancelled,
  IconDone,
  IconInProgress,
  IconTodo,
  type StatusIcon,
} from "@/utils/icons";

interface IssueStatusSelectProps {
  value: IssueStatus;
  onChange: (value: IssueStatus) => void;
  disabled?: boolean;
}

const DEFAULT_COLOR = "text-muted-foreground";

const statusConfig: Record<
  IssueStatus,
  { label: string; icon: StatusIcon; color?: string }
> = {
  backlog: {
    label: "Backlog",
    icon: IconBacklog,
  },
  todo: {
    label: "Todo",
    icon: IconTodo,
  },
  in_progress: {
    label: "In Progress",
    icon: IconInProgress,
    color: "text-yellow-500",
  },
  done: {
    label: "Done",
    icon: IconDone,
    color: "text-primary",
  },
  canceled: {
    label: "Canceled",
    icon: IconCancelled,
  },
  duplicate: {
    label: "Duplicate",
    icon: IconCopy,
  },
};

export function IssueStatusSelect({
  value,
  onChange,
  disabled,
}: IssueStatusSelectProps) {
  const currentStatus = statusConfig[value];
  const CurrentIcon = currentStatus.icon;

  return (
    <Select
      disabled={disabled}
      onValueChange={(v) => onChange(v as IssueStatus)}
      value={value}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            <CurrentIcon
              className={`size-4 ${currentStatus.color ?? DEFAULT_COLOR}`}
            />
            <span>{currentStatus.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {(
          Object.entries(statusConfig) as [
            IssueStatus,
            (typeof statusConfig)[IssueStatus],
          ][]
        ).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${config.color ?? DEFAULT_COLOR}`} />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const { icon: Icon, color } = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5">
      <Icon className={`size-4 ${color ?? DEFAULT_COLOR}`} />
    </div>
  );
}

export { statusConfig };
