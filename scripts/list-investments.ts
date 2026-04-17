import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
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

main().catch(console.error).finally(() => prisma.$disconnect());
