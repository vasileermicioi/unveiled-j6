-- Ticket redemption: secret-code-only, new ticket types, voucher inventory + booking_tickets.

-- 1) Recreate ticket_type without VOUCHER (map VOUCHER → VOUCHER_PROMO).
ALTER TYPE "public"."ticket_type" RENAME TO "ticket_type_old";--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('SECRET_CODE', 'VOUCHER_PROMO', 'VOUCHER_PDF');--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "ticket_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "ticket_type" TYPE "public"."ticket_type" USING (
  CASE "ticket_type"::text
    WHEN 'VOUCHER' THEN 'VOUCHER_PROMO'
    ELSE "ticket_type"::text
  END
)::"public"."ticket_type";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "redemption_type" TYPE "public"."ticket_type" USING (
  CASE
    WHEN "redemption_type" IS NULL THEN NULL
    WHEN "redemption_type"::text = 'VOUCHER' THEN 'VOUCHER_PROMO'
    ELSE "redemption_type"::text
  END
)::"public"."ticket_type";--> statement-breakpoint
DROP TYPE "public"."ticket_type_old";--> statement-breakpoint

-- 2) Drop secret_code_mode column + enum.
ALTER TABLE "events" DROP COLUMN IF EXISTS "secret_code_mode";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."secret_code_mode";--> statement-breakpoint

-- 3) Inventory status + booking_tickets (allocation target).
CREATE TYPE "public"."voucher_inventory_status" AS ENUM('AVAILABLE', 'ALLOCATED');--> statement-breakpoint
CREATE TABLE "booking_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"redemption_code" text,
	"redemption_url" text,
	"voucher_pdf_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "booking_tickets" ADD CONSTRAINT "booking_tickets_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_tickets_booking_id_ordinal_uidx" ON "booking_tickets" USING btree ("booking_id","ordinal");--> statement-breakpoint

-- 4) Voucher inventory tables.
CREATE TABLE "event_voucher_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"code" text NOT NULL,
	"status" "voucher_inventory_status" DEFAULT 'AVAILABLE' NOT NULL,
	"booking_ticket_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "event_voucher_codes" ADD CONSTRAINT "event_voucher_codes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_voucher_codes" ADD CONSTRAINT "event_voucher_codes_booking_ticket_id_booking_tickets_id_fk" FOREIGN KEY ("booking_ticket_id") REFERENCES "public"."booking_tickets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_voucher_codes_event_id_code_uidx" ON "event_voucher_codes" USING btree ("event_id","code");--> statement-breakpoint
CREATE INDEX "event_voucher_codes_event_id_status_idx" ON "event_voucher_codes" USING btree ("event_id","status");--> statement-breakpoint

CREATE TABLE "event_voucher_pdfs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text,
	"page_label" text,
	"status" "voucher_inventory_status" DEFAULT 'AVAILABLE' NOT NULL,
	"booking_ticket_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "event_voucher_pdfs" ADD CONSTRAINT "event_voucher_pdfs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_voucher_pdfs" ADD CONSTRAINT "event_voucher_pdfs_booking_ticket_id_booking_tickets_id_fk" FOREIGN KEY ("booking_ticket_id") REFERENCES "public"."booking_tickets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_voucher_pdfs_event_id_object_key_uidx" ON "event_voucher_pdfs" USING btree ("event_id","object_key");--> statement-breakpoint
CREATE INDEX "event_voucher_pdfs_event_id_status_idx" ON "event_voucher_pdfs" USING btree ("event_id","status");--> statement-breakpoint

-- 5) Seed at most one AVAILABLE inventory row from legacy promo_code, then clear column.
INSERT INTO "event_voucher_codes" ("event_id", "code", "status")
SELECT e."id", trim(e."promo_code"), 'AVAILABLE'
FROM "events" e
WHERE e."ticket_type" = 'VOUCHER_PROMO'
  AND e."promo_code" IS NOT NULL
  AND trim(e."promo_code") <> '';--> statement-breakpoint
UPDATE "events" SET "promo_code" = NULL WHERE "promo_code" IS NOT NULL;
