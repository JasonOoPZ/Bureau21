"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    // Always show success to prevent email enumeration
    setStatus("done");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.15),transparent_50%)]" />
      <div className="w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-950/70 p-7 shadow-[0_0_40px_rgba(8,145,178,0.18)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Bureau 21</p>
        <h1 className="font-display mt-2 text-2xl uppercase text-slate-100">Reset Access Credentials</h1>

        {status === "done" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              If an account exists for <span className="text-cyan-300">{email}</span>, a reset link has been dispatched. Check your inbox — and your spam folder.
            </p>
            <p className="text-xs text-slate-500">
              In development, the reset link is printed to the server console.
            </p>
            <Link
              href="/"
              className="mt-4 block text-center text-xs uppercase tracking-[0.2em] text-cyan-400 hover:text-cyan-300 transition"
            >
              ← Return to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block text-sm text-slate-300">
              Pilot Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="captain@private-mail.com"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                required
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Dispatching..." : "Send Reset Link"}
            </button>
            <Link
              href="/"
              className="block text-center text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition"
            >
              ← Back to sign in
            </Link>
          </form>
        )}
      </div>
    </main>
  );
}
