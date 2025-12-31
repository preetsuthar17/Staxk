import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaceRole, workspaceRolePermission } from "@/db/schema";
import { DEFAULT_ROLE_PERMISSIONS, type PermissionKey } from "./permissions";

export interface Role {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  isSystem: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}

/**
 * Initialize default roles for a workspace
 */
export async function initializeWorkspaceRoles(
  workspaceId: string
): Promise<void> {
  const defaultRoles = [
    {
      name: "Owner",
      identifier: "owner",
      description: "Full control over the workspace",
    },
    {
      name: "Admin",
      identifier: "admin",
      description: "Manage workspace and members",
    },
    {
      name: "Manager",
      identifier: "manager",
      description: "Create and manage projects",
    },
    {
      name: "Member",
      identifier: "member",
      description: "Create and manage tasks",
    },
    { name: "Guest", identifier: "guest", description: "View-only access" },
  ];

  for (const roleData of defaultRoles) {
    const roleId = crypto.randomUUID();

    // Create role
    await db.insert(workspaceRole).values({
      id: roleId,
      workspaceId,
      name: roleData.name,
      identifier: roleData.identifier,
      isSystem: true,
      description: roleData.description,
    });

    // Add default permissions
    const permissions =
      DEFAULT_ROLE_PERMISSIONS[
        roleData.identifier as keyof typeof DEFAULT_ROLE_PERMISSIONS
      ] || [];
    if (permissions.length > 0) {
      await db.insert(workspaceRolePermission).values(
        permissions.map((permission: PermissionKey) => ({
          id: crypto.randomUUID(),
          roleId,
          permission,
        }))
      );
    }
  }
}

/**
 * Get all roles for a workspace
 */
export async function getWorkspaceRoles(workspaceId: string): Promise<Role[]> {
  const roles = await db
    .select()
    .from(workspaceRole)
    .where(eq(workspaceRole.workspaceId, workspaceId))
    .orderBy(workspaceRole.createdAt);

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissions = await db
        .select({ permission: workspaceRolePermission.permission })
        .from(workspaceRolePermission)
        .where(eq(workspaceRolePermission.roleId, role.id));

      return {
        ...role,
        permissions: permissions.map((p) => p.permission),
      };
    })
  );

  return rolesWithPermissions;
}

/**
 * Get a single role by ID
 */
export async function getRoleById(roleId: string): Promise<Role | null> {
  const role = await db
    .select()
    .from(workspaceRole)
    .where(eq(workspaceRole.id, roleId))
    .limit(1);

  if (role.length === 0) {
    return null;
  }

  const permissions = await db
    .select({ permission: workspaceRolePermission.permission })
    .from(workspaceRolePermission)
    .where(eq(workspaceRolePermission.roleId, roleId));

  return {
    ...role[0],
    permissions: permissions.map((p) => p.permission),
  };
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(
  roleId: string,
  permissions: string[]
): Promise<void> {
  // Delete existing permissions
  await db
    .delete(workspaceRolePermission)
    .where(eq(workspaceRolePermission.roleId, roleId));

  // Insert new permissions
  if (permissions.length > 0) {
    await db.insert(workspaceRolePermission).values(
      permissions.map((permission) => ({
        id: crypto.randomUUID(),
        roleId,
        permission,
      }))
    );
  }
}

/**
 * Update role details
 */
export async function updateRole(
  roleId: string,
  data: {
    name?: string;
    description?: string | null;
  }
): Promise<void> {
  await db
    .update(workspaceRole)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workspaceRole.id, roleId));
}
