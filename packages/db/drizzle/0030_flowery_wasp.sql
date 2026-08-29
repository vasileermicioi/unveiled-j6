ALTER TABLE "events" ADD COLUMN "published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "featured_events" ADD COLUMN "published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "featured_events" ALTER COLUMN "published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "featured_partners" ADD COLUMN "published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "featured_partners" ALTER COLUMN "published" SET DEFAULT false;--> statement-breakpoint
CREATE INDEX "events_published_date_time_idx" ON "events" USING btree ("published","date_time");
