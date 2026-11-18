import { ADMIN_ROLE } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-user";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["player", "admin"]),
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
      return NextResponse.json({ error: "Invalid role payload." }, { status: 400 });
    }

    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json({ error: "User id is required." }, { status: 400 });
    }

    if (userId === auth.userId && parsed.data.role !== ADMIN_ROLE) {
      return NextResponse.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 }
      );
    }

    // Admins are exempt from suspension, so promoting a suspended account
    // would quietly lift the ban. Require an explicit restore first; the
    // guard is in the WHERE clause so it holds against a concurrent suspend.
    const promoting = parsed.data.role === ADMIN_ROLE;
    const updated = await prisma.user.updateManyAndReturn({
      where: { id: userId, ...(promoting ? { suspended: false } : {}) },
      data: { role: parsed.data.role },
      select: { id: true, role: true },
    });

    if (updated.length === 0) {
      const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!target) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }
      return NextResponse.json(
        { error: "This account is suspended. Restore it before granting the admin role." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, user: updated[0] });
  } catch (error) {
    console.error("[admin] failed to update role", error);
    return NextResponse.json({ error: "Failed to update role." }, { status: 500 });
  }
}
