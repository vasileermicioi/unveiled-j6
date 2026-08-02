ALTER TABLE "events" ADD COLUMN "has_subtitles" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "subtitle_language" text;
