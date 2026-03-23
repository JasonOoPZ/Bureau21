"use client";

import { StarterCharacterPortrait } from "@/components/game/starter-character-portrait";
import { defaultStarterCharacter, starterCharacters } from "@/lib/starter-characters";
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
  const [starterCharacter, setStarterCharacter] = useState(defaultStarterCharacter);

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
        starterCharacter,
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
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.18),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(56,189,248,0.22),transparent_35%),radial-gradient(circle_at_50%_85%,rgba(245,158,11,0.15),transparent_40%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(2,6,23,0.94),rgba(7,20,38,0.9))]" />

      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6 lg:pr-10">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/90">Bureau 21 Access Hub</p>
          <h1 className="font-display text-5xl font-semibold uppercase leading-[0.95] text-slate-50 sm:text-6xl">
            Enter The Fringe Network
          </h1>
          <p className="max-w-xl text-base text-slate-300 sm:text-lg">
            Sign in with your command account or begin private onboarding with an encrypted email profile.
            Your pilot identity stays portable across every sector of Bureau 21.
          </p>

          {/* Hero character portrait */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, #ff4937 0%, transparent 70%)" }} />
              <StarterCharacterPortrait slug="ember-754" size="xl" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-cyan-200/90">
            <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-4 py-2">Browser-First</span>
            <span className="rounded-full border border-sky-300/40 bg-sky-400/10 px-4 py-2">Cross-Sector Identity</span>
            <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2">Private Email Onboarding</span>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-300/25 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(8,145,178,0.22)] backdrop-blur-xl sm:p-7">
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-900/70 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-lg px-4 py-2 transition ${
                mode === "signin" ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("onboarding")}
              className={`rounded-lg px-4 py-2 transition ${
                mode === "onboarding" ? "bg-cyan-400/20 text-cyan-100" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Onboarding
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-400/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="text-base">G</span>
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs uppercase tracking-[0.2em] text-slate-500">or with email</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <label className="block text-sm text-slate-300">
                Email
                <input
                  type="email"
                  value={signInEmail}
                  onChange={(event) => setSignInEmail(event.target.value)}
                  placeholder="captain@private-mail.com"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  required
                />
              </label>
              <label className="block text-sm text-slate-300">
                Password
                <input
                  type="password"
                  value={signInPassword}
                  onChange={(event) => setSignInPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Authenticating..." : "Launch Session"}
              </button>
              <a
                href="/forgot-password"
                className="block text-center text-xs uppercase tracking-[0.2em] text-slate-500 hover:text-slate-300 transition"
              >
                Forgot credentials?
              </a>
            </form>
          ) : (
            <form onSubmit={handleOnboarding} className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Starter Character</p>
                <p className="mt-1 text-sm text-slate-400">
                  Choose your shell. Ember-754 is the default Bureau 21 operator.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {starterCharacters.map((character) => {
                    const selected = starterCharacter === character.slug;

                    return (
                      <button
                        key={character.slug}
                        type="button"
                        onClick={() => setStarterCharacter(character.slug)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-cyan-400 bg-cyan-400/10 text-cyan-100"
                            : "border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-600"
                        }`}
                      >
                        <StarterCharacterPortrait slug={character.slug} size="sm" />
                        <div>
                          <p className="text-sm font-semibold">{character.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{character.title}</p>
                          <p className="mt-1 text-xs text-slate-400">{character.summary}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block text-sm text-slate-300">
                Pilot Alias
                <input
                  type="text"
                  value={pilotName}
                  onChange={(event) => setPilotName(event.target.value)}
                  placeholder="Nova-21"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  required
                />
              </label>
              <label className="block text-sm text-slate-300">
                Private Email
                <input
                  type="email"
                  value={onboardEmail}
                  onChange={(event) => setOnboardEmail(event.target.value)}
                  placeholder="newpilot@private-mail.com"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  required
                />
              </label>
              <label className="block text-sm text-slate-300">
                Create Password
                <input
                  type="password"
                  value={onboardPassword}
                  onChange={(event) => setOnboardPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                  required
                />
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(event) => setAcceptedPrivacy(event.target.checked)}
                  className="mt-0.5"
                />
                I consent to private account provisioning and secure session telemetry for gameplay operations.
              </label>
              <button
                type="submit"
                disabled={!isOnboardingValid || loading}
                className="w-full rounded-xl bg-amber-300 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Provisioning..." : "Create Pilot Account"}
              </button>
            </form>
          )}

          {notice ? <p className="mt-5 text-sm text-cyan-200/90">{notice}</p> : null}
        </div>
      </section>
    </main>
  );
}
