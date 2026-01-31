import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import {
  workspace,
  workspaceInvitation,
  workspaceMember,
} from "@/db/schema/workspace";

export interface InvitationData {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "declined" | "expired";
  invitedBy: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  expiresAt: Date;
  createdAt: Date;
}

export interface InvitationWithWorkspace {
  id: string;
  token: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "declined" | "expired";
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  invitedBy: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  expiresAt: Date;
  createdAt: Date;
}

export async function getWorkspaceInvitations(
  workspaceId: string
): Promise<InvitationData[]> {
  const now = new Date();

  const results = await db
    .select({
      id: workspaceInvitation.id,
      email: workspaceInvitation.email,
      role: workspaceInvitation.role,
      status: workspaceInvitation.status,
      invitedById: workspaceInvitation.invitedById,
      invitedByName: user.name,
      invitedByEmail: user.email,
      invitedByImage: user.image,
      expiresAt: workspaceInvitation.expiresAt,
      createdAt: workspaceInvitation.createdAt,
    })
    .from(workspaceInvitation)
    .innerJoin(user, eq(workspaceInvitation.invitedById, user.id))
    .where(
      and(
        eq(workspaceInvitation.workspaceId, workspaceId),
        eq(workspaceInvitation.status, "pending"),
        gt(workspaceInvitation.expiresAt, now)
      )
    )
    .orderBy(asc(workspaceInvitation.createdAt));

  return results.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role as "admin" | "member",
    status: r.status as "pending",
    invitedBy: {
      id: r.invitedById,
      name: r.invitedByName,
      email: r.invitedByEmail,
      image: r.invitedByImage,
    },
    expiresAt: r.expiresAt ?? new Date(),
    createdAt: r.createdAt,
  }));
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationWithWorkspace | null> {
  const results = await db
    .select({
      id: workspaceInvitation.id,
      token: workspaceInvitation.token,
      email: workspaceInvitation.email,
      role: workspaceInvitation.role,
      status: workspaceInvitation.status,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      workspaceLogo: workspace.logo,
      invitedById: workspaceInvitation.invitedById,
      invitedByName: user.name,
      invitedByEmail: user.email,
      invitedByImage: user.image,
      expiresAt: workspaceInvitation.expiresAt,
      createdAt: workspaceInvitation.createdAt,
    })
    .from(workspaceInvitation)
    .innerJoin(workspace, eq(workspaceInvitation.workspaceId, workspace.id))
    .innerJoin(user, eq(workspaceInvitation.invitedById, user.id))
    .where(eq(workspaceInvitation.token, token))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const r = results[0];
  return {
    id: r.id,
    token: r.token,
    email: r.email,
    role: r.role as "admin" | "member",
    status: r.status as "pending" | "accepted" | "declined" | "expired",
    workspace: {
      id: r.workspaceId,
      name: r.workspaceName,
      slug: r.workspaceSlug,
      logo: r.workspaceLogo,
    },
    invitedBy: {
      id: r.invitedById,
      name: r.invitedByName,
      email: r.invitedByEmail,
      image: r.invitedByImage,
    },
    expiresAt: r.expiresAt ?? new Date(),
    createdAt: r.createdAt,
  };
}

export async function getUserPendingInvitations(
  email: string
): Promise<InvitationWithWorkspace[]> {
  const now = new Date();

  const results = await db
    .select({
      id: workspaceInvitation.id,
      token: workspaceInvitation.token,
      email: workspaceInvitation.email,
      role: workspaceInvitation.role,
      status: workspaceInvitation.status,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      workspaceLogo: workspace.logo,
      invitedById: workspaceInvitation.invitedById,
      invitedByName: user.name,
      invitedByEmail: user.email,
      invitedByImage: user.image,
      expiresAt: workspaceInvitation.expiresAt,
      createdAt: workspaceInvitation.createdAt,
    })
    .from(workspaceInvitation)
    .innerJoin(workspace, eq(workspaceInvitation.workspaceId, workspace.id))
    .innerJoin(user, eq(workspaceInvitation.invitedById, user.id))
    .where(
      and(
        eq(workspaceInvitation.email, email.toLowerCase()),
        eq(workspaceInvitation.status, "pending"),
        gt(workspaceInvitation.expiresAt, now)
      )
    )
    .orderBy(asc(workspaceInvitation.createdAt));

  return results.map((r) => ({
    id: r.id,
    token: r.token,
    email: r.email,
    role: r.role as "admin" | "member",
    status: "pending" as const,
    workspace: {
      id: r.workspaceId,
      name: r.workspaceName,
      slug: r.workspaceSlug,
      logo: r.workspaceLogo,
    },
    invitedBy: {
      id: r.invitedById,
      name: r.invitedByName,
      email: r.invitedByEmail,
      image: r.invitedByImage,
    },
    expiresAt: r.expiresAt ?? new Date(),
    createdAt: r.createdAt,
  }));
}

