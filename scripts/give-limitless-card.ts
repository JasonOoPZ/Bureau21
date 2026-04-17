import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
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

  const card = await prisma.inventoryItem.create({
    data: {
      pilotId: pilot.id,
      name: "Nexus Limitless Yield",
      type: "special",
      tier: 5,
      bonusType: "yield",
      bonusAmt: 0,
      equipped: false,
    },
  });
  console.log(`Gave Nexus Limitless Yield card to ${pilot.callsign} (id: ${card.id})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
