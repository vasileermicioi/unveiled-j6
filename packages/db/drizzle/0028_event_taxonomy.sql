-- Keep CASE arms in sync with packages/db/src/catalog/event-taxonomy.ts (LEGACY_*_MAP).
UPDATE "events" SET "category" = CASE "category"
  WHEN 'Theater' THEN 'theater'
  WHEN 'Kino' THEN 'cinema'
  WHEN 'Museum' THEN 'museum'
  WHEN 'Ausstellung' THEN 'exhibition_hall'
  WHEN 'Konzert' THEN 'live_music_venue'
  WHEN 'Talk/Lesung' THEN 'literature_house'
  WHEN 'Comedy' THEN 'comedy_club'
  WHEN 'Tanz/Performance' THEN 'dance_venue'
  WHEN 'Other' THEN 'cultural_center'
  WHEN 'Music' THEN 'live_music_venue'
  WHEN 'music' THEN 'live_music_venue'
  WHEN 'Art' THEN 'kunsthalle'
  WHEN 'Film' THEN 'cinema'
  WHEN 'Talk' THEN 'literature_house'
  ELSE "category"
END;--> statement-breakpoint
UPDATE "events" SET "event_type" = CASE "event_type"
  WHEN 'Performance' THEN 'theater_play'
  WHEN 'Concert' THEN 'concert'
  WHEN 'Tour' THEN 'guided_tour'
  WHEN 'Talk' THEN 'talk_lecture'
  WHEN 'Workshop' THEN 'workshop'
  WHEN 'Screening' THEN 'film_screening'
  WHEN 'Reading' THEN 'reading'
  WHEN 'Other' THEN 'special_event'
  ELSE "event_type"
END;--> statement-breakpoint
DO $$
DECLARE
  unmapped_categories text;
  unmapped_types text;
BEGIN
  SELECT string_agg(DISTINCT category, ', ' ORDER BY category)
  INTO unmapped_categories
  FROM events
  WHERE category NOT IN (
    'theater',
    'opera_house',
    'concert_hall',
    'museum',
    'kunsthalle',
    'commercial_gallery',
    'cinema',
    'cabaret',
    'small_stage',
    'variety_theater',
    'musical_theater',
    'dance_venue',
    'live_music_venue',
    'cultural_center',
    'library',
    'literature_house',
    'planetarium',
    'botanical_garden',
    'zoo_cultural',
    'exhibition_hall',
    'film_museum',
    'music_school',
    'open_air_stage',
    'city_archive',
    'atelierhaus',
    'artists_house',
    'comedy_club'
  );

  IF unmapped_categories IS NOT NULL THEN
    RAISE EXCEPTION 'unmapped event category values: %', unmapped_categories;
  END IF;

  SELECT string_agg(DISTINCT event_type, ', ' ORDER BY event_type)
  INTO unmapped_types
  FROM events
  WHERE event_type NOT IN (
    'theater_play',
    'opera_performance',
    'concert',
    'exhibition_opening',
    'exhibition_ongoing',
    'guided_tour',
    'film_screening',
    'film_premiere',
    'reading',
    'book_presentation',
    'poetry_slam',
    'cabaret_evening',
    'comedy_evening',
    'dance_performance',
    'ballet_evening',
    'musical',
    'variety_show',
    'workshop',
    'panel_discussion',
    'talk_lecture',
    'festival',
    'club_concert',
    'live_set',
    'open_air_event',
    'family_event',
    'night_tour',
    'special_event',
    'vernissage',
    'finissage',
    'workshop_series',
    'community_event',
    'networking_evening'
  );

  IF unmapped_types IS NOT NULL THEN
    RAISE EXCEPTION 'unmapped event_type values: %', unmapped_types;
  END IF;
END $$;
