import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "../_guard";

const guard = initGuard({ script: "fix-limitless-card", mutates: true });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update bonusType from "none" to "yield"
  const where = { name: "Nexus Limitless Yield", type: "special", bonusType: "none" };
  const affected = await prisma.inventoryItem.count({ where });
  const updated = await guard.mutate(
    `set bonusType "none" -> "yield" on ${affected} Nexus Limitless Yield card(s)`,
    () => prisma.inventoryItem.updateMany({ where, data: { bonusType: "yield" } }),
  );
  if (updated) {
    console.log(`Updated ${updated.count} card(s) bonusType -> "yield"`);
  }

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
  guard.summary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
