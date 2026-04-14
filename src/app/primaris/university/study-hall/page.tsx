import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { StudyHallClient } from "@/components/game/study-hall-client";
import { getOrCreatePilotState } from "@/lib/game-state";
import { COURSES, STUDY_COST } from "@/lib/courses";
import { GAME_CONSTANTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudyHallPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - pilot.lastMotivationAt.getTime()) / (1000 * 60)
  );
  const regenAmount = Math.floor(minutesElapsed / GAME_CONSTANTS.MOTIVATION_REGEN_MINUTES);
  const currentMotivation = Math.min(
    pilot.motivation + regenAmount,
    GAME_CONSTANTS.MOTIVATION_CAP_FREE
  );

  const studies = await prisma.studyProgress.findMany({
    where: { pilotId: pilot.id },
  });

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">Primaris</Link>
            <span className="text-slate-700">/</span>
            <Link href="/primaris/university" className="text-[11px] text-slate-500 hover:text-cyan-300">University</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Study Hall</span>
          </div>

          <div className="rounded-md border border-cyan-900/30 bg-[#0b0f14] p-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-cyan-200">Study Hall</h1>
          </div>

          <StudyHallClient
            courses={COURSES}
            progress={studies.map((s) => ({ course: s.course, points: s.points }))}
            motivation={currentMotivation}
            studyCost={STUDY_COST}
          />
        </div>
      </main>
    </>
  );
}
