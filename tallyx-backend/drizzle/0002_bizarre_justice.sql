ALTER TABLE "credits" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
UPDATE "credits" SET "status" = 'pending' WHERE "status" = 'active';--> statement-breakpoint
ALTER TABLE "credits" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "credits" ADD COLUMN "sync_status" text DEFAULT 'pending' NOT NULL;
