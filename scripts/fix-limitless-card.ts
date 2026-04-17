import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update bonusType from "none" to "yield"
  const updated = await prisma.inventoryItem.updateMany({
    where: { name: "Nexus Limitless Yield", type: "special", bonusType: "none" },
    data: { bonusType: "yield" },
  });
  console.log(`Updated ${updated.count} card(s) bonusType -> "yield"`);

  // Verify the exact query that bank/page.tsx uses
  const card = await prisma.inventoryItem.findFirst({
    where: {
      pilot: { userId: "cmnywm6pu0002l204do05yhni" },
      name: "Nexus Limitless Yield",
      type: "special",
    },
    include: { pilot: { select: { callsign: true, userId: true } } },
  });
  console.log("Bank page query result:", card ? `FOUND (id: ${card.id})` : "NOT FOUND");
}

main().catch(console.error).finally(() => prisma.$disconnect());
