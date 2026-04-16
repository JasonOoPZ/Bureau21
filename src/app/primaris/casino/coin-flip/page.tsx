import { authOptions } from "@/auth";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CoinFlipGame } from "./coinflip-game";

export default async function CoinFlipPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  return <CoinFlipGame initialCredits={pilot.credits} />;
}
