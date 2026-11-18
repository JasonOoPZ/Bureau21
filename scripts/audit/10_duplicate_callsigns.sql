-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/10_duplicate_callsigns.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- PRE-FLIGHT for the schema_hardening migration: it refuses to run while any
-- of these rows exist (the unique index on callsignLower would reject them).
-- Lists pilots whose callsign equals another pilot's, ignoring case and
-- extra spaces. `keep_or_rename` is the suggestion the fix script
-- (scripts/audit/fixes/rename_duplicate_callsigns.sql) follows: the oldest
-- pilot keeps the name. Decide per case; an active player may deserve the
-- name more than an abandoned older account.

WITH keyed AS (
  SELECT p."id", p."userId", p."callsign", p."level", p."credits", p."createdAt", p."updatedAt",
         lower(regexp_replace(btrim(p."callsign"), '\s+', ' ', 'g')) AS key
  FROM "PilotState" p
),
ranked AS (
  SELECT k.*,
         count(*) OVER (PARTITION BY k.key) AS holders,
         row_number() OVER (PARTITION BY k.key ORDER BY k."createdAt" ASC, k."id" ASC) AS rn
  FROM keyed k
)
SELECT r.key AS callsign_key, r."callsign", r.holders,
       CASE WHEN r.rn = 1 THEN 'keep' ELSE 'rename' END AS keep_or_rename,
       r."level", r."credits", r."createdAt", r."updatedAt" AS last_active,
       u."email", r."id" AS pilot_id, r."userId" AS user_id
FROM ranked r
JOIN "User" u ON u."id" = r."userId"
WHERE r.holders > 1
ORDER BY r.key, r.rn;
