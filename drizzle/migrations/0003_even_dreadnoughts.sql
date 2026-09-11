ALTER TABLE "tasks" ADD COLUMN "scheduled_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "scheduled_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "location" varchar(255);--> statement-breakpoint
CREATE INDEX "tasks_org_scheduled_idx" ON "tasks" USING btree ("organization_id","scheduled_start");