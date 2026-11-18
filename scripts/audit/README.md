# Audit queries

Read-only SQL for finding value that was created by the exploits fixed in the
audit PRs, and for checking the data before the `schema_hardening` migration.

Every `.sql` file in this folder is **SELECT only** and safe to run against
production. The one exception lives in `fixes/` and says so in capitals at the
top; it ships as a dry run.

Run one with psql:

```
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/01_credit_outliers.sql
```

or paste it into the Neon SQL editor. For extra safety run them on a Neon
branch of production instead of production itself. All of them work both
before and after the migration.

None of these queries prove abuse on their own. They rank candidates; look at
the account before acting on it.

## Before the migration (blocking)

| File | Finds | Normal result | If it returns rows |
|---|---|---|---|
| `10_duplicate_callsigns.sql` | Pilots sharing a callsign, ignoring case and extra spaces. | No rows. | The migration refuses to run. Rename all but one holder of each name: by hand, or with `fixes/rename_duplicate_callsigns.sql` (oldest pilot keeps the name, the others get `-xxxx` appended; run it once as shipped to see the plan, then change its last line to `COMMIT`). Expect several accounts called `Rookie Pilot`: that was the default name for accounts without one. |
| `04_negative_balances.sql` | Pilots with any balance below zero, and negative treasuries. | No rows. | The migration refuses to run. Decide per row what the balance should be (normally 0) and correct it. A negative balance is itself evidence of a raced debit, so check the same pilot in `01`. |

## Before the migration (informational)

| File | Finds | Normal result | Notes |
|---|---|---|---|
| `08_duplicate_missions.sql` | Missions that exist twice for one pilot, and which copy survives. | No rows, or a handful from the old race. | The migration deletes the copies marked `removed by the migration`. A completed copy always wins, so nobody can be paid twice. |
| `09_pilotless_name_clashes.sql` | Accounts with no pilot yet whose name equals an existing callsign. | Few or no rows. | Not a blocker. Those accounts get a numeric suffix when they first play. |

## Exploited value

| File | Finds | Normal result | What stands out |
|---|---|---|---|
| `01_credit_outliers.sql` | The 50 richest pilots (credits + bank + bond) next to the server's p50 / p90 / p99. | A smooth curve: the top few pilots within roughly 10x of p99, wealth rising with level. | `times_p99` in the hundreds or more, a low level with a huge total, `at_int_max = true` (2,147,483,647 is where the old code saturated). |
| `02_crash_payout_anomalies.sql` | Void Runner bets that paid over 100x, over 10M, or with a bet outside 10..1,000,000. | No rows. The fixed game cannot produce any of these. | Every row is from the "wait, then cash out" exploit. Sum `net` per pilot to size the damage. |
| `03_casino_winnings_by_pilot.sql` | Net casino winners per game with their long-run return. | Returns near or below 100% on any real number of bets; a few lucky short runs above it. | A return far above 100% across many bets, or one pilot holding most of a game's payouts. Transfers between pilots are not logged anywhere, so this is the only money trail. |
| `05_hydroponics_out_of_bounds.sql` | Hydroponics saves outside the rules: inventory over 750, negative stacks or wages, more than 30 staff, unknown or repeated properties, more than 30 plots, research points out of range, stored events. | No rows once every active player has loaded the bay since the fix (the server rewrites a save on load). Until then, rows for inactive players with small numbers. | Inventory in the millions, a negative wage (it paid the player hourly), `stored active event`. Cross-check the pilot in `01`. |
| `06_bond_loan_anomalies.sql` | Bonds with a term or rate the bank does not offer, missing or inconsistent dates, loans above the collateral. | No rows, or leftovers such as `bond fields left behind without a bond` from old code (harmless). | A rate that does not match its term, a loan larger than the bank balance. |
| `07_stat_allocation_anomalies.sql` | Pilots whose allocated stats plus unspent points exceed the 8 points per level they can have earned. | No rows. | `unexplained` is how many points were spent without being earned (the parallel allocate exploit). Admin-edited test accounts show up here too. |

## What these cannot tell you

- There is no transfer ledger and no credit history, so a balance that was
  minted and then sent to another pilot only shows as the receiver being rich.
- The hydroponics sanitizer cannot tell a forged property or stack from an
  earned one when the value is within the rules.
- `07` assumes strength and speed only grow through allocation and the gym.
  Any other source added later needs to be added to the query.
