import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "./_guard";

const guard = initGuard({ script: "check-card", mutates: false });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const card = await prisma.inventoryItem.findFirst({
    where: { name: "Nexus Limitless Yield", type: "special" },
    include: { pilot: { select: { callsign: true, userId: true } } },
  });
  console.log("Card:", JSON.stringify(card, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
