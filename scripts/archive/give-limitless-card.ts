import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "../_guard";

const guard = initGuard({ script: "give-limitless-card", mutates: true });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: { contains: "Violent", mode: "insensitive" } },
  });
  if (!pilot) {
    console.log("Pilot not found");
    return;
  }
  console.log(`Found: ${pilot.callsign}`);

  // Check if they already have the card
  const existing = await prisma.inventoryItem.findFirst({
    where: { pilotId: pilot.id, name: "Nexus Limitless Yield", type: "special" },
  });
  if (existing) {
    console.log("Already has Nexus Limitless Yield card.");
    return;
  }

  const card = await guard.mutate(
    `create a Nexus Limitless Yield card for ${pilot.callsign} (${pilot.id})`,
    () =>
      prisma.inventoryItem.create({
        data: {
          pilotId: pilot.id,
          name: "Nexus Limitless Yield",
          type: "special",
          tier: 5,
          bonusType: "yield",
          bonusAmt: 0,
          equipped: false,
        },
      }),
  );
  if (card) {
    console.log(`Gave Nexus Limitless Yield card to ${pilot.callsign} (id: ${card.id})`);
  }
  guard.summary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
