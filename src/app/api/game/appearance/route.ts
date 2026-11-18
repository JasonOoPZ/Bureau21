import {
  CallsignTakenError,
  callsignFields,
  callsignSchema,
  claimCallsign,
  isCallsignConflict,
} from "@/lib/callsign";
import { EconomyError, economyErrorResponse, economyTx, guardedPilotUpdate } from "@/lib/economy";
import { getOrCreatePilotState } from "@/lib/game-state";
import { requireUser } from "@/lib/require-user";
import { starterCharacters } from "@/lib/starter-characters";
import { NextResponse } from "next/server";
import { z } from "zod";

const APPEARANCE_CHANGE_COST = 100;

const schema = z.object({
  characterSlug: z.string().min(2).max(64),
  callsign: callsignSchema.optional(),
  gender: z.enum(["male", "female", "non-binary", "unspecified"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const userId = auth.userId;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const callsignIssue = parsed.error.issues.find((issue) => issue.path[0] === "callsign");
    return NextResponse.json(
      { error: callsignIssue?.message ?? "Invalid appearance payload." },
      { status: 400 }
    );
  }

  const { characterSlug, callsign, gender } = parsed.data;

  const validSlug = starterCharacters.some((c) => c.slug === characterSlug);
  if (!validSlug) {
    return NextResponse.json({ error: "Unknown alien model." }, { status: 400 });
  }

  const pilot = await getOrCreatePilotState(userId, auth.name);

  const changeCost = pilot.appearanceSelections === 0 ? 0 : APPEARANCE_CHANGE_COST;
  const insufficientCredits = `Not enough credits. ${APPEARANCE_CHANGE_COST} credits required for appearance change.`;
  if (pilot.credits < changeCost) {
    return NextResponse.json({ error: insufficientCredits }, { status: 402 });
  }

  try {
    const updated = await economyTx(async (tx) => {
      // The price depends on appearanceSelections, so both it and the balance
      // are re-checked in the write itself: parallel requests cannot all
      // claim the free first selection or overdraw.
      const row = await guardedPilotUpdate(
        tx,
        userId,
        { appearanceSelections: pilot.appearanceSelections, credits: { gte: changeCost } },
        {
          characterSlug,
          appearanceSelections: { increment: 1 },
          appearanceNeedsSetup: false,
          credits: { decrement: changeCost },
          ...(gender ? { gender } : {}),
        }
      );
      if (!row) throw new EconomyError("Appearance could not be updated. Refresh and try again.", 409);

      if (callsign && callsign !== row.callsign) {
        // Same rules as the settings rename: unique ignoring case, and
        // User.name kept in step with the callsign.
        await claimCallsign(tx, callsign, userId);
        await tx.pilotState.update({ where: { userId }, data: callsignFields(callsign) });
        await tx.user.update({ where: { id: userId }, data: { name: callsign } });
      }

      return row;
    });

    return NextResponse.json({
      characterSlug: updated.characterSlug,
      credits: updated.credits,
      appearanceSelections: updated.appearanceSelections,
      appearanceNeedsSetup: updated.appearanceNeedsSetup,
      spentCredits: changeCost,
      nextChangeCost: APPEARANCE_CHANGE_COST,
    });
  } catch (error) {
    if (error instanceof CallsignTakenError || isCallsignConflict(error)) {
      return NextResponse.json({ error: new CallsignTakenError().message }, { status: 409 });
    }
    return economyErrorResponse(error);
  }
}
