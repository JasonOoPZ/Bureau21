import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  CallsignTakenError,
  callsignFields,
  callsignSchema,
  claimCallsign,
  isCallsignConflict,
} from "@/lib/callsign";
import { economyTx } from "@/lib/economy";
import { clientIp, durableRateLimit, tooManyRequests } from "@/lib/rate-limit";
import { defaultStarterCharacter, starterCharacters } from "@/lib/starter-characters";
import { generateWalletAddress } from "@/lib/wallet";

const REGISTER_WINDOW_MS = 15 * 60_000;
const REGISTER_MAX_PER_IP = 5;
const REGISTER_MAX_PER_EMAIL = 3;

const STARTER_SLUGS = starterCharacters.map((character) => character.slug) as [string, ...string[]];

const registerSchema = z.object({
  pilotName: callsignSchema,
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  starterCharacter: z.enum(STARTER_SLUGS).optional(),
});

/**
 * One message for "email already registered" and for unexpected failures, so
 * the response does not confirm that an address has an account. (A fully
 * silent flow needs email verification; until then the rate limit below caps
 * how fast addresses can be probed.)
 */
const GENERIC_FAILURE =
  "Registration could not be completed. If you already have an account, sign in or reset your password.";

class EmailInUseError extends Error {}

function genericFailure() {
  return NextResponse.json({ error: GENERIC_FAILURE }, { status: 400 });
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const ipLimit = await durableRateLimit(`register:ip:${ip}`, REGISTER_MAX_PER_IP, REGISTER_WINDOW_MS);
  if (ipLimit.limited) {
    return tooManyRequests("Too many registration attempts. Try again later.", ipLimit.retryAfterMs);
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const pilotNameIssue = parsed.error.issues.find((issue) => issue.path[0] === "pilotName");
    return NextResponse.json(
      { error: pilotNameIssue?.message ?? "Invalid registration payload." },
      { status: 400 }
    );
  }

  const { pilotName, email, password, starterCharacter } = parsed.data;

  const emailLimit = await durableRateLimit(
    `register:ip-email:${ip}:${email.toLowerCase()}`,
    REGISTER_MAX_PER_EMAIL,
    REGISTER_WINDOW_MS
  );
  if (emailLimit.limited) {
    return tooManyRequests("Too many registration attempts. Try again later.", emailLimit.retryAfterMs);
  }

  try {
    // Hash before any lookup so the response time does not depend on
    // whether the email is already registered.
    const hashedPassword = await bcrypt.hash(password, 12);

    let walletAddress: string | undefined;
    try {
      walletAddress = await generateWalletAddress();
    } catch {
      // Wallet generation is non-critical
    }

    await economyTx(async (tx) => {
      // Callsigns are public, so reporting a clash leaks nothing. Checked
      // before the email so that answer never depends on the email either.
      await claimCallsign(tx, pilotName);

      const existing = await tx.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      });
      if (existing) throw new EmailInUseError();

      await tx.user.create({
        data: {
          name: pilotName,
          email,
          hashedPassword,
          ...(walletAddress ? { walletAddress } : {}),
          pilotState: {
            create: {
              ...callsignFields(pilotName),
              characterSlug: starterCharacter ?? defaultStarterCharacter,
              appearanceNeedsSetup: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CallsignTakenError || isCallsignConflict(error)) {
      return NextResponse.json({ error: new CallsignTakenError().message }, { status: 409 });
    }
    if (error instanceof EmailInUseError) {
      return genericFailure();
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Lost a race on the unique email index.
      return genericFailure();
    }
    console.error("[register] failed to create account", error);
    return genericFailure();
  }
}
