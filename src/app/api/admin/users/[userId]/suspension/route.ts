import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
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
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

    if (userId === session.user.id && parsed.data.suspended) {
      return NextResponse.json(
        { error: "You cannot suspend your own account." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { suspended: parsed.data.suspended },
      select: { id: true, suspended: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update suspension state." }, { status: 500 });
  }
}
