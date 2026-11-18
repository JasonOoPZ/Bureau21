# Migrations

The database used to be managed with `prisma db push`. From here on it is
managed with Prisma Migrate. **Do not run `prisma db push` against production
again**: it would drop the hand-written parts of these migrations' work
without recording anything.

| Migration | What it is |
|---|---|
| `0_init` | Baseline. Exactly the schema production already has (generated from `main`'s `schema.prisma`). It is never executed on production; it is marked as applied. |
| `20261118000000_schema_hardening` | Unique callsigns, board votes, allocated Life Force, unique missions, PvP log columns, persisted crash runs, rate-limit table, non-negative balance CHECKs. |

## First rollout on an existing database (production)

Run these from a machine with `DATABASE_URL` pointing at the database. Apply
the migration **before** deploying the code that needs it: the migration is
compatible with the code that is live today, the new code is not compatible
with the old schema.

1. Back up: create a Neon branch of production (Neon console, Branches, Create
   branch from `main` at the current time). That branch is the restore point.
2. Pre-flight, read-only:
   ```
   psql "$DATABASE_URL" -f scripts/audit/10_duplicate_callsigns.sql
   psql "$DATABASE_URL" -f scripts/audit/04_negative_balances.sql
   psql "$DATABASE_URL" -f scripts/audit/08_duplicate_missions.sql
   ```
   Rows from the first two block the migration and must be resolved first
   (`scripts/audit/README.md` says how). Rows from the third are removed by
   the migration itself; read them so you know what will go.
3. Tell Prisma the baseline is already there (creates `_prisma_migrations`,
   changes nothing else):
   ```
   npx prisma migrate resolve --applied 0_init
   ```
4. Apply:
   ```
   npx prisma migrate deploy
   ```
5. Verify:
   ```
   npx prisma migrate status          # "Database schema is up to date!"
   ```
6. Deploy the application.

## If `migrate deploy` fails

The migration starts with pre-flight checks that run before anything is
changed, so a pre-flight failure leaves the database exactly as it was
(verified on a local Postgres). The error says what to fix
(`schema_hardening pre-flight failed: ...`). Prisma records the attempt as
failed, so after fixing the data:

```
npx prisma migrate resolve --rolled-back 20261118000000_schema_hardening
npx prisma migrate deploy
```

## Writing the next migration

`npx prisma migrate dev --name <what_it_does>` against a local database.

Some objects in `schema_hardening` are hand-written SQL that Prisma does not
model: the `PilotState_callsignLower_sync` trigger, the CHECK constraints and
the partial unique index `CrashRun_one_open_per_pilot`. Prisma's diff ignores
them (verified: `prisma migrate diff` from a migrated database to
`schema.prisma` is empty). Still, read every generated migration before
committing it, and delete any statement that drops one of them.
