"use client";

import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCheck,
  IconTrash,
} from "@tabler/icons-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProjectAvatar } from "@/components/project/project-avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

interface ProjectData {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: "active" | "archived" | "completed";
}

const NAME_DEBOUNCE_MS = 500;
const DESCRIPTION_DEBOUNCE_MS = 500;
const CHECKMARK_DURATION_MS = 2500;
const MAX_DESCRIPTION_LENGTH = 500;

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = params["workspace-slug"] as string;
  const projectIdentifier = params["project-identifier"] as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "archived" | "completed">(
    "active"
  );

  const [isSavingName, setIsSavingName] = useState(false);
  const [showNameCheckmark, setShowNameCheckmark] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [showDescriptionCheckmark, setShowDescriptionCheckmark] =
    useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingIcon, setIsSavingIcon] = useState(false);

  const nameDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const nameCheckmarkRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionCheckmarkRef = useRef<NodeJS.Timeout | null>(null);
  const initialNameRef = useRef<string>("");
  const initialDescriptionRef = useRef<string>("");

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/project/${encodeURIComponent(projectIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }

      const data = await response.json();
      setProject(data.project);
      setName(data.project.name);
      setDescription(data.project.description || "");
      setStatus(data.project.status);
      initialNameRef.current = data.project.name;
      initialDescriptionRef.current = data.project.description || "";
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, projectIdentifier]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    return () => {
      if (nameDebounceRef.current) {
        clearTimeout(nameDebounceRef.current);
      }
      if (descriptionDebounceRef.current) {
        clearTimeout(descriptionDebounceRef.current);
      }
      if (nameCheckmarkRef.current) {
        clearTimeout(nameCheckmarkRef.current);
      }
      if (descriptionCheckmarkRef.current) {
        clearTimeout(descriptionCheckmarkRef.current);
      }
    };
  }, []);

  const saveField = useCallback(
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

  useEffect(() => {
    if (nameDebounceRef.current) {
      clearTimeout(nameDebounceRef.current);
    }

    if (name === initialNameRef.current || !name.trim()) {
      return;
    }

    nameDebounceRef.current = setTimeout(async () => {
      setIsSavingName(true);
      setShowNameCheckmark(false);

      const success = await saveField("name", name.trim());

      if (success) {
        initialNameRef.current = name.trim();
        setShowNameCheckmark(true);
        if (nameCheckmarkRef.current) {
          clearTimeout(nameCheckmarkRef.current);
        }
        nameCheckmarkRef.current = setTimeout(() => {
          setShowNameCheckmark(false);
        }, CHECKMARK_DURATION_MS);
      } else {
        setName(initialNameRef.current);
      }

      setIsSavingName(false);
    }, NAME_DEBOUNCE_MS);
  }, [name, saveField]);

  useEffect(() => {
    if (descriptionDebounceRef.current) {
      clearTimeout(descriptionDebounceRef.current);
    }

    const trimmedDescription = description.trim() || null;
    if (trimmedDescription === initialDescriptionRef.current) {
      return;
    }

    descriptionDebounceRef.current = setTimeout(async () => {
      setIsSavingDescription(true);
      setShowDescriptionCheckmark(false);

      const success = await saveField("description", trimmedDescription);

      if (success) {
        initialDescriptionRef.current = trimmedDescription || "";
        setShowDescriptionCheckmark(true);
        if (descriptionCheckmarkRef.current) {
          clearTimeout(descriptionCheckmarkRef.current);
        }
        descriptionCheckmarkRef.current = setTimeout(() => {
          setShowDescriptionCheckmark(false);
        }, CHECKMARK_DURATION_MS);
      } else {
        setDescription(initialDescriptionRef.current);
      }

      setIsSavingDescription(false);
    }, DESCRIPTION_DEBOUNCE_MS);
  }, [description, saveField]);

  const handleStatusChange = async (
    newStatus: "active" | "archived" | "completed"
  ) => {
    setIsSavingStatus(true);
    const success = await saveField("status", newStatus);
    if (success) {
      setStatus(newStatus);
    }
    setIsSavingStatus(false);
  };

  const handleIconChange = async (emoji: string) => {
    setIsSavingIcon(true);
    await saveField("icon", emoji);
    setIsSavingIcon(false);
  };

  const handleIconRemove = async () => {
    setIsSavingIcon(true);
    await saveField("icon", null);
    setIsSavingIcon(false);
  };

  const handleDelete = async () => {
    if (!project || deleteConfirmText !== project.name) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/project/${encodeURIComponent(project.identifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete project");
      }

      toast.success("Project deleted successfully");
      router.push(`/${workspaceSlug}/projects`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      );
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-64 w-full max-w-xl" />
        <Skeleton className="h-48 w-full max-w-xl" />
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href={`/${workspaceSlug}/projects/${projectIdentifier}`}>
          <Button size="icon" variant="ghost">
            <IconArrowLeft className="size-5" />
          </Button>
        </Link>
        <div className="flex flex-col">
          <h1 className="font-medium text-2xl">Project Settings</h1>
          <p className="text-muted-foreground text-sm">{project.name}</p>
        </div>
      </div>

      <Card className="max-w-xl bg-transparent">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your project information and appearance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <Label>Icon</Label>
              <EmojiPicker
                disabled={isSavingIcon}
                onChange={handleIconChange}
                onRemove={handleIconRemove}
                trigger={
                  <button
                    className="flex size-10 items-center justify-center rounded-md border text-xl transition-colors hover:bg-accent"
                    disabled={isSavingIcon}
                    type="button"
                  >
                    {(() => {
                      if (isSavingIcon) {
                        return <Spinner className="size-4" />;
                      }
                      if (project.icon) {
                        return project.icon;
                      }
                      return (
                        <ProjectAvatar
                          color={project.color}
                          icon={null}
                          identifier={project.identifier}
                          name={project.name}
                          size="md"
                        />
                      );
                    })()}
                  </button>
                }
                value={project.icon}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
                htmlFor="name"
              >
                Name
                <div className="relative w-full sm:max-w-xs">
                  <Input
                    className="pr-8"
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Project name..."
                    value={name}
                  />
                  {(isSavingName || showNameCheckmark) && (
                    <div className="absolute top-1/2 right-2.5 -translate-y-1/2">
                      {isSavingName ? (
                        <Spinner className="size-4 text-muted-foreground" />
                      ) : (
                        <IconCheck className="size-4 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"
                htmlFor="status"
              >
                Status
                <div className="relative w-full sm:max-w-xs">
                  <Select
                    disabled={isSavingStatus}
                    onValueChange={(value) =>
                      handleStatusChange(
                        value as "active" | "archived" | "completed"
                      )
                    }
                    value={status}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSavingStatus && (
                    <div className="absolute top-1/2 right-10 -translate-y-1/2">
                      <Spinner className="size-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start"
                htmlFor="description"
              >
                <div className="flex flex-col gap-1">
                  Description
                  <span className="text-muted-foreground text-xs">
                    {description.length}/{MAX_DESCRIPTION_LENGTH} characters
                  </span>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Textarea
                    className="min-h-24 resize-y pr-8"
                    id="description"
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description..."
                    value={description}
                  />
                  {(isSavingDescription || showDescriptionCheckmark) && (
                    <div className="absolute top-2.5 right-2.5">
                      {isSavingDescription ? (
                        <Spinner className="size-4 text-muted-foreground" />
                      ) : (
                        <IconCheck className="size-4 text-primary" />
                      )}
                    </div>
                  )}
                </div>
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-xl border-destructive/50 bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <IconAlertTriangle className="size-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that can affect your project data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">Delete this project</h3>
                <p className="text-muted-foreground text-sm">
                  Once you delete a project, there is no going back. All issues
                  and data associated with this project will be permanently
                  removed.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button className="w-fit" size="sm" variant="destructive">
                    <IconTrash className="mr-1.5 size-4" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the project <strong>{project.name}</strong> and all of its
                      data including issues and team assignments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex flex-col gap-2 py-4">
                    <Label htmlFor="confirm-delete">
                      Type <strong>{project.name}</strong> to confirm:
                    </Label>
                    <Input
                      id="confirm-delete"
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={project.name}
                      value={deleteConfirmText}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={
                        deleteConfirmText !== project.name || isDeleting
                      }
                      onClick={handleDelete}
                    >
                      {isDeleting ? (
                        <>
                          <Spinner className="mr-2 size-4" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Project"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
