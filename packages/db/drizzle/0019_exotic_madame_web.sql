ALTER TABLE "events" ADD COLUMN "occurrence_credit_prices" integer[];--> statement-breakpoint
UPDATE "events" SET "occurrence_credit_prices" = array_fill("credit_price", ARRAY[cardinality("date_times")]) WHERE "occurrence_credit_prices" IS NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "occurrence_credit_prices" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_occurrence_credit_prices_cardinality" CHECK (cardinality("events"."date_times") = cardinality("events"."occurrence_credit_prices"));--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_occurrence_credit_prices_non_negative" CHECK (0 <= ALL ("events"."occurrence_credit_prices"));