export async function createInvitation(params: {
  workspaceId: string;
  email: string;
  role: "admin" | "member";
  invitedById: string;
  expiresInDays?: number;
}): Promise<{ id: string; token: string } | { error: string }> {
  const { workspaceId, email, role, invitedById, expiresInDays = 7 } = params;
  const normalizedEmail = email.toLowerCase().trim();

  const existingMember = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .innerJoin(user, eq(workspaceMember.userId, user.id))
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(user.email, normalizedEmail)
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    return { error: "User is already a member of this workspace" };
  }

  const existingInvitation = await db
    .select({ id: workspaceInvitation.id })
    .from(workspaceInvitation)
    .where(
      and(
        eq(workspaceInvitation.workspaceId, workspaceId),
        eq(workspaceInvitation.email, normalizedEmail),
        eq(workspaceInvitation.status, "pending"),
        gt(workspaceInvitation.expiresAt, new Date())
      )
    )
    .limit(1);

  if (existingInvitation.length > 0) {
    return { error: "An invitation has already been sent to this email" };
  }

  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await db.insert(workspaceInvitation).values({
    id,
    workspaceId,
    email: normalizedEmail,
    role,
    token,
    invitedById,
    status: "pending",
    expiresAt,
  });

  return { id, token };
}

export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ workspaceSlug: string } | { error: string }> {
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return { error: "Invitation not found" };
  }

  if (invitation.status !== "pending") {
    return { error: "Invitation is no longer valid" };
  }

  if (new Date() > invitation.expiresAt) {
    return { error: "Invitation has expired" };
  }

  const userData = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (userData.length === 0) {
    return { error: "User not found" };
  }

  if (userData[0].email.toLowerCase() !== invitation.email.toLowerCase()) {
    return { error: "Invitation is for a different email address" };
  }

  const existingMember = await db
    .select({ id: workspaceMember.id })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, invitation.workspace.id),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  if (existingMember.length > 0) {
    await db
      .update(workspaceInvitation)
      .set({ status: "accepted" })
      .where(eq(workspaceInvitation.id, invitation.id));

    return { workspaceSlug: invitation.workspace.slug };
  }

  await db.transaction(async (tx) => {
    await tx.insert(workspaceMember).values({
      id: crypto.randomUUID(),
      workspaceId: invitation.workspace.id,
      userId,
      role: invitation.role,
    });

    await tx
      .update(workspaceInvitation)
      .set({ status: "accepted" })
      .where(eq(workspaceInvitation.id, invitation.id));
  });

  return { workspaceSlug: invitation.workspace.slug };
}

export async function declineInvitation(token: string): Promise<boolean> {
  const result = await db
    .update(workspaceInvitation)
    .set({ status: "declined" })
    .where(
      and(
        eq(workspaceInvitation.token, token),
        eq(workspaceInvitation.status, "pending")
      )
    )
    .returning({ id: workspaceInvitation.id });

  return result.length > 0;
}

export async function revokeInvitation(
  invitationId: string,
  workspaceId: string
): Promise<boolean> {
  const result = await db
    .delete(workspaceInvitation)
    .where(
      and(
        eq(workspaceInvitation.id, invitationId),
        eq(workspaceInvitation.workspaceId, workspaceId)
      )
    )
    .returning({ id: workspaceInvitation.id });

  return result.length > 0;
}
