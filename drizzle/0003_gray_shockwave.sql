DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "account_providerId_accountId_idx";--> statement-breakpoint
DROP INDEX "account_providerId_idx";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "session_expiresAt_idx";--> statement-breakpoint
DROP INDEX "session_userId_expiresAt_idx";--> statement-breakpoint
DROP INDEX "session_token_expiresAt_idx";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
DROP INDEX "verification_expiresAt_idx";--> statement-breakpoint
DROP INDEX "verification_identifier_value_idx";--> statement-breakpoint
DROP INDEX "verification_value_idx";--> statement-breakpoint
CREATE INDEX "idx_account_userId" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_account_providerId_accountId" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "idx_account_providerId" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "idx_session_userId" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_expiresAt" ON "session" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_session_userId_expiresAt" ON "session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "idx_session_token_expiresAt" ON "session" USING btree ("token","expires_at");--> statement-breakpoint
CREATE INDEX "idx_session_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_id" ON "user" USING btree ("id");--> statement-breakpoint
CREATE INDEX "idx_verification_identifier" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "idx_verification_expiresAt" ON "verification" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_verification_identifier_value" ON "verification" USING btree ("identifier","value");--> statement-breakpoint
CREATE INDEX "idx_verification_value" ON "verification" USING btree ("value");