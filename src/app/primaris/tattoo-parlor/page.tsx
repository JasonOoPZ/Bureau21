import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { starterCharacters } from "@/lib/starter-characters";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";

export default async function TattooParlor() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);

  const cost = 500;
  const currentChar = starterCharacters.find((c) => c.slug === pilot.characterSlug);

  async function changeAppearance(formData: FormData) {
    "use server";
    const sess = await getServerSession(authOptions);
    if (!sess?.user?.id) return;
    const slug = formData.get("slug") as string;
    if (!starterCharacters.find((c) => c.slug === slug)) return;

    const p = await prisma.pilotState.findUnique({ where: { userId: sess.user.id } });
    if (!p || p.credits < cost) return;
    if (p.characterSlug === slug) return;

    await prisma.pilotState.update({
      where: { userId: sess.user.id },
      data: { characterSlug: slug, credits: { decrement: cost } },
    });

    redirect("/primaris/tattoo-parlor");
  }

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">← Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-pink-400">Tattoo Parlor</span>
          </div>
          <div className="rounded-md border border-pink-900/30 bg-[#0b0f14] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-pink-300">Social District</p>
            <h1 className="mt-1 text-2xl font-bold uppercase tracking-[0.2em] text-pink-200">Tattoo Parlor</h1>
          </div>

          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="text-[12px] text-slate-400">
              Want a new look? The Tattoo Parlor can reshape your entire chassis. Each transformation costs{" "}
              <span className="text-amber-300">{cost} credits</span>. Choose carefully — your appearance
              determines your combat perk.
            </p>
            <p className="mt-2 text-[11px] text-slate-500">
              Current appearance: <span className="font-bold text-cyan-300">{currentChar?.name || pilot.characterSlug}</span>
              {currentChar && <span className="text-slate-600"> — {currentChar.title}</span>}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {starterCharacters.map((char) => {
              const isActive = char.slug === pilot.characterSlug;
              return (
                <form key={char.slug} action={changeAppearance}>
                  <input type="hidden" name="slug" value={char.slug} />
                  <button
                    type="submit"
                    disabled={isActive || pilot.credits < cost}
                    className={`w-full rounded-md border p-4 text-left transition ${
                      isActive
                        ? "border-cyan-700 bg-cyan-950/20"
                        : "border-slate-800 bg-[#0a0d11] hover:border-slate-600 disabled:opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0">
                        <StarterCharacterPortrait slug={char.slug} size="md" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold" style={{ color: char.glow }}>
                          {char.name}
                        </p>
                        <p className="text-[10px] text-slate-500">{char.title}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{char.perk.name}: {char.perk.value}</p>
                      </div>
                    </div>
                    {isActive && (
                      <p className="mt-2 text-[10px] font-bold text-cyan-400">CURRENT</p>
                    )}
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
