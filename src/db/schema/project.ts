import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { team } from "./team";
import { workspace } from "./workspace";

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    identifier: text("identifier").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    status: text("status")
      .notNull()
      .$type<"active" | "archived" | "completed">(),
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
    workspaceIdIdentifierIdx: uniqueIndex(
      "idx_project_workspaceId_identifier"
    ).on(table.workspaceId, table.identifier),
    workspaceIdIdx: index("idx_project_workspaceId").on(table.workspaceId),
    createdByIdIdx: index("idx_project_createdById").on(table.createdById),
    statusIdx: index("idx_project_status").on(table.status),
  })
);

export const projectTeam = pgTable(
  "project_team",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    projectIdTeamIdIdx: uniqueIndex("idx_projectTeam_projectId_teamId").on(
      table.projectId,
      table.teamId
    ),
    teamIdIdx: index("idx_projectTeam_teamId").on(table.teamId),
    projectIdIdx: index("idx_projectTeam_projectId").on(table.projectId),
  })
);

export const projectRelations = relations(project, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [project.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [project.createdById],
    references: [user.id],
  }),
  teams: many(projectTeam),
}));

export const projectTeamRelations = relations(projectTeam, ({ one }) => ({
  project: one(project, {
    fields: [projectTeam.projectId],
    references: [project.id],
  }),
  team: one(team, {
    fields: [projectTeam.teamId],
    references: [team.id],
  }),
}));
