import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "../_guard";

const guard = initGuard({ script: "remove-duplicate-vc", mutates: true });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: { contains: "Violent", mode: "insensitive" } },
  });
  if (!pilot) { console.log("Pilot not found"); return; }
  console.log(`Found: ${pilot.callsign} (tokens: ${pilot.tokens})`);

  const vcInvestments = await prisma.wealthInvestment.findMany({
    where: { pilotId: pilot.id, name: "Venture Capital" },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Venture Capital positions: ${vcInvestments.length}`);
  
  if (vcInvestments.length < 2) {
    console.log("No duplicate found.");
    return;
  }

  // Remove the second (newer) one
  const toRemove = vcInvestments[1];
  console.log(`Removing: ${toRemove.id} (${toRemove.amount.toLocaleString()} SVN, created ${toRemove.createdAt.toISOString()})`);

  await guard.mutate(
    `delete investment ${toRemove.id} and refund ${toRemove.amount.toLocaleString()} SVN to ${pilot.callsign}`,
    () =>
      prisma.$transaction([
        prisma.wealthInvestment.delete({ where: { id: toRemove.id } }),
        prisma.pilotState.update({
          where: { id: pilot.id },
          data: { tokens: { increment: toRemove.amount } },
        }),
      ]),
  );

  const updated = await prisma.pilotState.findUnique({ where: { id: pilot.id } });
  const remaining = await prisma.wealthInvestment.count({ where: { pilotId: pilot.id } });
  console.log(`Balance: ${updated?.tokens.toLocaleString()} SVN. Active positions: ${remaining}`);
  guard.summary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
