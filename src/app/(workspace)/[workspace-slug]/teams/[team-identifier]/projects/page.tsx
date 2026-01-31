"use client";

import { IconFolder, IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { ProjectListView } from "@/components/project/project-list-view";
import { TeamAvatar } from "@/components/team/team-avatar";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectData } from "@/lib/project";
import type { TeamData } from "@/lib/team";

interface TeamDetailData extends Omit<TeamData, "memberCount" | "userRole"> {
  memberCount: number;
  userRole: "lead" | "member" | null;
}

export default function TeamProjectsPage() {
  const params = useParams();
  const workspaceSlug = params["workspace-slug"] as string;
  const teamIdentifier = params["team-identifier"] as string;

  const [team, setTeam] = useState<TeamDetailData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [teamResponse, projectsResponse] = await Promise.all([
        fetch(
          `/api/team/${encodeURIComponent(teamIdentifier)}?workspaceSlug=${encodeURIComponent(workspaceSlug)}`
        ),
        fetch(
          `/api/project/list?workspaceSlug=${encodeURIComponent(workspaceSlug)}&teamIdentifier=${encodeURIComponent(teamIdentifier)}`
        ),
      ]);

      if (!teamResponse.ok) {
        throw new Error("Failed to fetch team");
      }

      const teamData = await teamResponse.json();
      setTeam(teamData.team);

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
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
            icon={team.icon}
            identifier={team.identifier}
            name={team.name}
            size="md"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-xl">{team.name}</h1>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">Projects</span>
            </div>
            <span className="text-muted-foreground text-sm">
              {team.identifier}
            </span>
          </div>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="sm">
          <IconPlus className="size-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Empty>
          <IconFolder className="size-10 text-muted-foreground" />
          <EmptyTitle>No projects assigned</EmptyTitle>
          <EmptyDescription>
            Projects assigned to {team.name} will appear here. Create a new
            project or assign this team to an existing one.
          </EmptyDescription>
          <Button onClick={() => setCreateDialogOpen(true)} variant="link">
            Create a project
          </Button>
        </Empty>
      ) : (
        <ProjectListView
          onCreateProject={() => setCreateDialogOpen(true)}
          projects={projects}
          workspaceSlug={workspaceSlug}
        />
      )}

      <CreateProjectDialog
        defaultTeamId={team.id}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchData}
        open={createDialogOpen}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}
