CREATE TYPE "public"."waitlist_status" AS ENUM('WAITING', 'PROMOTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"requested_qty" integer NOT NULL,
	"status" "waitlist_status" NOT NULL,
	"skipped_once" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist_entries" ADD CONSTRAINT "waitlist_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "waitlist_entries_event_id_created_at_idx" ON "waitlist_entries" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "waitlist_entries_user_id_created_at_idx" ON "waitlist_entries" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_entries_user_event_waiting_uidx" ON "waitlist_entries" USING btree ("user_id","event_id") WHERE "waitlist_entries"."status" = 'WAITING';