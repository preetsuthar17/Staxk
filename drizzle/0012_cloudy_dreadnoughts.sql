CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"identifier" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"status" text NOT NULL,
	"workspace_id" text NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_team" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"team_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_project_id_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_project_workspaceId_identifier" ON "project" USING btree ("workspace_id","identifier");--> statement-breakpoint
CREATE INDEX "idx_project_workspaceId" ON "project" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_project_createdById" ON "project" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "idx_project_status" ON "project" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_projectTeam_projectId_teamId" ON "project_team" USING btree ("project_id","team_id");--> statement-breakpoint
CREATE INDEX "idx_projectTeam_teamId" ON "project_team" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "idx_projectTeam_projectId" ON "project_team" USING btree ("project_id");