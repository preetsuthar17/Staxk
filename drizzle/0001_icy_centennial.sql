CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" bigint NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rateLimit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX "rateLimit_key_idx" ON "rateLimit" USING btree ("key");