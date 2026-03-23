import { authOptions } from "@/auth";
import { UserRoleManager } from "@/components/admin/user-role-manager";
import { TopBar } from "@/components/layout/top-bar";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/");
  }

  if (session.user.role !== "admin") {
    redirect("/lobby");
  }

  const [users, totalUsers, totalAdmins] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspended: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
  ]);

  const totalPlayers = totalUsers - totalAdmins;

  return (
    <>
      <TopBar session={session} />
      <main className="relative min-h-screen px-4 py-10 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_60%_20%,rgba(245,158,11,0.12),transparent_40%)]" />
        <div className="mx-auto max-w-5xl space-y-8">
          <section>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-300/80">Admin Clearance</p>
            <h1 className="font-display mt-2 text-4xl uppercase text-slate-100">System Control</h1>
          </section>

          <UserRoleManager
            users={users.map((user) => ({
              ...user,
              createdAt: user.createdAt.toISOString(),
            }))}
          />

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Admin Accounts</p>
              <p className="text-3xl font-bold text-amber-300">{totalAdmins}</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Player Accounts</p>
              <p className="text-3xl font-bold text-cyan-300">{totalPlayers}</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-5 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Registered Pilots</p>
              <p className="text-3xl font-bold text-slate-100">{totalUsers}</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
