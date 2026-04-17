"use client";

import { sideRailLinks } from "@/lib/navigation";
import { themes, type ThemeId } from "@/lib/themes";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface QuickLink {
  href: string;
  label: string;
}

interface SettingsClientProps {
  currentTheme: string;
  currentQuicklinks: QuickLink[];
  walletAddress: string | null;
}

export function SettingsClient({ currentTheme, currentQuicklinks, walletAddress }: SettingsClientProps) {
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<string>(currentTheme);
  const [quicklinks, setQuicklinks] = useState<(QuickLink | null)[]>(() => {
    const slots: (QuickLink | null)[] = [...currentQuicklinks];
    while (slots.length < 5) slots.push(null);
    return slots;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleThemeChange(themeId: ThemeId) {
    setActiveTheme(themeId);
    setMessage("");

    // Apply immediately — optimistic update
    if (themeId === "original") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeId);
    }
    document.cookie = `bureau21-theme=${themeId};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

    // Persist to DB in background
    setSaving(true);
    try {
      await fetch("/api/game/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeId }),
      });
    } catch {
      /* cookie ensures theme persists even if DB save fails */
    }
    setSaving(false);
    setMessage("Theme applied!");
  }

  function handleQuicklinkChange(index: number, href: string) {
    const newLinks = [...quicklinks];
    if (!href) {
      newLinks[index] = null;
    } else {
      const found = sideRailLinks.find((l) => l.href === href);
      if (found) {
        newLinks[index] = { href: found.href, label: found.label };
      }
    }
    setQuicklinks(newLinks);
  }

  async function saveQuicklinks() {
    setSaving(true);
    setMessage("");
    const cleaned = quicklinks.filter((l): l is QuickLink => l !== null);
    try {
      const res = await fetch("/api/game/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customQuicklinks: cleaned }),
      });
      if (res.ok) {
        setMessage("Quicklinks saved!");
        router.refresh();
      }
    } catch {
      setMessage("Failed to save quicklinks.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Theme Picker */}
      <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Interface Theme</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              disabled={saving}
              className={`group relative rounded-lg border p-3 text-left transition
                ${activeTheme === theme.id
                  ? "border-cyan-400 bg-cyan-950/20 ring-1 ring-cyan-400/30"
                  : "border-slate-700 bg-slate-900/30 hover:border-slate-600"
                }`}
            >
              {/* Color preview bar */}
              <div className="mb-2 flex gap-1">
                <div
                  className="h-6 w-6 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.preview.bg }}
                  title="Background"
                />
                <div
                  className="h-6 w-6 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.preview.accent }}
                  title="Accent"
                />
                <div
                  className="h-6 w-6 rounded-full border border-white/10"
                  style={{ backgroundColor: theme.preview.panel }}
                  title="Panel"
                />
              </div>
              <p className="text-[12px] font-bold text-slate-200">{theme.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{theme.description}</p>
              {activeTheme === theme.id && (
                <span className="absolute right-2 top-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Quicklinks */}
      <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
        <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">Custom Quicklinks</p>
        <p className="mb-3 text-[10px] text-slate-500">
          Pick up to 5 shortcuts that appear in your top navigation bar in gold.
        </p>
        <div className="space-y-2">
          {quicklinks.map((link, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 shrink-0 text-center text-[11px] font-bold text-amber-400">{i + 1}</span>
              <select
                value={link?.href ?? ""}
                onChange={(e) => handleQuicklinkChange(i, e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900/50 px-3 py-2 text-[12px] text-slate-200 outline-none focus:border-amber-500"
              >
                <option value="">— Empty Slot —</option>
                {sideRailLinks.map((navLink) => (
                  <option key={navLink.href} value={navLink.href}>
                    {navLink.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <button
          onClick={saveQuicklinks}
          disabled={saving}
          className="mt-3 rounded border border-amber-600/50 bg-amber-500/10 px-4 py-2 text-[12px] font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Quicklinks"}
        </button>
      </div>

      {message && (
        <p className="text-center text-[11px] font-semibold text-emerald-400">{message}</p>
      )}

      {/* Wallet Info */}
      <div className="rounded-md border border-slate-700 bg-[#0b0f14] p-4">
        <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-slate-500">Thirdweb Wallet</p>
        {walletAddress ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded border border-slate-700 bg-slate-900/50 px-3 py-2 text-[12px] text-cyan-200 select-all">
              {walletAddress}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(walletAddress);
                setMessage("Wallet address copied!");
              }}
              className="shrink-0 rounded border border-slate-700 bg-slate-900/50 px-3 py-2 text-[11px] text-slate-300 transition hover:border-cyan-600 hover:text-cyan-300"
            >
              Copy
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">No wallet assigned yet.</p>
        )}
      </div>

      {/* Sign Out */}
      <div className="rounded-md border border-red-900/40 bg-[#0b0f14] p-4">
        <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">Session</p>
        <p className="mb-3 text-[10px] text-slate-500">
          Sign out of your Bureau 21 account on this device.
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.15em] text-red-400 transition hover:border-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
