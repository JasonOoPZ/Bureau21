import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const vcs = await prisma.wealthInvestment.findMany({
    where: { name: "Venture Capital" },
    include: { pilot: { select: { callsign: true, id: true, tokens: true } } },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${vcs.length} Venture Capital investments:`);
  for (const vc of vcs) {
    console.log(`  ID: ${vc.id} | Pilot: ${vc.pilot.callsign} | Amount: ${vc.amount} | Rate: ${vc.rate}% | Created: ${vc.createdAt.toISOString()}`);
  }

  if (vcs.length < 2) {
    console.log("No duplicates found.");
    return;
  }

  // Group by pilot
  const byPilot: Record<string, typeof vcs> = {};
  for (const vc of vcs) {
    if (!byPilot[vc.pilotId]) byPilot[vc.pilotId] = [];
    byPilot[vc.pilotId].push(vc);
  }

  for (const [pilotId, list] of Object.entries(byPilot)) {
    if (list.length <= 1) continue;

    // Keep the newest, remove the oldest
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const toRemove = list[0];
    const toKeep = list[list.length - 1];

    console.log(`\nRemoving duplicate for ${toRemove.pilot.callsign}:`);
    console.log(`  Removing: ${toRemove.id} (rate: ${toRemove.rate}%, created: ${toRemove.createdAt.toISOString()})`);
    console.log(`  Keeping:  ${toKeep.id} (rate: ${toKeep.rate}%, created: ${toKeep.createdAt.toISOString()})`);
    console.log(`  Refunding ${toRemove.amount.toLocaleString()} SVN`);

    await prisma.$transaction([
      prisma.wealthInvestment.delete({ where: { id: toRemove.id } }),
      prisma.pilotState.update({
        where: { id: pilotId },
        data: { tokens: { increment: toRemove.amount } },
      }),
    ]);
    console.log(`  Done. Refunded ${toRemove.amount.toLocaleString()} SVN to ${toRemove.pilot.callsign}`);

    // Ensure the kept one has correct rate
    if (toKeep.rate !== 125) {
      await prisma.wealthInvestment.update({
        where: { id: toKeep.id },
        data: { rate: 125 },
      });
      console.log(`  Updated kept VC rate to 125%`);
    }
  }

  // Also check ALL investments for any other duplicates by days per pilot
  console.log("\n--- Checking for other duplicate tiers ---");
  const all = await prisma.wealthInvestment.findMany({
    include: { pilot: { select: { callsign: true } } },
    orderBy: { createdAt: "asc" },
  });
  const seen: Record<string, Set<number>> = {};
  for (const inv of all) {
    if (!seen[inv.pilotId]) seen[inv.pilotId] = new Set();
    if (seen[inv.pilotId].has(inv.days)) {
      console.log(`  DUPLICATE: ${inv.pilot.callsign} has another ${inv.name} (${inv.days}d) — ID: ${inv.id}`);
    } else {
      seen[inv.pilotId].add(inv.days);
    }
  }
  console.log("Scan complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
