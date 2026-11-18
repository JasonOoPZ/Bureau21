-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/02_crash_payout_anomalies.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Void Runner (crash) bets that paid more than the fixed game allows.
-- Since the hotfix a payout is capped at 100x the bet and the bet at 1,000,000.
-- Before it, waiting paid any multiplier: those rows are the exploit.
-- Flags: payout / bet > 100, payout > 10,000,000, or a bet outside 10..1,000,000.

SELECT b."createdAt", p."callsign", p."level", b."bet", b."payout", b."net",
       round(b."payout"::numeric / NULLIF(b."bet", 0), 2) AS multiplier,
       concat_ws(', ',
         CASE WHEN b."payout"::numeric > b."bet"::numeric * 100 THEN 'over 100x' END,
         CASE WHEN b."payout" > 10000000 THEN 'payout over 10M' END,
         CASE WHEN b."bet" < 10 OR b."bet" > 1000000 THEN 'bet out of range' END) AS flags,
       b."id" AS bet_id, p."id" AS pilot_id
FROM "CasinoBet" b
JOIN "PilotState" p ON p."id" = b."pilotId"
WHERE b."game" = 'crash'
  AND (b."payout"::numeric > b."bet"::numeric * 100 OR b."payout" > 10000000 OR b."bet" < 10 OR b."bet" > 1000000)
ORDER BY b."payout" DESC
LIMIT 500;
