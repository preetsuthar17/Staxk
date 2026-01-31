"use client";

import { IconPlus, IconStack2 } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateIssueDialog } from "@/components/issue/create-issue-dialog";
import { IssueList } from "@/components/issue/issue-list";
import { TeamAvatar } from "@/components/team/team-avatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { IssueData } from "@/lib/issue";
import type { TeamData } from "@/lib/team";

interface TeamDetailData extends Omit<TeamData, "memberCount" | "userRole"> {
  memberCount: number;
  userRole: "lead" | "member" | null;
}

export default function TeamIssuesPage() {
  const params = useParams();
  const workspaceSlug = params["workspace-slug"] as string;
  const teamIdentifier = params["team-identifier"] as string;

  const [team, setTeam] = useState<TeamDetailData | null>(null);
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [teamResponse, issuesResponse] = await Promise.all([
        fetch(
          `/api/team/${encodeURIComponent(teamIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
        ),
        fetch(
          `/api/issue/list?workspaceSlug=${encodeURIComponent(workspaceSlug)}&teamIdentifier=${encodeURIComponent(teamIdentifier)}`
        ),
      ]);

      if (!teamResponse.ok) {
        throw new Error("Failed to fetch team");
      }

      const teamData = await teamResponse.json();
      setTeam(teamData.team);

      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        setIssues(issuesData.issues || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load team");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, teamIdentifier]);

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
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-md" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
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

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">Team not found</p>
        <Link href={`/${workspaceSlug}`}>
          <Button variant="outline">Back to Workspace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TeamAvatar
            color={team.color}
            icon={team.icon}
            identifier={team.identifier}
            name={team.name}
            size="md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-xl">{team.name}</h1>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Issues</span>
            </div>
            <span className="text-muted-foreground text-sm">
              {team.identifier}
            </span>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <IconPlus className="size-4" />
          New Issue
        </Button>
      </div>

      {issues.length === 0 ? (
        <Empty>
          <IconStack2 className="size-10 text-muted-foreground" />
          <EmptyTitle className="font-medium tracking-normal">
            No issues yet
          </EmptyTitle>
          <EmptyDescription>
            Issues from projects assigned to {team.name} will appear here.
            Create an issue to get started.
          </EmptyDescription>
          <button
            className="mt-2 text-primary text-sm hover:underline"
            onClick={() => setCreateDialogOpen(true)}
            type="button"
          >
            Create an issue
          </button>
        </Empty>
      ) : (
        <IssueList
          issues={issues}
          onCreateIssue={() => setCreateDialogOpen(true)}
          onIssueDeleted={fetchData}
          onIssueUpdated={fetchData}
        />
      )}

      <CreateIssueDialog
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        open={createDialogOpen}
        teamIdentifier={teamIdentifier}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
