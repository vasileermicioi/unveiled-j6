ALTER TABLE "partners" ADD COLUMN "has_opening_hours" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "opening_hours" jsonb;