ALTER TABLE "events" ADD COLUMN "subtitle_languages" text[];--> statement-breakpoint
UPDATE "events" SET "subtitle_languages" = ARRAY["subtitle_language"] WHERE "has_subtitles" AND "subtitle_language" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "subtitle_language";
