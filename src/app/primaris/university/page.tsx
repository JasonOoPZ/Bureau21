import { authOptions } from "@/auth";
import { TopBar } from "@/components/layout/top-bar";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PixelBanner } from "@/components/layout/pixel-banner";

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

          <PixelBanner scene="university" title="Bureau 21 Institute of Applied Sciences" subtitle="Est. Cycle 4.217 — Sol Prime Campus" />

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
