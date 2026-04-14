import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

const CAMPUS_LINKS = [
  { name: "Admissions Office", href: "/primaris/university", description: "Campus registration and enrollment.", status: "planned" },
  { name: "Registrar", href: "/primaris/university", description: "Manage your academic records.", status: "planned" },
  { name: "Study Hall", href: "/primaris/university/study-hall", description: "Attend classes and earn study points.", status: "live" },
  { name: "Dorms", href: "/primaris/university", description: "Student quarters and social space.", status: "planned" },
  { name: "Orbital Library", href: "/primaris/university", description: "The galaxy's largest digital archive.", status: "planned" },
];

export default async function UniversityCampusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-4xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">Primaris</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">University</span>
          </div>

          {/* University Visual */}
          <div className="relative overflow-hidden rounded-md border border-cyan-900/30 bg-gradient-to-b from-[#0d1520] via-[#0b1018] to-[#080c12]">
            {/* Architectural visual */}
            <div className="flex items-end justify-center gap-0 pt-6">
              {/* Left wing */}
              <div className="flex flex-col items-center">
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`lw-${i}`} className="h-4 w-5 rounded-sm border border-amber-800/40 bg-amber-900/20" />
                  ))}
                </div>
                <div className="mt-1 h-2 w-24 bg-slate-800" />
              </div>
              {/* Center dome */}
              <div className="flex flex-col items-center px-4">
                <div className="h-12 w-28 rounded-t-full border-2 border-b-0 border-cyan-800/40 bg-gradient-to-b from-cyan-900/20 to-transparent" />
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={`cw-${i}`} className="h-5 w-5 rounded-sm border border-amber-700/50 bg-amber-900/30" />
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="h-8 w-3 rounded-t bg-slate-700" />
                  <div className="h-4 w-16 rounded-t bg-slate-800" />
                  <div className="h-8 w-3 rounded-t bg-slate-700" />
                </div>
              </div>
              {/* Right wing */}
              <div className="flex flex-col items-center">
                <div className="grid grid-cols-4 gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`rw-${i}`} className="h-4 w-5 rounded-sm border border-amber-800/40 bg-amber-900/20" />
                  ))}
                </div>
                <div className="mt-1 h-2 w-24 bg-slate-800" />
              </div>
            </div>
            {/* Ground */}
            <div className="mt-1 h-3 w-full bg-gradient-to-t from-emerald-950/40 to-transparent" />

            {/* Title overlay */}
            <div className="bg-black/60 px-6 py-4 text-center">
              <h1 className="text-xl font-bold uppercase tracking-[0.25em] text-cyan-200">
                Bureau 21 Institute of Applied Sciences
              </h1>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Est. Cycle 4.217 — Sol Prime Campus
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="text-[12px] leading-relaxed text-slate-400">
              Some argue that life among the stars is incomplete without a proper education. These people clearly are
              the ones who attended the Institute and are now trying to justify a 150,000 credit investment even though
              they graduated and still only landed a contract sorting cargo manifests in their syndicate leader&apos;s
              docking bay. Anecdotes aside, the skills one can learn in these hallowed digital halls are vital to a
              successful stay aboard Bureau 21.
            </p>
          </div>

          {/* Campus Directory */}
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="mb-3 text-[11px] font-bold text-slate-300">Campus Directory:</p>
            <div className="space-y-1">
              {CAMPUS_LINKS.map((link) =>
                link.status === "live" ? (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="block text-[12px] font-semibold text-cyan-400 hover:text-cyan-200 hover:underline"
                    title={link.description}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <span
                    key={link.name}
                    className="block text-[12px] font-semibold text-slate-600"
                    title={link.description}
                  >
                    {link.name}
                  </span>
                )
              )}
            </div>
            <p className="mt-3 text-[11px] italic text-slate-600">
              Hey, we never said it was a large campus!
            </p>
          </div>

          <div className="text-center">
            <Link href="/primaris" className="text-[11px] text-slate-500 hover:text-cyan-300">
              [Back]
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
