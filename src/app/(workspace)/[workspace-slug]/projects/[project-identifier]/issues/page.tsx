"use client";

import { IconPlus } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { IssueList } from "@/components/issue/issue-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { IssueData } from "@/lib/issue";

interface ProjectInfo {
  id: string;
  name: string;
  identifier: string;
}

export default function ProjectIssuesPage() {
  const params = useParams();
  const workspaceSlug = params["workspace-slug"] as string;
  const projectIdentifier = params["project-identifier"] as string;

  const [issues, setIssues] = useState<IssueData[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [issuesResponse, projectResponse] = await Promise.all([
        fetch(
          `/api/issue/list?workspaceSlug=${encodeURIComponent(workspaceSlug)}&projectIdentifier=${encodeURIComponent(projectIdentifier)}`
        ),
        fetch(
          `/api/project/${encodeURIComponent(projectIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
        ),
      ]);

      if (!issuesResponse.ok) {
        throw new Error("Failed to fetch issues");
      }

      const issuesData = await issuesResponse.json();
      setIssues(issuesData.issues);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, projectIdentifier]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSuccess = useCallback(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-16 w-full" key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl">
          {project?.name || projectIdentifier} Issues
        </h1>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <IconPlus className="size-4" />
          New Issue
        </Button>
      </div>

      <IssueList
        issues={issues}
        onCreateIssue={() => setCreateDialogOpen(true)}
        onIssueDeleted={fetchData}
        onIssueUpdated={fetchData}
      />

      <CreateIssueDialog
        defaultProjectId={project?.id}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        open={createDialogOpen}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
