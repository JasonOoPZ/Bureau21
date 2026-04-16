import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CrashGame } from "./crash-game";

export default async function CrashPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return <CrashGame initialCredits={pilot.credits} />;
}
