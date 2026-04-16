import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Find Violent Pawn
  const pilot = await prisma.pilotState.findFirst({
    where: { callsign: { contains: "Violent", mode: "insensitive" } },
  });
  if (!pilot) {
    console.log("Pilot not found");
    const all = await prisma.pilotState.findMany({ select: { callsign: true, userId: true } });
    console.log("All pilots:", all);
    return;
  }
  console.log(`Found: ${pilot.callsign} (userId: ${pilot.userId}) — current credits: ${pilot.credits}`);

  const updated = await prisma.pilotState.update({
    where: { userId: pilot.userId },
    data: { credits: { increment: 100000000 } },
  });
  console.log(`Updated credits: ${updated.credits}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
