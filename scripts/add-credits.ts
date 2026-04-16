import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find Violent Pawn
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: { contains: "Violent", mode: "insensitive" } },
  });
  if (!pilot) {
    console.log("Pilot not found");
    return;
  }
  console.log(`Found: ${pilot.callsign} (id: ${pilot.id})`);

  // Check if already has the card
  const existing = await prisma.inventoryItem.findFirst({
    where: { pilotId: pilot.id, name: "Centurion Venture Card", type: "special" },
  });
  if (existing) {
    console.log("Already has Centurion Venture Card.");
    return;
  }

  // Give the card
  const card = await prisma.inventoryItem.create({
    data: {
      pilotId: pilot.id,
      name: "Centurion Venture Card",
      type: "special",
      tier: 4,
      bonusType: "access",
      bonusAmt: 0,
      equipped: false,
    },
  });
  console.log(`Created Centurion Venture Card (id: ${card.id}) for ${pilot.callsign}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
