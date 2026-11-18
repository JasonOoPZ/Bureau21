import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "../_guard";

const guard = initGuard({ script: "give-ring-and-omega", mutates: true });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: "Violent Pawn" },
    select: { id: true, callsign: true },
  });
  if (!pilot) { console.log("Pilot 'Violent Pawn' not found."); return; }

  const items = [
    {
      name: "Ring Of Power",
      type: "special",
      tier: 5,
      bonusType: "access",
      bonusAmt: 0,
    },
    {
      name: "DIRECTIVE ZERO",
      type: "weapon",
      tier: 8, // OMEGA tier index
      bonusType: "atk",
      bonusAmt: 1000,
    },
    {
      name: "PROTOCOL ALPHA",
      type: "armor",
      tier: 8, // OMEGA tier index
      bonusType: "def",
      bonusAmt: 1000,
    },
  ];

  for (const item of items) {
    // Check if already has it
    const existing = await prisma.inventoryItem.findFirst({
      where: { pilotId: pilot.id, name: item.name },
    });
    if (existing) {
      console.log(`  ${pilot.callsign} already has ${item.name} — skipped.`);
      continue;
    }

    await guard.mutate(`give ${item.name} (${item.type}, tier ${item.tier}) to ${pilot.callsign}`, () =>
      prisma.inventoryItem.create({
        data: { pilotId: pilot.id, ...item },
      }),
    );
  }

  guard.summary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
