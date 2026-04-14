export type ThemeId =
  | "original"
  | "light"
  | "dark"
  | "neon"
  | "hologram"
  | "ember"
  | "phantom";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    panel: string;
  };
}

export const themes: ThemeDef[] = [
  {
    id: "original",
    name: "Original",
    description: "The default Bureau 21 dark navy with cyan accents",
    preview: { bg: "#020a17", accent: "#67e8f9", panel: "#0b0f14" },
  },
  {
    id: "light",
    name: "Daylight",
    description: "Clean light interface with indigo accents",
    preview: { bg: "#f1f5f9", accent: "#6366f1", panel: "#ffffff" },
  },
  {
    id: "dark",
    name: "Abyss",
    description: "Pure black void with cool silver highlights",
    preview: { bg: "#000000", accent: "#94a3b8", panel: "#0a0a0a" },
  },
  {
    id: "neon",
    name: "Neon Grid",
    description: "Cyberpunk neon pink and electric green glow",
    preview: { bg: "#0a0014", accent: "#39ff14", panel: "#12001f" },
  },
  {
    id: "hologram",
    name: "Hologram",
    description: "Blue holographic display with scan-line effects",
    preview: { bg: "#000a1a", accent: "#38bdf8", panel: "#001029" },
  },
  {
    id: "ember",
    name: "Ember",
    description: "Warm dark tones with fiery orange and amber",
    preview: { bg: "#1a0a00", accent: "#f59e0b", panel: "#1c0f02" },
  },
  {
    id: "phantom",
    name: "Phantom",
    description: "Deep purple void with ethereal violet glow",
    preview: { bg: "#0a0015", accent: "#a78bfa", panel: "#0f001a" },
  },
];

export const themeIds = themes.map((t) => t.id);

export function isValidTheme(id: string): id is ThemeId {
  return themeIds.includes(id as ThemeId);
}
