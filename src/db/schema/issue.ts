import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { project } from "./project";
import { workspace } from "./workspace";

export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "done"
  | "canceled"
  | "duplicate";

export const issue = pgTable(
  "issue",
  {
    id: text("id").primaryKey(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().$type<IssueStatus>(),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
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
    projectIdNumberIdx: uniqueIndex("idx_issue_projectId_number").on(
      table.projectId,
      table.number
    ),
    workspaceIdIdx: index("idx_issue_workspaceId").on(table.workspaceId),
    projectIdIdx: index("idx_issue_projectId").on(table.projectId),
    statusIdx: index("idx_issue_status").on(table.status),
    createdByIdIdx: index("idx_issue_createdById").on(table.createdById),
  })
);

export const issueRelations = relations(issue, ({ one }) => ({
  project: one(project, {
    fields: [issue.projectId],
    references: [project.id],
  }),
  workspace: one(workspace, {
    fields: [issue.workspaceId],
    references: [workspace.id],
  }),
  createdBy: one(user, {
    fields: [issue.createdById],
    references: [user.id],
  }),
}));
