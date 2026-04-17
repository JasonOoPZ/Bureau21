import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Find the card directly
  const card = await prisma.inventoryItem.findFirst({
    where: { name: "Nexus Limitless Yield", type: "special" },
    include: { pilot: { select: { callsign: true, userId: true } } },
  });
  console.log("Direct query:", JSON.stringify(card, null, 2));

  if (!card) {
    console.log("NO CARD FOUND AT ALL");
    return;
  }

  // 2. Query exactly as bank/page.tsx does  
  const bankQuery = await prisma.inventoryItem.findFirst({
    where: {
      pilot: { userId: card.pilot.userId },
      name: "Nexus Limitless Yield",
      type: "special",
    },
  });
  console.log("\nBank page query result:", bankQuery ? "FOUND" : "NOT FOUND");

  // 3. Also check the wealth API query
  const wealthQuery = await prisma.inventoryItem.findFirst({
    where: {
      pilot: { userId: card.pilot.userId },
      name: "Nexus Limitless Yield",
      type: "special",
    },
  });
  console.log("Wealth API query result:", wealthQuery ? "FOUND" : "NOT FOUND");
}

main().catch(console.error).finally(() => prisma.$disconnect());
