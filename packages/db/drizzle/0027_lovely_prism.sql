ALTER TABLE "events" ADD COLUMN "title_de" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "description_de" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "description_en" text;--> statement-breakpoint
UPDATE "events" SET "title_de" = "title", "title_en" = "title", "description_de" = "description", "description_en" = "description";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "title_de" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "title_en" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "description_de" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "description_en" SET NOT NULL;
