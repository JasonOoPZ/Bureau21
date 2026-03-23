import { defaultStarterCharacter } from "@/lib/starter-characters";
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

    await prisma.user.create({
      data: {
        name: pilotName,
        email,
        hashedPassword,
        pilotState: {
          create: {
            callsign: pilotName,
            characterSlug: starterCharacter ?? defaultStarterCharacter,
          },
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
