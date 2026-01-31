import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const workspace = pgTable(
  "workspace",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    logo: text("logo"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("idx_workspace_slug").on(table.slug),
    ownerIdIdx: index("idx_workspace_ownerId").on(table.ownerId),
  })
);

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"owner" | "admin" | "member">(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdUserIdIdx: uniqueIndex(
      "idx_workspaceMember_workspaceId_userId"
    ).on(table.workspaceId, table.userId),
    userIdIdx: index("idx_workspaceMember_userId").on(table.userId),
    workspaceIdIdx: index("idx_workspaceMember_workspaceId").on(
      table.workspaceId
    ),
  })
);

export const workspaceInvitation = pgTable(
  "workspace_invitation",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().$type<"admin" | "member">(),
    token: text("token").notNull().unique(),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status")
      .notNull()
      .$type<"pending" | "accepted" | "declined" | "expired">(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdEmailIdx: uniqueIndex("idx_invitation_workspaceId_email").on(
      table.workspaceId,
      table.email
    ),
    tokenIdx: uniqueIndex("idx_invitation_token").on(table.token),
    workspaceIdIdx: index("idx_invitation_workspaceId").on(table.workspaceId),
    statusIdx: index("idx_invitation_status").on(table.status),
  })
);

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  owner: one(user, {
    fields: [workspace.ownerId],
    references: [user.id],
  }),
  members: many(workspaceMember),
  invitations: many(workspaceInvitation),
}));

export const workspaceMemberRelations = relations(
  workspaceMember,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),
    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
  })
);

export const workspaceInvitationRelations = relations(
  workspaceInvitation,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceInvitation.workspaceId],
      references: [workspace.id],
    }),
    invitedBy: one(user, {
      fields: [workspaceInvitation.invitedById],
      references: [user.id],
    }),
  })
);
