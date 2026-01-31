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

export default function WorkspaceIssuesPage() {
  const params = useParams();
  const workspaceSlug = params["workspace-slug"] as string;

  const [issues, setIssues] = useState<IssueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/issue/list?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();
      setIssues(data.issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to load issues");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleCreateSuccess = useCallback(() => {
    fetchIssues();
  }, [fetchIssues]);

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
        <h1 className="font-semibold text-2xl">My Issues</h1>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <IconPlus className="size-4" />
          New Issue
        </Button>
      </div>

      <IssueList
        issues={issues}
        onCreateIssue={() => setCreateDialogOpen(true)}
        onIssueDeleted={fetchIssues}
        onIssueUpdated={fetchIssues}
      />

      <CreateIssueDialog
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        open={createDialogOpen}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
