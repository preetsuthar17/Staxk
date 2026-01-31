import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { type IssueStatus, issue } from "@/db/schema/issue";
import { project, projectTeam } from "@/db/schema/project";
import { workspaceMember } from "@/db/schema/workspace";

export interface IssueData {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: IssueStatus;
  projectId: string;
  projectIdentifier: string;
  projectName: string;
  workspaceId: string;
  createdById: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getWorkspaceIssues(
  workspaceId: string
): Promise<IssueData[]> {
  const results = await db
    .select({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      projectId: issue.projectId,
      projectIdentifier: project.identifier,
      projectName: project.name,
      workspaceId: issue.workspaceId,
      createdById: issue.createdById,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .leftJoin(user, eq(issue.createdById, user.id))
    .where(eq(issue.workspaceId, workspaceId))
    .orderBy(desc(issue.createdAt));

  return results;
}

export async function getProjectIssues(
  projectId: string
): Promise<IssueData[]> {
  const results = await db
    .select({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      projectId: issue.projectId,
      projectIdentifier: project.identifier,
      projectName: project.name,
      workspaceId: issue.workspaceId,
      createdById: issue.createdById,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .leftJoin(user, eq(issue.createdById, user.id))
    .where(eq(issue.projectId, projectId))
    .orderBy(desc(issue.createdAt));

  return results;
}

export async function getTeamIssues(teamId: string): Promise<IssueData[]> {
  const teamProjects = await db
    .select({ projectId: projectTeam.projectId })
    .from(projectTeam)
    .where(eq(projectTeam.teamId, teamId));

  if (teamProjects.length === 0) {
    return [];
  }

  const projectIds = teamProjects.map((tp) => tp.projectId);

  const results = await db
    .select({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      projectId: issue.projectId,
      projectIdentifier: project.identifier,
      projectName: project.name,
      workspaceId: issue.workspaceId,
      createdById: issue.createdById,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .leftJoin(user, eq(issue.createdById, user.id))
    .where(inArray(issue.projectId, projectIds))
    .orderBy(desc(issue.createdAt));

  return results;
}

export async function getIssueByNumber(
  projectId: string,
  issueNumber: number
): Promise<IssueData | null> {
  const results = await db
    .select({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      projectId: issue.projectId,
      projectIdentifier: project.identifier,
      projectName: project.name,
      workspaceId: issue.workspaceId,
      createdById: issue.createdById,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .leftJoin(user, eq(issue.createdById, user.id))
    .where(and(eq(issue.projectId, projectId), eq(issue.number, issueNumber)))
    .limit(1);

  return results[0] || null;
}

export async function getIssueById(
  issueId: string,
  userId: string
): Promise<
  (IssueData & { workspaceRole: "owner" | "admin" | "member" }) | null
> {
  const results = await db
    .select({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      projectId: issue.projectId,
      projectIdentifier: project.identifier,
      projectName: project.name,
      workspaceId: issue.workspaceId,
      createdById: issue.createdById,
      createdByName: user.name,
      createdByEmail: user.email,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      workspaceRole: workspaceMember.role,
    })
    .from(issue)
    .innerJoin(project, eq(issue.projectId, project.id))
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, issue.workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .leftJoin(user, eq(issue.createdById, user.id))
    .where(eq(issue.id, issueId))
    .limit(1);

  return results[0] || null;
}

export async function getNextIssueNumber(projectId: string): Promise<number> {
  const result = await db
    .select({
      maxNumber: sql<number>`COALESCE(MAX(${issue.number}), 0)`,
    })
    .from(issue)
    .where(eq(issue.projectId, projectId));

  return (result[0]?.maxNumber || 0) + 1;
}

export async function canManageIssue(
  issueId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .select({
      workspaceRole: workspaceMember.role,
      createdById: issue.createdById,
    })
    .from(issue)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, issue.workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .where(eq(issue.id, issueId))
    .limit(1);

  if (result.length === 0) {
    return false;
  }

  const { workspaceRole, createdById } = result[0];

  if (workspaceRole === "owner" || workspaceRole === "admin") {
    return true;
  }

  return createdById === userId;
}
