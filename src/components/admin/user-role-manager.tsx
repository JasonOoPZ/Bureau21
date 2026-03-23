"use client";

import { useMemo, useState } from "react";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  suspended: boolean;
  createdAt: string;
};

interface UserRoleManagerProps {
  users: UserRow[];
}

export function UserRoleManager({ users }: UserRoleManagerProps) {
  const [rows, setRows] = useState(users);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => {
    const adminCount = rows.filter((user) => user.role === "admin").length;
    const suspendedCount = rows.filter((user) => user.suspended).length;
    return {
      total: rows.length,
      admins: adminCount,
      players: rows.length - adminCount,
      suspended: suspendedCount,
    };
  }, [rows]);

  async function setRole(userId: string, role: "player" | "admin") {
    setNotice("");
    setPendingId(userId);

    const previous = rows;
    setRows((current) =>
      current.map((user) => (user.id === userId ? { ...user, role } : user))
    );

    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setRows(previous);
      setNotice(payload?.error ?? "Role update failed.");
      setPendingId(null);
      return;
    }

    setNotice("Role updated successfully.");
    setPendingId(null);
  }

  async function setSuspension(userId: string, suspended: boolean) {
    setNotice("");
    setPendingId(userId);

    const previous = rows;
    setRows((current) =>
      current.map((user) => (user.id === userId ? { ...user, suspended } : user))
    );

    const response = await fetch(`/api/admin/users/${userId}/suspension`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ suspended }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setRows(previous);
      setNotice(payload?.error ?? "Suspension update failed.");
      setPendingId(null);
      return;
    }

    setNotice(suspended ? "Account suspended." : "Account restored.");
    setPendingId(null);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-amber-400/25 bg-slate-950/70 p-6 shadow-[0_0_30px_rgba(245,158,11,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-[0.25em] text-amber-400/70">Pilot Management</h2>
        <div className="flex gap-2 text-[11px] uppercase tracking-widest">
          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-300">Total {counts.total}</span>
          <span className="rounded-full border border-amber-500/40 px-3 py-1 text-amber-300">Admin {counts.admins}</span>
          <span className="rounded-full border border-cyan-500/40 px-3 py-1 text-cyan-300">Player {counts.players}</span>
          <span className="rounded-full border border-red-500/40 px-3 py-1 text-red-300">Suspended {counts.suspended}</span>
        </div>
      </div>

      {notice ? <p className="text-xs text-cyan-300">{notice}</p> : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.2em] text-slate-500">
              <th className="pb-3">Pilot</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Created</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => {
              const isPending = pendingId === user.id;
              return (
                <tr key={user.id} className="border-b border-slate-900">
                  <td className="py-3 text-slate-200">{user.name ?? "Anonymous Pilot"}</td>
                  <td className="py-3 text-slate-400">{user.email ?? "No email"}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${
                        user.role === "admin"
                          ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                          : "border border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${
                        user.suspended
                          ? "border border-red-500/40 bg-red-500/15 text-red-300"
                          : "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {user.suspended ? "suspended" : "active"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending || user.role === "player"}
                        onClick={() => setRole(user.id, "player")}
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-300 transition hover:border-cyan-500/60 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Make Player
                      </button>
                      <button
                        type="button"
                        disabled={isPending || user.role === "admin"}
                        onClick={() => setRole(user.id, "admin")}
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-300 transition hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Make Admin
                      </button>
                      <button
                        type="button"
                        disabled={isPending || user.suspended}
                        onClick={() => setSuspension(user.id, true)}
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-300 transition hover:border-red-500/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !user.suspended}
                        onClick={() => setSuspension(user.id, false)}
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.15em] text-slate-300 transition hover:border-emerald-500/60 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
