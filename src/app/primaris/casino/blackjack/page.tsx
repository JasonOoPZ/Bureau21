import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BlackjackGame } from "./blackjack-game";

export default async function BlackjackPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return <BlackjackGame initialCredits={pilot.credits} />;
}
