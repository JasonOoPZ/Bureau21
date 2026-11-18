-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/09_pilotless_name_clashes.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Accounts that have no pilot yet but whose display name equals an existing
-- callsign, or each other's name. Not a blocker: when such an account first
-- plays it now gets a numeric suffix. Listed so you know who will see
-- "Name-1234" instead of their name, and can rename them first if you prefer.

WITH pilotless AS (
  SELECT u."id", u."name", u."email", u."createdAt",
         lower(regexp_replace(btrim(u."name"), '\s+', ' ', 'g')) AS key
  FROM "User" u
  LEFT JOIN "PilotState" p ON p."userId" = u."id"
  WHERE p."id" IS NULL AND u."name" IS NOT NULL AND btrim(u."name") <> ''
)
SELECT a."name", a."email", a."createdAt",
       CASE WHEN held."id" IS NOT NULL THEN 'callsign already held by a pilot' ELSE 'same name as another account without a pilot' END AS clash,
       held."callsign" AS held_by_callsign, a."id" AS user_id
FROM pilotless a
LEFT JOIN "PilotState" held ON lower(regexp_replace(btrim(held."callsign"), '\s+', ' ', 'g')) = a.key
WHERE held."id" IS NOT NULL
   OR (SELECT count(*) FROM pilotless b WHERE b.key = a.key) > 1
ORDER BY a.key, a."createdAt";
