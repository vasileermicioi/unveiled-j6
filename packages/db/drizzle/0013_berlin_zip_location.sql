-- Extensible location model: country / city / zip_code replaces events.neighborhood.
-- Backfill zip from Bezirk-style neighborhood labels (representative PLZ); unknown → 10115.

ALTER TABLE "events" ADD COLUMN "country" text DEFAULT 'DE' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "city" text DEFAULT 'berlin' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "zip_code" text;--> statement-breakpoint

UPDATE "events" SET "zip_code" = CASE trim("neighborhood")
  WHEN 'Mitte' THEN '10115'
  WHEN 'Wedding' THEN '13347'
  WHEN 'Friedrichshain-Kreuzberg' THEN '10969'
  WHEN 'Kreuzberg' THEN '10961'
  WHEN 'X-Berg' THEN '10961'
  WHEN 'Friedrichshain' THEN '10243'
  WHEN 'F-Hain' THEN '10243'
  WHEN 'Pankow' THEN '10405'
  WHEN 'Charlottenburg-Wilmersdorf' THEN '10707'
  WHEN 'Charlottenburg' THEN '10585'
  WHEN 'Spandau' THEN '13581'
  WHEN 'Steglitz-Zehlendorf' THEN '12163'
  WHEN 'Tempelhof-Schöneberg' THEN '10823'
  WHEN 'Neukölln' THEN '12043'
  WHEN 'Treptow-Köpenick' THEN '12435'
  WHEN 'Marzahn-Hellersdorf' THEN '12681'
  WHEN 'Lichtenberg' THEN '10365'
  WHEN 'Reinickendorf' THEN '13403'
  ELSE '10115'
END
WHERE "zip_code" IS NULL;--> statement-breakpoint

ALTER TABLE "events" ALTER COLUMN "zip_code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "neighborhood";
