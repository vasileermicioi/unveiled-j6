ALTER TABLE "bookings" ADD COLUMN "date_time" timestamp with time zone;--> statement-breakpoint
UPDATE "bookings" SET "date_time" = "events"."date_time" FROM "events" WHERE "bookings"."event_id" = "events"."id";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "date_time" SET NOT NULL;
