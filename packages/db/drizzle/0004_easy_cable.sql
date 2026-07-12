CREATE TYPE "public"."booking_status" AS ENUM('CONFIRMED', 'WAITLIST', 'CANCELLED', 'USED');--> statement-breakpoint
CREATE TYPE "public"."credit_ledger_type" AS ENUM('SUBSCRIPTION_REFILL', 'BOOKING', 'EXPIRY', 'REFUND', 'ADMIN_ADJUST');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_id" uuid NOT NULL,
	"partner_id" uuid NOT NULL,
	"tickets_count" integer NOT NULL,
	"total_credits" integer NOT NULL,
	"status" "booking_status" NOT NULL,
	"redemption_type" "ticket_type",
	"redemption_info" text,
	"redemption_url" text,
	"idempotency_key" text NOT NULL,
	"checked_in_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"type" "credit_ledger_type" NOT NULL,
	"description" text NOT NULL,
	"idempotency_key" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_user_id_idempotency_key_uidx" ON "bookings" USING btree ("user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "bookings_user_id_created_at_idx" ON "bookings" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_partner_id_created_at_idx" ON "bookings" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_event_id_idx" ON "bookings" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_idempotency_key_uidx" ON "credit_ledger" USING btree ("idempotency_key") WHERE "credit_ledger"."idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "credit_ledger_user_id_timestamp_idx" ON "credit_ledger" USING btree ("user_id","timestamp");