-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/04_negative_balances.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- PRE-FLIGHT for the schema_hardening migration: it refuses to run while any
-- of these rows exist (the CHECK constraints would reject them).
-- Lists every pilot holding a negative balance, and negative treasuries.
-- Correct them by hand (normally: set the column to 0) before migrating.

SELECT 'PilotState' AS source, p."callsign", p."id" AS row_id,
       concat_ws(', ',
         CASE WHEN p."credits" < 0 THEN 'credits=' || p."credits" END,
         CASE WHEN p."creditsBank" < 0 THEN 'creditsBank=' || p."creditsBank" END,
         CASE WHEN p."tokens" < 0 THEN 'tokens=' || p."tokens" END,
         CASE WHEN p."ore" < 0 THEN 'ore=' || p."ore" END,
         CASE WHEN p."herbs" < 0 THEN 'herbs=' || p."herbs" END,
         CASE WHEN p."fish" < 0 THEN 'fish=' || p."fish" END,
         CASE WHEN p."fuel" < 0 THEN 'fuel=' || p."fuel" END,
         CASE WHEN p."hull" < 0 THEN 'hull=' || p."hull" END,
         CASE WHEN p."motivation" < 0 THEN 'motivation=' || p."motivation" END,
         CASE WHEN p."unspentPoints" < 0 THEN 'unspentPoints=' || p."unspentPoints" END,
         CASE WHEN p."loanAmount" < 0 THEN 'loanAmount=' || p."loanAmount" END,
         CASE WHEN p."bondAmount" < 0 THEN 'bondAmount=' || p."bondAmount" END,
         CASE WHEN p."xp" < 0 THEN 'xp=' || p."xp" END,
         CASE WHEN p."gymEnergy" < 0 THEN 'gymEnergy=' || p."gymEnergy" END,
         CASE WHEN p."lifeForce" < 0 THEN 'lifeForce=' || p."lifeForce" END) AS negative_columns
FROM "PilotState" p
WHERE p."credits" < 0 OR p."creditsBank" < 0 OR p."tokens" < 0 OR p."ore" < 0
   OR p."herbs" < 0 OR p."fish" < 0 OR p."fuel" < 0 OR p."hull" < 0
   OR p."motivation" < 0 OR p."unspentPoints" < 0 OR p."loanAmount" < 0
   OR p."bondAmount" < 0 OR p."xp" < 0 OR p."gymEnergy" < 0 OR p."lifeForce" < 0
UNION ALL
SELECT 'GameGlobal', NULL, g."id", 'bankTreasury=' || g."bankTreasury"
FROM "GameGlobal" g WHERE g."bankTreasury" < 0
UNION ALL
SELECT 'Syndicate', s."name", s."id", 'treasury=' || s."treasury"
FROM "Syndicate" s WHERE s."treasury" < 0
ORDER BY 1, 2;
