import { authOptions } from "@/auth";
import { AppearanceSelector } from "@/components/game/appearance-selector";
import { getOrCreatePilotState } from "@/lib/game-state";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AppearanceOnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  if (!pilot.appearanceNeedsSetup) redirect("/lobby");

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/bureau21-welcome.png')" }}
      />
      <div className="absolute inset-0 -z-10 bg-slate-950/80" />

      <section className="mx-auto max-w-5xl space-y-4 rounded-xl border border-cyan-900/40 bg-[#0a0d11]/90 p-4 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">Initial Loading Sequence</p>
        <h1 className="font-display text-3xl text-slate-100 sm:text-4xl">Create Your Pilot</h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Set your pilot name, gender, and choose an alien model. Your first selection is free. Future appearance updates cost 100 credits.
        </p>

        <AppearanceSelector
          currentSlug={pilot.characterSlug}
          initialCredits={pilot.credits}
          initialSelections={pilot.appearanceSelections}
          initialCallsign=""
          setupMode
        />
      </section>
    </main>
  );
}
