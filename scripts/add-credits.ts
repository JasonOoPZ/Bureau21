import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { initGuard } from "./_guard";

const guard = initGuard({ script: "add-credits", mutates: true });

const adapter = new PrismaNeon({ connectionString: guard.databaseUrl });
const prisma = new PrismaClient({ adapter });

const TARGET_CREDITS = 1_000_000_000;

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: { contains: "Violent", mode: "insensitive" } },
  });
  if (!pilot) {
    console.log("Pilot not found");
    return;
  }
  console.log(`Found: ${pilot.callsign} (credits: ${pilot.credits})`);

  const updated = await guard.mutate(
    `set credits of ${pilot.callsign} (${pilot.id}) from ${pilot.credits} to ${TARGET_CREDITS}`,
    () =>
      prisma.pilotState.update({
        where: { id: pilot.id },
        data: { credits: TARGET_CREDITS },
      }),
  );
  if (updated) {
    console.log(`Credits updated: ${pilot.credits} → ${updated.credits}`);
  }
  guard.summary();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
