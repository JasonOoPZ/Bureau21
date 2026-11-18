-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/06_bond_loan_anomalies.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Bank bonds and loans that the bank rules cannot produce.
-- Rules (src/app/api/game/bank/route.ts):
--   bonds   terms 7/14/30/45/60/90/180/365 days at 1/2.25/5/7.5/11/15/20/25 %;
--           an open bond has all of amount, rate, days, start and maturity set
--   loans   one at a time, at most 5% of the bank balance, and the deposit is
--           held as collateral, so the bank balance is never below the loan

WITH rates(days, rate) AS (
  VALUES (7, 1::float8), (14, 2.25), (30, 5), (45, 7.5), (60, 11), (90, 15), (180, 20), (365, 25)
),
flagged AS (
  SELECT p."callsign", p."level", p."credits", p."creditsBank",
         p."loanAmount", p."loanCreatedAt", p."bondAmount", p."bondRate", p."bondDays",
         p."bondCreatedAt", p."bondMaturesAt", p."bondLastClaimedAt",
         concat_ws(', ',
           CASE WHEN p."bondAmount" > 0 AND r.days IS NULL THEN 'bond term not offered' END,
           CASE WHEN p."bondAmount" > 0 AND r.days IS NOT NULL AND abs(p."bondRate" - r.rate) > 0.0001 THEN 'bond rate does not match its term' END,
           CASE WHEN p."bondAmount" > 0 AND (p."bondCreatedAt" IS NULL OR p."bondMaturesAt" IS NULL) THEN 'open bond without dates' END,
           CASE WHEN p."bondAmount" > 0 AND p."bondMaturesAt" IS NOT NULL AND p."bondCreatedAt" IS NOT NULL
                 AND abs(extract(epoch FROM (p."bondMaturesAt" - p."bondCreatedAt")) / 86400 - p."bondDays") > 1 THEN 'maturity date does not match the term' END,
           CASE WHEN p."bondAmount" > 0 AND p."bondLastClaimedAt" > now() THEN 'yield claimed in the future' END,
           CASE WHEN p."bondAmount" <= 0 AND (p."bondRate" <> 0 OR p."bondDays" <> 0 OR p."bondMaturesAt" IS NOT NULL) THEN 'bond fields left behind without a bond' END,
           CASE WHEN p."loanAmount" > 0 AND p."loanCreatedAt" IS NULL THEN 'loan without a start date' END,
           CASE WHEN p."loanAmount" > p."creditsBank" THEN 'loan larger than the bank balance (collateral)' END,
           CASE WHEN p."loanAmount" < 0 OR p."bondAmount" < 0 THEN 'negative loan or bond' END) AS flags,
         p."id" AS pilot_id
  FROM "PilotState" p
  LEFT JOIN rates r ON r.days = p."bondDays"
)
SELECT * FROM flagged WHERE flags <> ''
ORDER BY "bondAmount" DESC, "loanAmount" DESC
LIMIT 500;
