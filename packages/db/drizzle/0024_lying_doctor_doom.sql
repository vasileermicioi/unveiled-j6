CREATE TYPE "public"."capacity_mode" AS ENUM('SHARED', 'PER_OCCURRENCE');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "capacity_mode" "capacity_mode" DEFAULT 'SHARED' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "occurrence_capacities" integer[];--> statement-breakpoint
UPDATE "events" SET "occurrence_capacities" = array_fill("total_capacity", ARRAY[cardinality("date_times")]) WHERE "occurrence_capacities" IS NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "occurrence_capacities" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_occurrence_capacities_cardinality" CHECK (cardinality("events"."date_times") = cardinality("events"."occurrence_capacities"));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_occurrence_capacities_non_negative" CHECK (0 <= ALL ("events"."occurrence_capacities"));
