-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/07_stat_allocation_anomalies.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Pilots holding more allocated stats than their level can have paid for.
-- A pilot earns 8 allocation points per level gained, so the lifetime budget
-- is (level - 1) x 8. Each point buys +1 of one stat. Other sources:
--   strength, speed   start 3 and 5; the gym adds 0.3 per session (GymLog)
--   confidence        whole part = 5 + allocated points (battles only move
--                     the fraction)
--   Life Force        level x 5 (minimum 15); anything above was allocated
--   unspentPoints     can never exceed the lifetime budget
-- `unexplained` = points that must have been allocated, minus the budget.
-- Above 0 means the pilot spent points they never earned (the parallel
-- allocate exploit), or was edited by hand. Endurance and panic are shown
-- but not counted (the gym moves them in small fractions).

WITH gym AS (
  SELECT g."pilotId",
         COALESCE(sum(g."gain") FILTER (WHERE g."training" = 'strength'), 0) AS strength_gain,
         COALESCE(sum(g."gain") FILTER (WHERE g."training" = 'speed'), 0) AS speed_gain
  FROM "GymLog" g
  GROUP BY g."pilotId"
),
calc AS (
  SELECT p."id", p."callsign", p."level", p."unspentPoints", p."strength", p."speed",
         p."confidence", p."lifeForce", p."endurance", p."panic",
         (p."level" - 1) * 8 AS budget,
         GREATEST(0, p."strength" - 3 - COALESCE(g.strength_gain, 0)) AS strength_allocated,
         GREATEST(0, p."speed" - 5 - COALESCE(g.speed_gain, 0)) AS speed_allocated,
         GREATEST(0, floor(p."confidence") - 5) AS confidence_allocated,
         GREATEST(0, p."lifeForce" - GREATEST(15, p."level" * 5)) AS life_force_allocated
  FROM "PilotState" p
  LEFT JOIN gym g ON g."pilotId" = p."id"
)
SELECT c."callsign", c."level", c.budget, c."unspentPoints",
       round(c.strength_allocated::numeric, 1) AS strength_allocated,
       round(c.speed_allocated::numeric, 1) AS speed_allocated,
       c.confidence_allocated, c.life_force_allocated,
       round((c."unspentPoints" + c.strength_allocated + c.speed_allocated
              + c.confidence_allocated + c.life_force_allocated - c.budget)::numeric, 1) AS unexplained,
       c."strength", c."speed", c."confidence", c."lifeForce", c."endurance", c."panic",
       c."id" AS pilot_id
FROM calc c
WHERE c."unspentPoints" + c.strength_allocated + c.speed_allocated
      + c.confidence_allocated + c.life_force_allocated > c.budget + 1
ORDER BY unexplained DESC
LIMIT 500;
