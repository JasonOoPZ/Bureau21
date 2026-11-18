import { Prisma } from "@prisma/client";
import { callsignFields, claimAvailableCallsign, isCallsignConflict } from "@/lib/callsign";
import { prisma } from "@/lib/prisma";
import { defaultStarterCharacter } from "@/lib/starter-characters";

const PROVISION_ATTEMPTS = 3;
const TX_MAX_WAIT_MS = 5_000;
const TX_TIMEOUT_MS = 10_000;

function isDuplicatePilot(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return false;
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes("userId") : String(target ?? "").includes("userId");
}

/**
 * Give a user their pilot, with a legal callsign nobody else holds.
 *
 * This is the only place a pilot is created outside registration: first
 * OAuth sign-in and the lazy path for accounts that predate it both end up
 * here, so both claim the name the same way (advisory lock, uniqueness check
 * against pilots and account names, numeric suffix on a clash) and both keep
 * `User.name` equal to the callsign.
 *
 * Idempotent and safe to call in parallel: a pilot that already exists, or
 * that a concurrent request creates first, is left alone.
 */
export async function provisionPilot(userId: string, displayName: string | null | undefined): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await prisma.$transaction(
        async (tx) => {
          const existing = await tx.pilotState.findUnique({ where: { userId }, select: { id: true } });
          if (existing) return;

          const callsign = await claimAvailableCallsign(tx, displayName, userId);
          await tx.user.update({ where: { id: userId }, data: { name: callsign } });
          await tx.pilotState.create({
            data: {
              userId,
              ...callsignFields(callsign),
              characterSlug: defaultStarterCharacter,
              appearanceNeedsSetup: true,
            },
          });
        },
        { maxWait: TX_MAX_WAIT_MS, timeout: TX_TIMEOUT_MS }
      );
      return;
    } catch (error) {
      // A parallel request created this user's pilot first: nothing left to do.
      if (isDuplicatePilot(error)) return;
      // Lost the name at the unique index: pick another one.
      if (isCallsignConflict(error) && attempt < PROVISION_ATTEMPTS) continue;
      throw error;
    }
  }
}
