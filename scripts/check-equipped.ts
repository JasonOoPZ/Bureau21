import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { initGuard } from "./_guard";

const guard = initGuard({ script: "check-equipped", mutates: false });

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: guard.databaseUrl }) });

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: "Violent Pawn" },
    include: { inventory: { where: { equipped: true } } },
  });
  if (!pilot) return console.log("Pilot not found");
  console.log("Equipped items for Violent Pawn:");
  for (const i of pilot.inventory) {
    console.log(`  ${i.name} | type=${i.type} | tier=${i.tier} | equipped=${i.equipped}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
