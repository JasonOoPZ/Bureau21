import { ADMIN_ROLE } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-user";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  suspended: z.boolean(),
});

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid suspension payload." }, { status: 400 });
    }

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    if (userId === auth.userId && parsed.data.suspended) {
      return NextResponse.json(
        { error: "You cannot suspend your own account." },
        { status: 400 }
      );
    }

    if (!parsed.data.suspended) {
      const restored = await prisma.user.updateManyAndReturn({
        where: { id: userId },
        data: { suspended: false },
        select: { id: true, suspended: true },
      });
      if (restored.length === 0) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, user: restored[0] });
    }

    // Admins are exempt from suspension (see isAccessBlocked), so suspending
    // one would silently do nothing. The role guard is part of the write, so
    // a concurrent promotion cannot slip a suspended admin through.
    const suspended = await prisma.user.updateManyAndReturn({
      where: { id: userId, role: { not: ADMIN_ROLE } },
      data: { suspended: true },
      select: { id: true, suspended: true },
    });

    if (suspended.length === 0) {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!target) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Admins cannot be suspended. Remove the admin role first." },
        { status: 409 }
      );
    }

    // No session bookkeeping needed: the jwt callback re-reads `suspended`
    // on the user's next request.
    return NextResponse.json({ ok: true, user: suspended[0] });
  } catch (error) {
    console.error("[admin] failed to update suspension state", error);
    return NextResponse.json({ error: "Failed to update suspension state." }, { status: 500 });
  }
}
