"use client";

import { IconCheck, IconSettings, IconUsersGroup } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProjectAvatar } from "@/components/project/project-avatar";
import { TeamAvatar } from "@/components/team/team-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ProjectTeamInfo {
  id: string;
  name: string;
  identifier: string;
  icon: string | null;
  color: string | null;
}

interface ProjectDetailData {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: "active" | "archived" | "completed";
  teamCount: number;
  teams: ProjectTeamInfo[];
}

const statusConfig = {
  active: { label: "Active", variant: "default" as const },
  archived: { label: "Archived", variant: "secondary" as const },
  completed: { label: "Completed", variant: "outline" as const },
};

const NAME_DEBOUNCE_MS = 500;
const CHECKMARK_DURATION_MS = 2500;

export default function ProjectDetailPage() {
  const params = useParams();
  const workspaceSlug = params["workspace-slug"] as string;
  const projectIdentifier = params["project-identifier"] as string;

  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nameValue, setNameValue] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [showNameCheckmark, setShowNameCheckmark] = useState(false);
  const [isSavingIcon, setIsSavingIcon] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialNameRef = useRef<string>("");

  const fetchProjectData = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/project/${encodeURIComponent(projectIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      setProject(data.project);
      setNameValue(data.project.name);
      initialNameRef.current = data.project.name;
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, projectIdentifier]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (checkmarkTimeoutRef.current) {
        clearTimeout(checkmarkTimeoutRef.current);
      }
    };
  }, []);

  const saveProjectField = useCallback(
    async (field: string, value: string | null) => {
      if (!project) {
        return false;
      }

      try {
        const response = await fetch(
          `/api/project/${encodeURIComponent(project.identifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to update ${field}`);
        }

        const data = await response.json();
        setProject((prev) =>
          prev ? { ...prev, [field]: data.project[field] } : null
        );
        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : `Failed to update ${field}`
        );
        return false;
      }
    },
    [project, workspaceSlug]
  );

  const handleNameChange = useCallback(
    (value: string) => {
      setNameValue(value);

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      if (!value.trim() || value.trim() === initialNameRef.current) {
        return;
      }

      debounceTimeoutRef.current = setTimeout(async () => {
        setIsSavingName(true);
        setShowNameCheckmark(false);

        const success = await saveProjectField("name", value.trim());

        if (success) {
          initialNameRef.current = value.trim();
          setShowNameCheckmark(true);
          if (checkmarkTimeoutRef.current) {
            clearTimeout(checkmarkTimeoutRef.current);
          }
          checkmarkTimeoutRef.current = setTimeout(() => {
            setShowNameCheckmark(false);
          }, CHECKMARK_DURATION_MS);
        } else {
          setNameValue(initialNameRef.current);
        }

        setIsSavingName(false);
      }, NAME_DEBOUNCE_MS);
    },
    [saveProjectField]
  );

  const handleIconChange = useCallback(
    async (emoji: string) => {
      setIsSavingIcon(true);
      await saveProjectField("icon", emoji);
      setIsSavingIcon(false);
    },
    [saveProjectField]
  );

  const handleIconRemove = useCallback(async () => {
    setIsSavingIcon(true);
    await saveProjectField("icon", null);
    setIsSavingIcon(false);
  }, [saveProjectField]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <Skeleton className="size-16 rounded-lg" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Link href={`/${workspaceSlug}/projects`}>
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const statusInfo = statusConfig[project.status];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="relative">
              <EmojiPicker
                disabled={isSavingIcon}
                onChange={handleIconChange}
                onRemove={handleIconRemove}
                trigger={
                  <button
                    className={cn(
                      "group relative flex size-16 items-center justify-center rounded-xl border-2 border-transparent border-dashed text-4xl transition-[color,background-color,border-color,box-shadow] hover:border-muted-foreground/30 hover:bg-accent/50",
                      !project.icon && "border-muted-foreground/20 bg-muted/50"
                    )}
                    disabled={isSavingIcon}
                    type="button"
                  >
                    {(() => {
                      if (isSavingIcon) {
                        return <Spinner className="size-6" />;
                      }
                      if (project.icon) {
                        return <span>{project.icon}</span>;
                      }
                      return (
                        <ProjectAvatar
                          className="size-14"
                          color={project.color}
                          icon={null}
                          identifier={project.identifier}
                          name={project.name}
                          size="lg"
                        />
                      );
                    })()}
                    <span className="absolute -right-1 -bottom-1 hidden rounded bg-background px-1 text-[10px] text-muted-foreground shadow-sm group-hover:block">
                      {project.icon ? "Change" : "Add icon"}
                    </span>
                  </button>
                }
                value={project.icon}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    className="min-w-[100px] border-none bg-transparent font-semibold text-3xl outline-none focus:ring-0"
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.currentTarget.blur();
                      }
                    }}
                    ref={nameInputRef}
                    spellCheck={false}
                    style={{ width: `${Math.max(nameValue.length + 1, 10)}ch` }}
                    type="text"
                    value={nameValue}
                  />
                  {(isSavingName || showNameCheckmark) && (
                    <div className="ml-2 flex items-center">
                      {isSavingName ? (
                        <Spinner className="size-4 text-muted-foreground" />
                      ) : (
                        <IconCheck className="size-4 text-primary" />
                      )}
                    </div>
                  )}
                </div>
                <Badge className="shrink-0" variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              </div>
              <span className="text-muted-foreground">
                {project.identifier}
              </span>
            </div>
          </div>

          <Link
            href={`/${workspaceSlug}/projects/${projectIdentifier}/settings`}
          >
            <Button size="sm" variant="outline">
              <IconSettings className="mr-1.5 size-4" />
              Settings
            </Button>
          </Link>
        </div>

        {project.description && (
          <p className="max-w-2xl text-muted-foreground">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <IconUsersGroup className="size-5 text-muted-foreground" />
          <h2 className="font-medium text-lg">
            Teams ({project.teams.length})
          </h2>
        </div>

        {project.teams.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No teams assigned to this project yet
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {project.teams.map((team) => (
              <Link
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                href={`/${workspaceSlug}/teams/${team.identifier}`}
                key={team.id}
              >
                <TeamAvatar
                  icon={team.icon}
                  identifier={team.identifier}
                  name={team.name}
                  size="md"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{team.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {team.identifier}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
