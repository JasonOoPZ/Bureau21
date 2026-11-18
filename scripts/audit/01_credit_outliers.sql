-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/01_credit_outliers.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Pilots whose wealth is far above the rest of the server.
-- Shows the distribution (percentiles) on every row next to the 50 richest
-- pilots, so an exploited balance stands out as a multiple of p99.
-- Wealth = credits on hand + bank + bond principal.

WITH wealth AS (
  SELECT p."id", p."userId", p."callsign", p."level", p."credits", p."creditsBank", p."bondAmount",
         p."tokens", p."createdAt",
         p."credits"::bigint + p."creditsBank"::bigint + p."bondAmount"::bigint AS total
  FROM "PilotState" p
),
dist AS (
  SELECT count(*) AS pilots,
         percentile_cont(0.50) WITHIN GROUP (ORDER BY total) AS p50,
         percentile_cont(0.90) WITHIN GROUP (ORDER BY total) AS p90,
         percentile_cont(0.99) WITHIN GROUP (ORDER BY total) AS p99,
         max(total) AS max_total
  FROM wealth
)
SELECT w."callsign", w."level", w."credits", w."creditsBank", w."bondAmount", w."tokens", w.total,
       round((w.total / GREATEST(d.p99, 1))::numeric, 1) AS times_p99,
       round((w.total / GREATEST(w."level", 1))::numeric) AS total_per_level,
       w."credits" = 2147483647 AS at_int_max,
       w."createdAt"::date AS joined,
       d.pilots, round(d.p50::numeric) AS p50, round(d.p90::numeric) AS p90, round(d.p99::numeric) AS p99,
       w."id" AS pilot_id, w."userId" AS user_id
FROM wealth w CROSS JOIN dist d
ORDER BY w.total DESC
LIMIT 50;
