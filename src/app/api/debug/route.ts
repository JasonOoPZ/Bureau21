import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.DATABASE_URL = process.env.DATABASE_URL ? `SET (${process.env.DATABASE_URL.length} chars)` : "MISSING";
  checks.NEXTAUTH_URL = process.env.NEXTAUTH_URL ?? "MISSING";
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "SET" : "MISSING";
  checks.NEXT_PUBLIC_THIRDWEB_CLIENT_ID = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ? "SET" : "MISSING";
  checks.THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY ? "SET" : "MISSING";
  checks.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ? "SET" : "MISSING";
  checks.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
    ? `SET (${process.env.GOOGLE_CLIENT_SECRET.length} chars, starts: ${process.env.GOOGLE_CLIENT_SECRET.substring(0, 7)}...)`
    : "MISSING";
  checks.NODE_ENV = process.env.NODE_ENV ?? "MISSING";

  // Test DB connection
  try {
    const userCount = await prisma.user.count();
    checks.DB_CONNECTION = `OK (${userCount} users)`;
  } catch (err) {
    checks.DB_CONNECTION = `FAILED: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(checks);
}
