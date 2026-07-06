CREATE TYPE "public"."secret_code_mode" AS ENUM('MANUAL', 'SHARED_GENERATED', 'UNIQUE_PER_BOOKING');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('VOUCHER', 'SECRET_CODE');--> statement-breakpoint
CREATE TYPE "public"."timing_mode" AS ENUM('TIME_SLOT', 'ALL_DAY');--> statement-breakpoint
CREATE TYPE "public"."image_source" AS ENUM('UPLOAD', 'REMOTE_URL');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"partner_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"neighborhood" text NOT NULL,
	"image_id" uuid NOT NULL,
	"category" text NOT NULL,
	"event_type" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"date_time" timestamp with time zone NOT NULL,
	"timing_mode" "timing_mode" NOT NULL,
	"start_time_minutes" integer NOT NULL,
	"weekday" integer NOT NULL,
	"credit_price" integer NOT NULL,
	"total_capacity" integer NOT NULL,
	"remaining_capacity" integer NOT NULL,
	"ticket_type" "ticket_type" NOT NULL,
	"secret_code_mode" "secret_code_mode",
	"secret_code" text,
	"promo_code" text,
	"event_website_url" text,
	"barrier_free" boolean,
	"languages" text[],
	"target_age_groups" text[],
	"lat" numeric,
	"lng" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_remaining_capacity_non_negative" CHECK ("events"."remaining_capacity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_width" integer NOT NULL,
	"original_height" integer NOT NULL,
	"source" "image_source" NOT NULL,
	"source_url" text,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"contact_email" text NOT NULL,
	"logo_image_id" uuid,
	"venue_check_in_token" text,
	"portal_user_id" text,
	"portal_user_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_venue_check_in_token_unique" UNIQUE("venue_check_in_token")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_image_id_images_id_fk" FOREIGN KEY ("logo_image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_portal_user_id_users_id_fk" FOREIGN KEY ("portal_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_date_time_idx" ON "events" USING btree ("date_time");--> statement-breakpoint
CREATE INDEX "events_date_time_partner_id_idx" ON "events" USING btree ("date_time","partner_id");--> statement-breakpoint
CREATE INDEX "events_date_time_category_idx" ON "events" USING btree ("date_time","category");