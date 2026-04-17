import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: "Violent Pawn" },
    include: { inventory: { where: { equipped: true } } },
  });
  if (!pilot) return console.log("Pilot not found");
  console.log("Equipped items for Violent Pawn:");
  for (const i of pilot.inventory) {
    console.log(`  ${i.name} | type=${i.type} | tier=${i.tier} | equipped=${i.equipped}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
