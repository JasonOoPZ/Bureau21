import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
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
  try {
    const body = await request.json();
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

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
  } catch {
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
