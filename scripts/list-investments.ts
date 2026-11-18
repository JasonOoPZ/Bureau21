import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "./_guard";

const guard = initGuard({ script: "list-investments", mutates: false });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const all = await prisma.wealthInvestment.findMany({
    include: { pilot: { select: { callsign: true } } },
    orderBy: { createdAt: "asc" },
  });
  console.log("All investments:");
  for (const inv of all) {
    console.log(`  ${inv.pilot.callsign} - ${inv.name} | ${inv.days}d | ${inv.rate}% | ${inv.amount.toLocaleString()} SVN`);
  }
  console.log(`Total: ${all.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
