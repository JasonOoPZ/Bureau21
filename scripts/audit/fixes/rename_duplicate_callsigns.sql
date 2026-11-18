-- !! THIS FILE WRITES. It is the only file under scripts/audit that does. !!
-- It renames pilots, so run it only after reading the output of
-- scripts/audit/10_duplicate_callsigns.sql and deciding you agree with it.
--
-- What it does: for every callsign held by more than one pilot (ignoring
-- case and extra spaces) the OLDEST pilot keeps the name; every other holder
-- becomes "<name>-<last 4 characters of their pilot id>" (cut to 24
-- characters), and User.name is changed with it so the two stay equal.
-- To let a different pilot keep the name, rename the others by hand instead.
--
-- It ends in ROLLBACK, so as shipped it is a dry run: it prints what it would
-- do and changes nothing. Change the last line to COMMIT to apply it.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/fixes/rename_duplicate_callsigns.sql
-- Works before the schema_hardening migration (it does not use new columns).

BEGIN;

CREATE TEMP TABLE callsign_renames ON COMMIT DROP AS
WITH ranked AS (
  SELECT p."id", p."userId", p."callsign",
         row_number() OVER (
           PARTITION BY lower(regexp_replace(btrim(p."callsign"), '\s+', ' ', 'g'))
           ORDER BY p."createdAt" ASC, p."id" ASC
         ) AS rn
  FROM "PilotState" p
)
SELECT r."id" AS pilot_id, r."userId" AS user_id, r."callsign" AS old_callsign,
       left(regexp_replace(btrim(r."callsign"), '\s+', ' ', 'g'), 19) || '-' || right(r."id", 4) AS new_callsign
FROM ranked r
WHERE r.rn > 1;

UPDATE "PilotState" p
SET "callsign" = c.new_callsign
FROM callsign_renames c
WHERE p."id" = c.pilot_id;

UPDATE "User" u
SET "name" = c.new_callsign
FROM callsign_renames c
WHERE u."id" = c.user_id;

-- What was renamed.
SELECT * FROM callsign_renames ORDER BY old_callsign;

-- Must return no rows. If it does, a generated name collided: rename by hand.
SELECT lower(regexp_replace(btrim("callsign"), '\s+', ' ', 'g')) AS still_duplicated, count(*)
FROM "PilotState"
GROUP BY 1
HAVING count(*) > 1;

ROLLBACK; -- change to COMMIT to apply
