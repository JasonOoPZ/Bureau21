import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TrainingGroundsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-red-400">Training Grounds</span>
          </div>
          <div className="rounded-md border border-red-900/30 bg-[#0b0f14] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-red-300">Combat Quarter</p>
            <h1 className="mt-1 text-2xl font-bold uppercase tracking-[0.2em] text-red-200">Training Grounds</h1>
          </div>

          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="text-[12px] text-slate-400">
              The Training Grounds offer a controlled sparring environment. Test your build against
              training dummies, review combat mechanics, or warm up before entering the real arena.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/gym"
              className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 transition hover:border-cyan-700"
            >
              <p className="text-[12px] font-bold text-cyan-300">Galaxy Gym</p>
              <p className="mt-1 text-[10px] text-slate-500">Train your core combat stats: strength, speed, endurance, and confidence.</p>
            </Link>
            <Link
              href="/battle"
              className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 transition hover:border-red-700"
            >
              <p className="text-[12px] font-bold text-red-300">Battle Arena</p>
              <p className="mt-1 text-[10px] text-slate-500">Enter PvP combat. Real stakes, real rewards.</p>
            </Link>
            <Link
              href="/primaris/fight-pit"
              className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 transition hover:border-red-700"
            >
              <p className="text-[12px] font-bold text-red-300">Fight Pit</p>
              <p className="mt-1 text-[10px] text-slate-500">Underground PvE brawls against station lowlifes.</p>
            </Link>
            <Link
              href="/station/academy"
              className="rounded-md border border-slate-800 bg-[#0a0d11] p-4 transition hover:border-cyan-700"
            >
              <p className="text-[12px] font-bold text-cyan-300">The Academy</p>
              <p className="mt-1 text-[10px] text-slate-500">Advanced combat training modules and ATK/DEF tuning.</p>
            </Link>
          </div>

          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="text-[11px] font-bold text-slate-300">Combat Tips</p>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
              <li>• Your ATK/DEF split determines how your strength is distributed in battle.</li>
              <li>• Speed affects hit order and dodge chance.</li>
              <li>• Endurance reduces damage taken per blow.</li>
              <li>• Higher confidence increases critical hit chance.</li>
              <li>• Equipment bonuses from the Armory can significantly boost your combat power.</li>
              <li>• The Fight Pit offers PvE combat — real damage, but rewards scale with opponent level.</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
