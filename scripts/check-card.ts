import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const card = await prisma.inventoryItem.findFirst({
    where: { name: "Nexus Limitless Yield", type: "special" },
    include: { pilot: { select: { callsign: true, userId: true } } },
  });
  console.log("Card:", JSON.stringify(card, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
