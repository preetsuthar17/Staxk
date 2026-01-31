"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ProjectAvatar } from "@/components/project/project-avatar";
import { TeamAvatar } from "@/components/team/team-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { IssueStatus } from "@/db/schema/issue";
import { IssueStatusSelect } from "./issue-status-select";

const MIN_TITLE_LENGTH = 1;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 10_000;

const issueSchema = z.object({
  title: z
    .string()
    .min(
      MIN_TITLE_LENGTH,
      `Title must be at least ${MIN_TITLE_LENGTH} character`
    )
    .max(
      MAX_TITLE_LENGTH,
      `Title must be at most ${MAX_TITLE_LENGTH} characters`
    ),
  description: z
    .string()
    .max(
      MAX_DESCRIPTION_LENGTH,
      `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
});

type IssueFormData = z.infer<typeof issueSchema>;

interface Project {
  id: string;
  name: string;
  identifier: string;
  icon: string | null;
  color: string | null;
}

interface Team {
  id: string;
  name: string;
  identifier: string;
  icon: string | null;
}

interface CreateIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  defaultProjectId?: string;
  teamIdentifier?: string;
  onSuccess?: (issue: {
    id: string;
    number: number;
    identifier: string;
  }) => void;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  workspaceSlug,
  defaultProjectId,
  teamIdentifier,
  onSuccess,
}: CreateIssueDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIdentifier, setSelectedTeamIdentifier] = useState<string>(
    teamIdentifier || ""
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    defaultProjectId || ""
  );
  const [status, setStatus] = useState<IssueStatus>("backlog");

  const showTeamSelector = !teamIdentifier;

  const form = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      title: "",
      description: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open && showTeamSelector) {
      fetch(`/api/team/list?workspaceSlug=${workspaceSlug}`)
        .then((res) => res.json())
        .then((data) => {
          setTeams(data.teams || []);
        })
        .catch(() => setTeams([]));
    }
  }, [open, workspaceSlug, showTeamSelector]);

  useEffect(() => {
    if (open) {
      const params = new URLSearchParams({ workspaceSlug });
      const activeTeamIdentifier = teamIdentifier || selectedTeamIdentifier;
      if (activeTeamIdentifier) {
        params.append("teamIdentifier", activeTeamIdentifier);
      }

      fetch(`/api/project/list?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
          if (defaultProjectId) {
            setSelectedProjectId(defaultProjectId);
          } else if (data.projects?.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          } else {
            setSelectedProjectId("");
          }
        })
        .catch(() => setProjects([]));
    }
  }, [
    open,
    workspaceSlug,
    defaultProjectId,
    teamIdentifier,
    selectedTeamIdentifier,
  ]);

  useEffect(() => {
    if (!open) {
      form.reset();
      setStatus("backlog");
      if (!defaultProjectId) {
        setSelectedProjectId("");
      }
      if (!teamIdentifier) {
        setSelectedTeamIdentifier("");
      }
    }
  }, [open, form, defaultProjectId, teamIdentifier]);

  const onSubmit = useCallback(
    async (data: IssueFormData) => {
      if (!selectedProjectId) {
        toast.error("Please select a project");
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/issue/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workspaceSlug,
            projectId: selectedProjectId,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.error || "Failed to create issue");
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        toast.success(`Issue ${result.issue.identifier} created`);
        onOpenChange(false);
        onSuccess?.(result.issue);
      } catch (error) {
        console.error("Error creating issue:", error);
        toast.error("Failed to create issue");
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceSlug, selectedProjectId, status, onOpenChange, onSuccess]
  );

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedTeam = teams.find(
    (t) => t.identifier === selectedTeamIdentifier
  );
  const activeTeamIdentifier = teamIdentifier || selectedTeamIdentifier;
  const noProjectsInTeam = activeTeamIdentifier && projects.length === 0;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create issue</DialogTitle>
          <DialogDescription>
            Add a new issue to track work in your project.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="issue-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  {...form.register("title")}
                  aria-invalid={form.formState.errors.title ? "true" : "false"}
                  autoComplete="off"
                  autoFocus
                  id="issue-title"
                  placeholder="Issue title…"
                />
                <FieldError errors={[form.formState.errors.title]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="issue-description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <FieldContent>
                <Textarea
                  {...form.register("description")}
                  aria-invalid={
                    form.formState.errors.description ? "true" : "false"
                  }
                  autoComplete="off"
                  className="min-h-[100px] resize-y"
                  id="issue-description"
                  placeholder="Add more context about this issue…"
                  rows={4}
                />
                <FieldError errors={[form.formState.errors.description]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Properties</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap items-center gap-3">
                  <IssueStatusSelect onChange={setStatus} value={status} />

                  {showTeamSelector && teams.length > 0 && (
                    <Select
                      onValueChange={(value) =>
                        value && setSelectedTeamIdentifier(value)
                      }
                      value={selectedTeamIdentifier}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          {selectedTeam ? (
                            <div className="flex items-center gap-2">
                              <TeamAvatar
                                icon={selectedTeam.icon}
                                identifier={selectedTeam.identifier}
                                name={selectedTeam.name}
                                size="xs"
                              />
                              <span>{selectedTeam.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              All teams
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          <span>All teams</span>
                        </SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.identifier}>
                            <TeamAvatar
                              icon={team.icon}
                              identifier={team.identifier}
                              name={team.name}
                              size="xs"
                            />
                            <span>{team.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {projects.length > 0 ? (
                    <Select
                      onValueChange={(value) =>
                        value && setSelectedProjectId(value)
                      }
                      value={selectedProjectId}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>
                          {selectedProject ? (
                            <div className="flex items-center gap-2">
                              <ProjectAvatar
                                className="size-4"
                                color={selectedProject.color}
                                icon={selectedProject.icon}
                                identifier={selectedProject.identifier}
                                name={selectedProject.name}
                                size="sm"
                              />
                              <span>{selectedProject.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Select project…
                            </span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <ProjectAvatar
                              className="size-4"
                              color={project.color}
                              icon={project.icon}
                              identifier={project.identifier}
                              name={project.name}
                              size="sm"
                            />
                            <span>{project.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : noProjectsInTeam ? (
                    <p className="text-muted-foreground text-sm">
                      No projects in this team
                    </p>
                  ) : null}
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading || !selectedProjectId}
              loading={isLoading}
              type="submit"
            >
              Create issue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
