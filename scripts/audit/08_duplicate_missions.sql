-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/08_duplicate_missions.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Missions that exist more than once for the same pilot (the old
-- check-then-insert race). The schema_hardening migration removes the extra
-- copies itself, keeping the one marked `keep` here: a completed copy first,
-- then the most progress, then the oldest. Run this before migrating to see
-- exactly which rows will go.

WITH ranked AS (
  SELECT m."id", m."pilotId", m."title", m."currentCount", m."targetCount", m."completed", m."createdAt",
         row_number() OVER (PARTITION BY m."pilotId", m."title"
                            ORDER BY m."completed" DESC, m."currentCount" DESC, m."createdAt" ASC, m."id" ASC) AS rn,
         count(*) OVER (PARTITION BY m."pilotId", m."title") AS copies
  FROM "Mission" m
)
SELECT p."callsign", r."title", r.copies,
       CASE WHEN r.rn = 1 THEN 'keep' ELSE 'removed by the migration' END AS fate,
       r."currentCount", r."targetCount", r."completed", r."createdAt", r."id" AS mission_id
FROM ranked r
JOIN "PilotState" p ON p."id" = r."pilotId"
WHERE r.copies > 1
ORDER BY p."callsign", r."title", r.rn;
