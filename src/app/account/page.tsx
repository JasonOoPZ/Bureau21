import { authOptions } from "@/auth";
import { AppearanceSelector } from "@/components/game/appearance-selector";
import { TopBar } from "@/components/layout/top-bar";
import { getOrCreatePilotState } from "@/lib/game-state";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const pilot = await getOrCreatePilotState(session.user.id, session.user.name);
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, suspended: true, walletAddress: true },
  });

  if (!user) redirect("/");

  const currentTime = new Date();
  const accountAgeDays = Math.floor(
    (currentTime.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const inventoryCount = await prisma.inventoryItem.count({ where: { pilotId: pilot.id } });

  const ROLE_COLORS: Record<string, string> = {
    admin: "text-red-400 border-red-800/60",
    moderator: "text-amber-300 border-amber-800/60",
    subscriber: "text-purple-300 border-purple-800/60",
    player: "text-slate-300 border-slate-700",
  };

  const roleClass = ROLE_COLORS[user.role ?? "player"] ?? ROLE_COLORS.player;

  return (
    <>
      <TopBar session={session} />
      <main className="min-h-screen bg-black px-3 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-[#0a0d11] px-4 py-2.5">
            <Link href="/lobby" className="text-[11px] text-slate-500 hover:text-cyan-300">← Hub</Link>
            <span className="text-slate-700">/</span>
            <span className="text-[11px] text-cyan-400">Account</span>
          </div>

          {/* Identity */}
          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Operator Identity</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Callsign", value: pilot.callsign },
                { label: "Email", value: user.email ?? "—" },
                {
                  label: "Role",
                  value: (
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${roleClass}`}>
                      {user.role ?? "user"}
                    </span>
                  ),
                },
                { label: "Character", value: pilot.characterSlug },
                { label: "Member for", value: `${accountAgeDays} day${accountAgeDays !== 1 ? "s" : ""}` },
                {
                  label: "Wallet",
                  value: user.walletAddress
                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                    : "—",
                },
                {
                  label: "Account Status",
                  value: user.suspended ? (
                    <span className="text-red-400">Suspended</span>
                  ) : (
                    <span className="text-emerald-400">Active</span>
                  ),
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border border-slate-800 bg-slate-900/30 px-3 py-2">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
                  <div className="mt-0.5 text-[12px] text-slate-200">
                    {typeof value === "string" ? value : value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pilot stats snapshot */}
          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Pilot Statistics</p>
            <div className="grid gap-2 grid-cols-3 sm:grid-cols-6">
              {[
                { label: "Level", value: pilot.level },
                { label: "XP", value: pilot.xp.toLocaleString() },
                { label: "Credits", value: `${pilot.credits} cr` },
                { label: "Tokens", value: pilot.tokens },
                { label: "Inventory", value: `${inventoryCount}/20` },
                { label: "Kill Count", value: pilot.kills ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="rounded border border-slate-800 bg-slate-900/30 px-2 py-2 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">{label}</p>
                  <p className="mt-0.5 text-[13px] font-bold text-cyan-300">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Appearance management */}
          <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Alien Model</p>
            <AppearanceSelector
              currentSlug={pilot.characterSlug}
              initialCredits={pilot.credits}
              initialSelections={pilot.appearanceSelections}
            />
          </div>

          {/* Navigation shortcuts */}
          <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Quick Links</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Character Sheet", href: "/house" },
                { label: "Inventory", href: "/inventory" },
                { label: "Battle Arena", href: "/battle" },
                { label: "Gym", href: "/gym" },
                { label: "Bank", href: "/bank" },
                { label: "QuickPosts", href: "/quickposts" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded border border-slate-700 bg-slate-900/40 px-3 py-1.5 text-[10px] text-slate-300 hover:border-cyan-700 hover:text-cyan-300 transition"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
