import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { project, projectTeam } from "@/db/schema/project";
import { team } from "@/db/schema/team";
import { workspace, workspaceMember } from "@/db/schema/workspace";

export interface ProjectTeamInfo {
  id: string;
  name: string;
  identifier: string;
  icon: string | null;
  color: string | null;
}

export interface ProjectData {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: "active" | "archived" | "completed";
  workspaceId: string;
  teamCount: number;
  teams: ProjectTeamInfo[];
}

export async function getWorkspaceProjects(
  workspaceId: string
): Promise<ProjectData[]> {
  const results = await db
    .select({
      id: project.id,
      name: project.name,
      identifier: project.identifier,
      description: project.description,
      icon: project.icon,
      color: project.color,
      status: project.status,
      workspaceId: project.workspaceId,
    })
    .from(project)
    .where(eq(project.workspaceId, workspaceId))
    .orderBy(asc(project.name));

  if (results.length === 0) {
    return [];
  }

  const projectIds = results.map((p) => p.id);
  const teamsData = await db
    .select({
      projectId: projectTeam.projectId,
      teamId: team.id,
      teamName: team.name,
      teamIdentifier: team.identifier,
      teamIcon: team.icon,
      teamColor: team.color,
    })
    .from(projectTeam)
    .innerJoin(team, eq(projectTeam.teamId, team.id))
    .where(inArray(projectTeam.projectId, projectIds));

  const teamsByProject = teamsData.reduce(
    (acc, t) => {
      if (!acc[t.projectId]) {
        acc[t.projectId] = [];
      }
      acc[t.projectId].push({
        id: t.teamId,
        name: t.teamName,
        identifier: t.teamIdentifier,
        icon: t.teamIcon,
        color: t.teamColor,
      });
      return acc;
    },
    {} as Record<string, ProjectTeamInfo[]>
  );

  return results.map((p) => ({
    ...p,
    teams: teamsByProject[p.id] || [],
    teamCount: (teamsByProject[p.id] || []).length,
  }));
}

export async function getTeamProjects(teamId: string): Promise<ProjectData[]> {
  const results = await db
    .select({
      id: project.id,
      name: project.name,
      identifier: project.identifier,
      description: project.description,
      icon: project.icon,
      color: project.color,
      status: project.status,
      workspaceId: project.workspaceId,
    })
    .from(project)
    .innerJoin(projectTeam, eq(projectTeam.projectId, project.id))
    .where(eq(projectTeam.teamId, teamId))
    .orderBy(asc(project.name));

  if (results.length === 0) {
    return [];
  }

  const projectIds = results.map((p) => p.id);
  const teamsData = await db
    .select({
      projectId: projectTeam.projectId,
      teamId: team.id,
      teamName: team.name,
      teamIdentifier: team.identifier,
      teamIcon: team.icon,
      teamColor: team.color,
    })
    .from(projectTeam)
    .innerJoin(team, eq(projectTeam.teamId, team.id))
    .where(inArray(projectTeam.projectId, projectIds));

  const teamsByProject = teamsData.reduce(
    (acc, t) => {
      if (!acc[t.projectId]) {
        acc[t.projectId] = [];
      }
      acc[t.projectId].push({
        id: t.teamId,
        name: t.teamName,
        identifier: t.teamIdentifier,
        icon: t.teamIcon,
        color: t.teamColor,
      });
      return acc;
    },
    {} as Record<string, ProjectTeamInfo[]>
  );

  return results.map((p) => ({
    ...p,
    teams: teamsByProject[p.id] || [],
    teamCount: (teamsByProject[p.id] || []).length,
  }));
}

export async function getProjectByIdentifier(
  workspaceSlug: string,
  projectIdentifier: string,
  userId: string
): Promise<
  (ProjectData & { workspaceRole: "owner" | "admin" | "member" }) | null
> {
  const results = await db
    .select({
      id: project.id,
      name: project.name,
      identifier: project.identifier,
      description: project.description,
      icon: project.icon,
      color: project.color,
      status: project.status,
      workspaceId: project.workspaceId,
      workspaceRole: workspaceMember.role,
    })
    .from(project)
    .innerJoin(workspace, eq(project.workspaceId, workspace.id))
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, workspace.id),
        eq(workspaceMember.userId, userId)
      )
    )
    .where(
      and(
        eq(workspace.slug, workspaceSlug),
        eq(project.identifier, projectIdentifier)
      )
    )
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const projectData = results[0];

  const teamsData = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      teamIdentifier: team.identifier,
      teamIcon: team.icon,
      teamColor: team.color,
    })
    .from(projectTeam)
    .innerJoin(team, eq(projectTeam.teamId, team.id))
    .where(eq(projectTeam.projectId, projectData.id));

  const teams = teamsData.map((t) => ({
    id: t.teamId,
    name: t.teamName,
    identifier: t.teamIdentifier,
    icon: t.teamIcon,
    color: t.teamColor,
  }));

  return {
    ...projectData,
    teams,
    teamCount: teams.length,
  };
}

export async function canManageProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  const projectWithWorkspace = await db
    .select({
      workspaceRole: workspaceMember.role,
    })
    .from(project)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, project.workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .where(eq(project.id, projectId))
    .limit(1);

  const workspaceRole = projectWithWorkspace[0]?.workspaceRole;
  return workspaceRole === "owner" || workspaceRole === "admin";
}

export async function getProjectTeams(
  projectId: string
): Promise<ProjectTeamInfo[]> {
  const results = await db
    .select({
      id: team.id,
      name: team.name,
      identifier: team.identifier,
      icon: team.icon,
      color: team.color,
    })
    .from(projectTeam)
    .innerJoin(team, eq(projectTeam.teamId, team.id))
    .where(eq(projectTeam.projectId, projectId))
    .orderBy(asc(team.name));

  return results;
}
