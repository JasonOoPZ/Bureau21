"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { signIn } from "next-auth/react";

type AuthMode = "signin" | "onboarding";

export function LoginPanel() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [pilotName, setPilotName] = useState("");
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardPassword, setOnboardPassword] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const isOnboardingValid = useMemo(() => {
    return (
      pilotName.trim().length >= 2 &&
      onboardEmail.includes("@") &&
      onboardPassword.length >= 8 &&
      acceptedPrivacy
    );
  }, [pilotName, onboardEmail, onboardPassword, acceptedPrivacy]);

  async function handleGoogleSignIn() {
    setNotice("");
    setLoading(true);

    try {
      await signIn("google", { callbackUrl: "/lobby" });
    } catch {
      setNotice("Google sign-in failed. Check OAuth environment variables and provider setup.");
      setLoading(false);
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!signInEmail.includes("@") || signInPassword.length < 8) {
      setNotice("Use a valid email and a password with at least 8 characters.");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      email: signInEmail,
      password: signInPassword,
      redirect: false,
      callbackUrl: "/lobby",
    });

    if (result?.error) {
      setNotice("Sign-in failed. Verify your credentials.");
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? "/lobby";
  }

  async function handleOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    if (!isOnboardingValid) {
      setNotice("Complete all onboarding fields and accept the privacy terms.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pilotName,
        email: onboardEmail,
        password: onboardPassword,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setNotice(payload?.error ?? "Unable to create your account right now.");
      setLoading(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email: onboardEmail,
      password: onboardPassword,
      redirect: false,
      callbackUrl: "/lobby",
    });

    if (loginResult?.error) {
      setNotice("Account created, but auto sign-in failed. Please sign in manually.");
      setMode("signin");
      setSignInEmail(onboardEmail);
      setSignInPassword("");
      setLoading(false);
      return;
    }

    window.location.href = loginResult?.url ?? "/lobby";
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ── Full-bleed background layers ── */}
      <Image
        className="absolute inset-0 -z-30 h-full w-full object-cover scale-105 blur-[2px]"
        src="/bureau21-welcome.png"
        alt="Bureau 21 landing background"
        fill
        priority
      />
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-black/70 via-slate-950/60 to-black/80" />
      {/* Colored atmosphere blobs */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(600px_circle_at_20%_15%,rgba(6,182,212,0.15),transparent),radial-gradient(500px_circle_at_80%_10%,rgba(168,85,247,0.12),transparent),radial-gradient(700px_circle_at_50%_95%,rgba(245,158,11,0.08),transparent)]" />
      {/* Scan-lines */}
      <div className="pointer-events-none absolute inset-0 -z-[5] opacity-[0.025] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]" />
      {/* Top vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-[4] h-40 bg-gradient-to-b from-black/50 to-transparent" />

      {/* ── Hero section ── */}
      <section className="relative mx-auto flex min-h-[56vh] max-w-5xl flex-col items-center justify-center px-4 pt-14 text-center">
        {/* Status line */}
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          <p className="font-display text-[10px] uppercase tracking-[0.6em] text-emerald-300/80">
            Signal Acquired
          </p>
        </div>

        {/* Title */}
        <h1 className="mt-5 font-display text-6xl font-black uppercase leading-none tracking-tight sm:text-7xl lg:text-8xl">
          <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            Bureau
          </span>
          <span className="ml-3 bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_50px_rgba(34,211,238,0.3)] sm:ml-4">
            21
          </span>
        </h1>

        {/* Tagline */}
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-300/90 sm:text-base">
          A <span className="font-semibold text-amber-300">free-to-play</span> browser{" "}
          <span className="font-display font-bold text-fuchsia-400">MMORPG</span> set aboard a
          deep-space orbital station. Build your pilot, run missions, and dominate through{" "}
          <span className="font-semibold text-red-400">PVP</span>{" "}
          <span className="text-slate-500">&amp;</span>{" "}
          <span className="font-semibold text-sky-400">PVE</span> combat.
        </p>

        {/* Feature pills */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <span className="font-display rounded-full border border-cyan-400/40 bg-cyan-950/50 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(34,211,238,0.1)]">
            Browser-First
          </span>
          <span className="font-display rounded-full border border-red-400/35 bg-red-950/40 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-red-300 shadow-[0_0_18px_rgba(239,68,68,0.1),inset_0_1px_0_rgba(239,68,68,0.08)]">
            PVP &amp; PVE
          </span>
          <span className="font-display rounded-full border border-fuchsia-400/35 bg-fuchsia-950/40 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-fuchsia-300 shadow-[0_0_18px_rgba(192,38,211,0.1),inset_0_1px_0_rgba(192,38,211,0.08)]">
            MMORPG
          </span>
          <span className="font-display rounded-full border border-amber-400/35 bg-amber-950/40 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(245,158,11,0.08)]">
            Free-to-Play
          </span>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 flex flex-col items-center gap-1.5">
          <span className="font-display text-[8px] uppercase tracking-[0.4em] text-slate-500">Board the Station</span>
          <svg className="h-4 w-4 animate-bounce text-cyan-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Auth card ── */}
      <section className="relative mx-auto max-w-md px-4 pb-20 pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/85 shadow-[0_8px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(8,145,178,0.08)] backdrop-blur-2xl">
          {/* Top glow strip */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

          <div className="p-5 sm:p-7">
            {/* Tab switcher */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-black/50 p-1 font-display text-xs uppercase tracking-[0.2em]">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`rounded-md px-3 py-2.5 transition-all ${
                  mode === "signin"
                    ? "bg-cyan-500/20 text-cyan-200 shadow-[inset_0_1px_0_rgba(34,211,238,0.15)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("onboarding")}
                className={`rounded-md px-3 py-2.5 transition-all ${
                  mode === "onboarding"
                    ? "bg-amber-500/20 text-amber-200 shadow-[inset_0_1px_0_rgba(245,158,11,0.15)]"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <span className="font-display text-[9px] uppercase tracking-[0.25em] text-slate-600">or</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <label className="block">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-400">Email</span>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                    placeholder="pilot@bureau21.net"
                    className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(34,211,238,0.1)]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-400">Password</span>
                  <input
                    type="password"
                    value={signInPassword}
                    onChange={(event) => setSignInPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:shadow-[0_0_12px_rgba(34,211,238,0.1)]"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] transition hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10">{loading ? "Authenticating..." : "Launch Session"}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 transition group-hover:opacity-100" />
                </button>
                <a
                  href="/forgot-password"
                  className="block text-center font-display text-[9px] uppercase tracking-[0.25em] text-slate-600 transition hover:text-cyan-400"
                >
                  Forgot credentials?
                </a>
              </form>
            ) : (
              <form onSubmit={handleOnboarding} className="space-y-4">
                <div className="rounded-lg border border-fuchsia-500/20 bg-fuchsia-950/20 p-3">
                  <p className="font-display text-[10px] uppercase tracking-[0.2em] text-fuchsia-300">Alien Model</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Choose your alien on the first loading screen after sign-up.
                  </p>
                </div>

                <label className="block">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-400">Pilot Alias</span>
                  <input
                    type="text"
                    value={pilotName}
                    onChange={(event) => setPilotName(event.target.value)}
                    placeholder="Nova-21"
                    className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-400">Email</span>
                  <input
                    type="email"
                    value={onboardEmail}
                    onChange={(event) => setOnboardEmail(event.target.value)}
                    placeholder="newpilot@bureau21.net"
                    className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-400">Password</span>
                  <input
                    type="password"
                    value={onboardPassword}
                    onChange={(event) => setOnboardPassword(event.target.value)}
                    placeholder="Minimum 8 characters"
                    className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-500 focus:shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                    required
                  />
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-slate-800 bg-black/30 p-3 text-[11px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacy}
                    onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                    className="mt-0.5 accent-amber-400"
                  />
                  I consent to account provisioning and secure session telemetry for gameplay.
                </label>
                <button
                  type="submit"
                  disabled={!isOnboardingValid || loading}
                  className="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] transition hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative z-10">{loading ? "Provisioning..." : "Create Pilot Account"}</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 transition group-hover:opacity-100" />
                </button>
              </form>
            )}

            {notice ? (
              <p className="mt-5 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3 font-display text-[10px] uppercase tracking-[0.15em] text-cyan-200/90">
                {notice}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
