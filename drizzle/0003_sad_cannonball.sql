ALTER TABLE "user" ADD COLUMN "display_username" text;--> statement-breakpoint
CREATE INDEX "user_display_username_idx" ON "user" USING btree ("display_username");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_display_username_unique" UNIQUE("display_username");