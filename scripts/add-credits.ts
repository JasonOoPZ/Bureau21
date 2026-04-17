import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: { contains: "Violent", mode: "insensitive" } },
  });
  if (!pilot) {
    console.log("Pilot not found");
    return;
  }
  console.log(`Found: ${pilot.callsign} (credits: ${pilot.credits})`);

  const updated = await prisma.pilotState.update({
    where: { id: pilot.id },
    data: { credits: { increment: 1000000 } },
  });
  console.log(`Credits updated: ${pilot.credits} → ${updated.credits}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
