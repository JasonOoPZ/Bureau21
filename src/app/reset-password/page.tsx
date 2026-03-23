"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setStatus("loading");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setErrorMsg(payload?.error ?? "Reset failed. The link may have expired.");
      setStatus("error");
      return;
    }

    setStatus("done");
    setTimeout(() => router.push("/"), 2500);
  }

  if (!token || !email) {
    return (
      <p className="mt-6 text-sm text-red-400">
        Invalid reset link. Please request a new one from the{" "}
        <Link href="/forgot-password" className="underline hover:text-red-300">
          forgot password
        </Link>{" "}
        page.
      </p>
    );
  }

  return (
    <>
      {status === "done" ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-emerald-300">
            Password updated. Redirecting to sign in…
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300">
            New Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            Confirm Password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
              required
            />
          </label>
          {errorMsg && <p className="text-sm text-red-400">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Updating..." : "Set New Password"}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.14),transparent_50%)]" />
      <div className="w-full max-w-md rounded-3xl border border-cyan-300/25 bg-slate-950/70 p-7 shadow-[0_0_40px_rgba(8,145,178,0.18)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Bureau 21</p>
        <h1 className="font-display mt-2 text-2xl uppercase text-slate-100">Set New Password</h1>
        <Suspense fallback={<p className="mt-6 text-sm text-slate-400">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
        <Link
          href="/"
          className="mt-5 block text-center text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition"
        >
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
