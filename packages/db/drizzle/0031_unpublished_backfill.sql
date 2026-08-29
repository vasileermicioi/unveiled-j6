-- 0030 originally added the columns with DEFAULT true (then flipped the default).
-- Existing environments still have those backfilled live rows. Force unpublished.
UPDATE "events" SET "published" = false WHERE "published" = true;--> statement-breakpoint
UPDATE "featured_events" SET "published" = false WHERE "published" = true;--> statement-breakpoint
UPDATE "featured_partners" SET "published" = false WHERE "published" = true;
