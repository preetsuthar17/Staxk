CREATE TABLE "issue" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text NOT NULL,
	"project_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_issue_projectId_number" ON "issue" USING btree ("project_id","number");--> statement-breakpoint
CREATE INDEX "idx_issue_workspaceId" ON "issue" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_issue_projectId" ON "issue" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_issue_status" ON "issue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_issue_createdById" ON "issue" USING btree ("created_by_id");