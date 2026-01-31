CREATE TABLE "workspace_invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"invited_by_id" text NOT NULL,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invitation_workspaceId_email" ON "workspace_invitation" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invitation_token" ON "workspace_invitation" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_invitation_workspaceId" ON "workspace_invitation" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_invitation_status" ON "workspace_invitation" USING btree ("status");