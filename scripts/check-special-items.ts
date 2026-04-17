import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const items = await prisma.inventoryItem.findMany({
    where: { pilot: { callsign: "Violent Pawn" }, type: "special" },
    select: { name: true, bonusType: true, bonusAmt: true, tier: true },
  });
  console.log("Special items for Violent Pawn:");
  for (const i of items) {
    console.log(`  ${i.name} | tier=${i.tier} | bonusType=${i.bonusType} | bonusAmt=${i.bonusAmt}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
