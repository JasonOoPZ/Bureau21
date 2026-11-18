# Archived one-off scripts

These scripts were written for a single data fix or grant and have **already
been applied** to the production database. They are kept for reference only
(what was changed, and how), not to be run again.

| Script | What it did |
|--------|-------------|
| `give-limitless-card.ts` | Granted the "Nexus Limitless Yield" special card to one pilot. |
| `fix-limitless-card.ts` | Corrected that card's `bonusType` from `none` to `yield`. |
| `debug-limitless.ts` | Read-only diagnosis of why the bank page did not see the card. |
| `give-ring-and-omega.ts` | Granted "Ring Of Power" plus the OMEGA-tier weapon and armor to one pilot. |
| `remove-duplicate-vc.ts` | Removed one pilot's duplicate Venture Capital position and refunded it. |
| `remove-dup-vc2.ts` | Second pass: removed remaining duplicate Venture Capital positions, refunded them, and normalised the kept rate. |

Most are idempotent (they check before they write), but they hardcode pilot
callsigns and IDs from the time they were written, so re-running them against
current data is not meaningful.

They are still wired to `../_guard.ts`: if one is ever run, it prints the
target database host, defaults to a dry run, and needs `--confirm` (plus an
allowlisted host or `--i-know-this-is-prod`) before it writes anything. See
the header of `scripts/_guard.ts` for the full contract.
