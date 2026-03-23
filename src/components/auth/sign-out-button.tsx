"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-red-400/60 hover:text-red-300"
    >
      Sign Out
    </button>
  );
}
