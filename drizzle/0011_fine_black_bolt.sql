CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"identifier" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"workspace_id" text NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_team_workspaceId_identifier" ON "team" USING btree ("workspace_id","identifier");--> statement-breakpoint
CREATE INDEX "idx_team_workspaceId" ON "team" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_team_createdById" ON "team" USING btree ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_teamMember_teamId_userId" ON "team_member" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_teamMember_userId" ON "team_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_teamMember_teamId" ON "team_member" USING btree ("team_id");