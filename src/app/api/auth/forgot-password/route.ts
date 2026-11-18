import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clientIp, durableRateLimit, tooManyRequests } from "@/lib/rate-limit";

const FORGOT_WINDOW_MS = 15 * 60_000;
const FORGOT_MAX_PER_IP = 5;
const TOKEN_TTL_MS = 60 * 60_000;
/**
 * Live reset links allowed per account. A new request never cancels an older
 * link (that let anyone who knew an email address keep the owner's link dead
 * by calling this endpoint in a loop). Once the cap is reached no further
 * mail is sent until a link expires, which also caps inbox flooding.
 */
const MAX_ACTIVE_TOKENS = 3;

const schema = z.object({
  email: z.string().trim().email().max(254),
});

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFromEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[Bureau 21] Password reset link for ${email}:\n${resetUrl}\n`);
    }
    return;
  }

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: "Bureau 21 password reset",
    text: `You requested a password reset. Open this link to continue: ${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your Bureau 21 password</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}

export async function POST(request: Request) {
  // Keyed on IP only: the answer must not depend on whether the email exists.
  const limit = await durableRateLimit(`forgot:ip:${clientIp(request.headers)}`, FORGOT_MAX_PER_IP, FORGOT_WINDOW_MS);
  if (limit.limited) {
    return tooManyRequests("Too many reset requests. Try again later.", limit.retryAfterMs);
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);

    // Return ok regardless to prevent email enumeration
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, hashedPassword: true },
    });

    // Only send reset links for accounts with a password (not OAuth-only)
    if (!user?.hashedPassword) {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    // Housekeeping only: expired links are already unusable.
    await prisma.passwordResetToken.deleteMany({ where: { email, expires: { lt: now } } });

    const activeTokens = await prisma.passwordResetToken.count({ where: { email, expires: { gte: now } } });
    if (activeTokens >= MAX_ACTIVE_TOKENS) {
      // The owner already has working links in their inbox.
      return NextResponse.json({ ok: true });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(now.getTime() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.create({
      data: { email, tokenHash, expires },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (error) {
      console.error("[Bureau 21] Failed to send password reset email", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[forgot-password] request failed", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
