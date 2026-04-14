import { defaultStarterCharacter } from "@/lib/starter-characters";
import { rateLimit } from "@/lib/rate-limit";
import { generateWalletAddress } from "@/lib/wallet";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  pilotName: z.string().min(2).max(32),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  starterCharacter: z.string().min(2).max(64).optional(),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(`register:${ip}`, 5, 900_000);
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid registration payload." }, { status: 400 });
    }

    const { pilotName, email, password, starterCharacter } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let walletAddress: string | undefined;
    try {
      walletAddress = await generateWalletAddress();
    } catch {
      // Wallet generation is non-critical
    }

    await prisma.user.create({
      data: {
        name: pilotName,
        email,
        hashedPassword,
        ...(walletAddress ? { walletAddress } : {}),
        pilotState: {
          create: {
            callsign: pilotName,
            characterSlug: starterCharacter ?? defaultStarterCharacter,
            appearanceNeedsSetup: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
