import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "./_guard";

const guard = initGuard({ script: "update-wealth-rates", mutates: true });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

const NEW_RATES: Record<number, number> = {
  7: 2, 14: 5, 30: 13, 45: 22, 60: 33, 90: 55, 180: 125, 365: 275,
};

async function main() {
  const investments = await prisma.wealthInvestment.findMany({
    include: { pilot: { select: { callsign: true } } },
  });

  console.log(`Found ${investments.length} active investments.`);

  for (const inv of investments) {
    const newRate = NEW_RATES[inv.days];
    if (newRate && newRate !== inv.rate) {
      await guard.mutate(
        `update ${inv.pilot.callsign}'s ${inv.name} (${inv.days}d, ${inv.id}) rate: ${inv.rate}% → ${newRate}%`,
        () =>
          prisma.wealthInvestment.update({
            where: { id: inv.id },
            data: { rate: newRate },
          }),
      );
    } else {
      console.log(`  ${inv.pilot.callsign}'s ${inv.name} (${inv.days}d): already at ${inv.rate}% — skipped`);
    }
  }

  guard.summary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
