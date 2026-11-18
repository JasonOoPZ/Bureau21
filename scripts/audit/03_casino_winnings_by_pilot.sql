-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/03_casino_winnings_by_pilot.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Who took the most out of the casino, per game.
-- Transfers between pilots are not logged anywhere (there is no ledger table),
-- so they cannot be audited directly; casino history is the only money trail.
-- A long-run return above 100% on thousands of bets, or one pilot holding most
-- of a game's total winnings, deserves a look.

SELECT p."callsign", p."level", b."game",
       count(*) AS bets,
       sum(b."bet"::bigint) AS wagered,
       sum(b."payout"::bigint) AS paid,
       sum(b."net"::bigint) AS net,
       round(100 * sum(b."payout"::numeric) / NULLIF(sum(b."bet"::numeric), 0), 1) AS return_pct,
       max(b."payout") AS biggest_payout,
       min(b."createdAt")::date AS first_bet, max(b."createdAt")::date AS last_bet,
       p."id" AS pilot_id
FROM "CasinoBet" b
JOIN "PilotState" p ON p."id" = b."pilotId"
GROUP BY p."id", p."callsign", p."level", b."game"
HAVING sum(b."net"::bigint) > 0
ORDER BY net DESC
LIMIT 100;
