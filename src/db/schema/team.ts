import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { workspace } from "./workspace";

export const team = pgTable(
  "team",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    identifier: text("identifier").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdIdentifierIdx: uniqueIndex("idx_team_workspaceId_identifier").on(
      table.workspaceId,
      table.identifier
    ),
    workspaceIdIdx: index("idx_team_workspaceId").on(table.workspaceId),
    createdByIdIdx: index("idx_team_createdById").on(table.createdById),
  })
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().$type<"lead" | "member">(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    teamIdUserIdIdx: uniqueIndex("idx_teamMember_teamId_userId").on(
      table.teamId,
      table.userId
    ),
    userIdIdx: index("idx_teamMember_userId").on(table.userId),
    teamIdIdx: index("idx_teamMember_teamId").on(table.teamId),
  })
);

export const teamRelations = relations(team, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [team.createdById],
    references: [user.id],
  }),
  members: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));
