import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/auth";
import { ADMIN_ROLE } from "@/lib/access";

export type RequireUserResult =
  | { ok: true; userId: string; role: string; name: string | null }
  | { ok: false; response: NextResponse };

/**
 * Resolve the signed-in user for an API route.
 *
 *   const auth = await requireUser();
 *   if (!auth.ok) return auth.response;
 *
 * Suspension is enforced centrally: the NextAuth callbacks in src/auth.ts
 * re-read the user on every `getServerSession` call and return an empty
 * session for suspended, deleted or password-reset accounts, so those callers
 * get the 401 here. The 403 branch is a second line of defence in case a
 * session ever carries the flag.
 */
export async function requireUser(): Promise<RequireUserResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.suspended) {
    return { ok: false, response: NextResponse.json({ error: "Account suspended." }, { status: 403 }) };
  }

  return {
    ok: true,
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? null,
  };
}

/** Same as `requireUser`, but only admins pass. */
export async function requireAdmin(): Promise<RequireUserResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (auth.role !== ADMIN_ROLE) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return auth;
}
