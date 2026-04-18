import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { GAME_CONSTANTS } from "@/lib/constants";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const scanSchema = z.object({
  levelMin: z.number().int().min(1).max(500).optional(),
  levelMax: z.number().int().min(1).max(500).optional(),
  minAgeDays: z.number().int().min(0).optional(),
  gender: z.enum(["male", "female"]).optional(),
  sameSector: z.boolean().optional(),
  onlineOnly: z.boolean().optional(),
  excludeWatchlist: z.boolean().optional(),
  excludeStaff: z.boolean().optional(),
  attackableOnly: z.boolean().optional(),
  syndicateFilter: z.string().optional(),
  sortBy: z.enum(["id", "level", "kills"]).optional(),
  page: z.number().int().min(1).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = scanSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid filters." }, { status: 400 });

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const filters = parsed.data;
  const page = filters.page ?? 1;
  const pageSize = GAME_CONSTANTS.SCANNER_PAGE_SIZE;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    userId: { not: session.user.id },
  };

  // Level range
  if (filters.levelMin || filters.levelMax) {
    where.level = {};
    if (filters.levelMin) where.level.gte = filters.levelMin;
    if (filters.levelMax) where.level.lte = filters.levelMax;
  }

  // Account age
  if (filters.minAgeDays) {
    const cutoff = new Date(Date.now() - filters.minAgeDays * 24 * 60 * 60 * 1000);
    where.createdAt = { lte: cutoff };
  }

  // Gender
  if (filters.gender) {
    where.gender = filters.gender;
  }

  // Same sector
  if (filters.sameSector) {
    where.currentSector = pilot.currentSector;
  }

  // Online (active in last 15 minutes)
  if (filters.onlineOnly) {
    const onlineCutoff = new Date(Date.now() - 15 * 60 * 1000);
    where.lastActionAt = { gte: onlineCutoff };
  }

  // Attackable only (level >= newbie protection)
  if (filters.attackableOnly) {
    where.level = { ...where.level, gte: Math.max(where.level?.gte ?? 0, GAME_CONSTANTS.NEWBIE_PROTECTION_LEVEL) };
  }

  // Exclude bureau staff
  if (filters.excludeStaff) {
    where.user = { role: { not: "admin" } };
  }

  // Exclude watchlisted pilots
  if (filters.excludeWatchlist) {
    const watchlistIds = await prisma.watchlist.findMany({
      where: { pilotId: pilot.id },
      select: { targetPilotId: true },
    });
    if (watchlistIds.length > 0) {
      where.id = { notIn: watchlistIds.map((w) => w.targetPilotId) };
    }
  }

  // Syndicate filters
  if (filters.syndicateFilter && filters.syndicateFilter !== "any") {
    if (filters.syndicateFilter === "none") {
      where.syndicateMember = { is: null };
    } else if (filters.syndicateFilter === "not_mine") {
      const mySyndicate = await prisma.syndicateMember.findUnique({
        where: { pilotId: pilot.id },
        select: { syndicateId: true },
      });
      if (mySyndicate) {
        where.syndicateMember = { syndicateId: { not: mySyndicate.syndicateId } };
      }
    } else {
      // Specific syndicate ID
      where.syndicateMember = { syndicateId: filters.syndicateFilter };
    }
  }

  // Sort
  let orderBy: Record<string, string> = { level: "asc" };
  if (filters.sortBy === "id") orderBy = { createdAt: "asc" };
  else if (filters.sortBy === "kills") orderBy = { kills: "desc" };

  const [results, total] = await Promise.all([
    prisma.pilotState.findMany({
      where,
      select: {
        id: true,
        userId: true,
        callsign: true,
        level: true,
        gender: true,
        characterSlug: true,
        currentSector: true,
        kills: true,
        lastActionAt: true,
        syndicateMember: {
          select: {
            syndicate: { select: { tag: true, name: true } },
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pilotState.count({ where }),
  ]);

  const onlineCutoff = new Date(Date.now() - 15 * 60 * 1000);

  return NextResponse.json({
    results: results.map((r) => ({
      id: r.id,
      odId: r.id.slice(-6).toUpperCase(),
      userId: r.userId,
      callsign: r.callsign,
      level: r.level,
      gender: r.gender,
      characterSlug: r.characterSlug,
      sector: r.currentSector,
      kills: r.kills,
      online: r.lastActionAt >= onlineCutoff,
      syndicateTag: r.syndicateMember?.syndicate?.tag ?? null,
      syndicateName: r.syndicateMember?.syndicate?.name ?? null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}
