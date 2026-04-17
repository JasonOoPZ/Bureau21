import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
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
      await prisma.wealthInvestment.update({
        where: { id: inv.id },
        data: { rate: newRate },
      });
      console.log(`  Updated ${inv.pilot.callsign}'s ${inv.name} (${inv.days}d): ${inv.rate}% → ${newRate}%`);
    } else {
      console.log(`  ${inv.pilot.callsign}'s ${inv.name} (${inv.days}d): already at ${inv.rate}% — skipped`);
    }
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
