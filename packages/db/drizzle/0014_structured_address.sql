-- Structured street/house (+ optional line2) on events and partners; partner zip parity.
-- Best-effort backfill from free-text address; unparseable → street=prior address, house_number='1', zip=PLZ or 10115.

ALTER TABLE "events" ADD COLUMN "street" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "house_number" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "address_line2" text;--> statement-breakpoint

ALTER TABLE "partners" ADD COLUMN "street" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "house_number" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "address_line2" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "country" text DEFAULT 'DE' NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "city" text DEFAULT 'berlin' NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN "zip_code" text;--> statement-breakpoint

CREATE OR REPLACE FUNCTION _unveiled_backfill_structured_address()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  raw text;
  remainder text;
  zip_found text;
  line2 text;
  street_part text;
  house_part text;
  comma_idx int;
  composed text;
BEGIN
  -- Events
  FOR r IN SELECT id, address, zip_code FROM events LOOP
    raw := trim(COALESCE(r.address, ''));
    IF raw = '' THEN
      raw := 'Unknown';
    END IF;

    zip_found := (regexp_match(raw, '(1[0-4][0-9]{3})'))[1];
    IF zip_found IS NULL THEN
      zip_found := NULLIF(trim(COALESCE(r.zip_code, '')), '');
    END IF;
    IF zip_found IS NULL OR zip_found !~ '^1[0-4][0-9]{3}$' THEN
      zip_found := '10115';
    END IF;

    remainder := trim(regexp_replace(raw, ',?\s*1[0-4][0-9]{3}\s*Berlin\s*$', '', 'i'));
    remainder := trim(regexp_replace(remainder, ',?\s*Berlin\s*$', '', 'i'));
    IF remainder = '' THEN
      remainder := raw;
    END IF;

    line2 := NULL;
    comma_idx := position(',' in remainder);
    IF comma_idx > 0 THEN
      line2 := trim(substring(remainder from comma_idx + 1));
      remainder := trim(substring(remainder from 1 for comma_idx - 1));
      IF line2 = '' OR line2 ~* '^berlin$' OR line2 ~ '1[0-4][0-9]{3}' THEN
        line2 := NULL;
      END IF;
    END IF;

    IF remainder ~ '^(.*?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$' THEN
      street_part := trim((regexp_match(remainder, '^(.*?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$'))[1]);
      house_part := trim(regexp_replace(
        (regexp_match(remainder, '^(.*?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$'))[2],
        '\s+',
        '',
        'g'
      ));
    ELSE
      street_part := remainder;
      house_part := '1';
    END IF;

    IF street_part = '' THEN
      street_part := raw;
    END IF;

    composed := street_part || ' ' || house_part;
    IF line2 IS NOT NULL THEN
      composed := composed || ', ' || line2;
    END IF;
    composed := composed || ', ' || zip_found || ' Berlin';

    UPDATE events
    SET
      street = street_part,
      house_number = house_part,
      address_line2 = line2,
      zip_code = zip_found,
      address = composed
    WHERE id = r.id;
  END LOOP;

  -- Partners
  FOR r IN SELECT id, address FROM partners LOOP
    raw := trim(COALESCE(r.address, ''));
    IF raw = '' THEN
      raw := 'Unknown';
    END IF;

    zip_found := (regexp_match(raw, '(1[0-4][0-9]{3})'))[1];
    IF zip_found IS NULL OR zip_found !~ '^1[0-4][0-9]{3}$' THEN
      zip_found := '10115';
    END IF;

    remainder := trim(regexp_replace(raw, ',?\s*1[0-4][0-9]{3}\s*Berlin\s*$', '', 'i'));
    remainder := trim(regexp_replace(remainder, ',?\s*Berlin\s*$', '', 'i'));
    IF remainder = '' THEN
      remainder := raw;
    END IF;

    line2 := NULL;
    comma_idx := position(',' in remainder);
    IF comma_idx > 0 THEN
      line2 := trim(substring(remainder from comma_idx + 1));
      remainder := trim(substring(remainder from 1 for comma_idx - 1));
      IF line2 = '' OR line2 ~* '^berlin$' OR line2 ~ '1[0-4][0-9]{3}' THEN
        line2 := NULL;
      END IF;
    END IF;

    IF remainder ~ '^(.*?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$' THEN
      street_part := trim((regexp_match(remainder, '^(.*?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$'))[1]);
      house_part := trim(regexp_replace(
        (regexp_match(remainder, '^(.*?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$'))[2],
        '\s+',
        '',
        'g'
      ));
    ELSE
      street_part := remainder;
      house_part := '1';
    END IF;

    IF street_part = '' THEN
      street_part := raw;
    END IF;

    composed := street_part || ' ' || house_part;
    IF line2 IS NOT NULL THEN
      composed := composed || ', ' || line2;
    END IF;
    composed := composed || ', ' || zip_found || ' Berlin';

    UPDATE partners
    SET
      street = street_part,
      house_number = house_part,
      address_line2 = line2,
      country = 'DE',
      city = 'berlin',
      zip_code = zip_found,
      address = composed
    WHERE id = r.id;
  END LOOP;
END;
$$;--> statement-breakpoint

SELECT _unveiled_backfill_structured_address();--> statement-breakpoint
DROP FUNCTION _unveiled_backfill_structured_address();--> statement-breakpoint

ALTER TABLE "events" ALTER COLUMN "street" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "house_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "street" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "house_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "partners" ALTER COLUMN "zip_code" SET NOT NULL;
