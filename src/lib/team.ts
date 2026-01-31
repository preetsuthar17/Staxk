import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { team, teamMember } from "@/db/schema/team";
import { workspace, workspaceMember } from "@/db/schema/workspace";

export interface TeamData {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  workspaceId: string;
  memberCount: number;
  userRole: "lead" | "member" | null;
}

export interface TeamMemberData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "lead" | "member";
  joinedAt: Date;
}

export async function getWorkspaceTeams(
  workspaceId: string,
  userId: string
): Promise<TeamData[]> {
  const results = await db
    .select({
      id: team.id,
      name: team.name,
      identifier: team.identifier,
      description: team.description,
      icon: team.icon,
      color: team.color,
      workspaceId: team.workspaceId,
      memberCount: sql<number>`(
        SELECT COUNT(*) FROM team_member
        WHERE team_member.team_id = ${team.id}
      )`.as("member_count"),
      userRole: sql<"lead" | "member" | null>`(
        SELECT role FROM team_member
        WHERE team_member.team_id = ${team.id}
        AND team_member.user_id = ${userId}
        LIMIT 1
      )`.as("user_role"),
    })
    .from(team)
    .where(eq(team.workspaceId, workspaceId))
    .orderBy(asc(team.name));

  return results;
}

export async function getTeamByIdentifier(
  workspaceSlug: string,
  teamIdentifier: string,
  userId: string
): Promise<
  (TeamData & { workspaceRole: "owner" | "admin" | "member" }) | null
> {
  const results = await db
    .select({
      id: team.id,
      name: team.name,
      identifier: team.identifier,
      description: team.description,
      icon: team.icon,
      color: team.color,
      workspaceId: team.workspaceId,
      memberCount: sql<number>`(
        SELECT COUNT(*) FROM team_member
        WHERE team_member.team_id = ${team.id}
      )`.as("member_count"),
      userRole: sql<"lead" | "member" | null>`(
        SELECT role FROM team_member
        WHERE team_member.team_id = ${team.id}
        AND team_member.user_id = ${userId}
        LIMIT 1
      )`.as("user_role"),
      workspaceRole: workspaceMember.role,
    })
    .from(team)
    .innerJoin(workspace, eq(team.workspaceId, workspace.id))
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
        eq(team.identifier, teamIdentifier)
      )
    )
    .limit(1);

  return results[0] || null;
}

export async function getTeamMembers(
  teamId: string
): Promise<TeamMemberData[]> {
  const results = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: teamMember.role,
      joinedAt: teamMember.createdAt,
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(eq(teamMember.teamId, teamId))
    .orderBy(asc(teamMember.createdAt));

  return results;
}

export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const results = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);

  return results.length > 0;
}

export async function getTeamMemberRole(
  teamId: string,
  userId: string
): Promise<"lead" | "member" | null> {
  const results = await db
    .select({ role: teamMember.role })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);

  return results[0]?.role || null;
}

export async function canManageTeam(
  teamId: string,
  userId: string
): Promise<boolean> {
  const teamRole = await getTeamMemberRole(teamId, userId);
  if (teamRole === "lead") {
    return true;
  }

  const teamWithWorkspace = await db
    .select({
      workspaceRole: workspaceMember.role,
    })
    .from(team)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, team.workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .where(eq(team.id, teamId))
    .limit(1);

  const workspaceRole = teamWithWorkspace[0]?.workspaceRole;
  return workspaceRole === "owner" || workspaceRole === "admin";
}
