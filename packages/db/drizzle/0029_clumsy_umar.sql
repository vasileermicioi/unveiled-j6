-- Collapse duplicate active bookings so the partial unique index can be created.
-- Keep earliest created_at (tie-break id); cancel later CONFIRMED/USED rows; restore remaining_capacity.
WITH ranked AS (
	SELECT
		id,
		event_id,
		tickets_count,
		ROW_NUMBER() OVER (
			PARTITION BY user_id, event_id, date_time
			ORDER BY created_at ASC, id ASC
		) AS rn
	FROM bookings
	WHERE status IN ('CONFIRMED', 'USED')
),
cancelled AS (
	UPDATE bookings AS b
	SET
		status = 'CANCELLED',
		cancelled_at = now(),
		cancellation_reason = 'one-ticket-limit-dedupe',
		updated_at = now()
	FROM ranked AS r
	WHERE b.id = r.id AND r.rn > 1
	RETURNING b.event_id, b.tickets_count
)
UPDATE events AS e
SET
	remaining_capacity = LEAST(e.total_capacity, e.remaining_capacity + d.sum_tickets),
	updated_at = now()
FROM (
	SELECT event_id, COALESCE(SUM(tickets_count), 0)::int AS sum_tickets
	FROM cancelled
	GROUP BY event_id
) AS d
WHERE e.id = d.event_id;
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_user_event_datetime_active_uidx" ON "bookings" USING btree ("user_id","event_id","date_time") WHERE "bookings"."status" IN ('CONFIRMED', 'USED');
