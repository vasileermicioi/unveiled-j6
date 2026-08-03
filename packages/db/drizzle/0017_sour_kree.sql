ALTER TABLE "events" ADD COLUMN "date_times" timestamp with time zone[];--> statement-breakpoint
UPDATE "events" SET "date_times" = ARRAY["date_time"] WHERE "date_times" IS NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "date_times" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_date_times_non_empty" CHECK (cardinality("events"."date_times") >= 1);
