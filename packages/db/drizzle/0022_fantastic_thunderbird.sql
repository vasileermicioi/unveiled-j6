UPDATE "partners" AS p
SET "barrier_free" = TRUE
FROM (
	SELECT "partner_id", bool_or("barrier_free") AS lifted
	FROM "events"
	GROUP BY "partner_id"
) AS x
WHERE p."id" = x."partner_id" AND x.lifted IS TRUE;--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "barrier_free";
