import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, durableRateLimit, tooManyRequests } from "@/lib/rate-limit";

const RESET_WINDOW_MS = 15 * 60_000;
const RESET_MAX_PER_IP = 10;
const RESET_MAX_PER_IP_EMAIL = 5;

const schema = z.object({
  email: z.string().trim().email().max(254),
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const ipLimit = await durableRateLimit(`reset:ip:${ip}`, RESET_MAX_PER_IP, RESET_WINDOW_MS);
  if (ipLimit.limited) {
    return tooManyRequests("Too many attempts. Try again later.", ipLimit.retryAfterMs);
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { email, token, password } = parsed.data;

    const emailLimit = await durableRateLimit(
      `reset:ip-email:${ip}:${email.toLowerCase()}`,
      RESET_MAX_PER_IP_EMAIL,
      RESET_WINDOW_MS
    );
    if (emailLimit.limited) {
      return tooManyRequests("Too many attempts. Try again later.", emailLimit.retryAfterMs);
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.email !== email || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Changing hashedPassword also signs out every existing session: the JWT
    // carries a fingerprint of the old hash (see the jwt callback in auth.ts).
    // All outstanding links for the account die with the one that was used.
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { hashedPassword },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { email },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[reset-password] request failed", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
