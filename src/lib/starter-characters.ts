export type StarterCharacter = {
  slug: string;
  name: string;
  title: string;
  summary: string;
  image: string;
  glow: string;
};

export const defaultStarterCharacter = "base-red";

export const starterCharacters: StarterCharacter[] = [
  {
    slug: "base-red",
    name: "Unit 754",
    title: "Faultborn Oracle",
    summary: "Obsidian shell threaded with molten fractures and a live reactor core.",
    image: "/characters/Bureau21BaseRed.png",
    glow: "#ff4937",
  },
  {
    slug: "base-green",
    name: "Unit 872",
    title: "Underbelly Trickster",
    summary: "Neon poison circuits and corrosive humor from the worst decks in the station.",
    image: "/characters/Bureau21BaseGreen.png",
    glow: "#39ff14",
  },
  {
    slug: "base-onyx",
    name: "Unit 617",
    title: "Silent Navigator",
    summary: "Polished onyx chassis laced with cyan signal lines and deep-space optics.",
    image: "/characters/Bureau21BaseOnyx.png",
    glow: "#00e5ff",
  },
  {
    slug: "base-orange",
    name: "Unit 374",
    title: "Refinery Pilgrim",
    summary: "Brass-plated drifter threaded with refinery heat and old station signal marks.",
    image: "/characters/Bureau21BaseOrange.png",
    glow: "#ff9d4d",
  },
  {
    slug: "base-purple",
    name: "Unit 481",
    title: "Recovery Unit",
    summary: "Midnight medical chassis with violet repair seams and surgical patience.",
    image: "/characters/Bureau21BasePurple.png",
    glow: "#b07dff",
  },
  {
    slug: "base-white",
    name: "Unit 841",
    title: "Cryo Archivist",
    summary: "Marble-white frame with faint cryo filaments and archival precision.",
    image: "/characters/Bureau21BaseWhite.png",
    glow: "#b0e0ff",
  },
  {
    slug: "base-yellow",
    name: "Unit 627",
    title: "Signal Choir",
    summary: "Cathedral-grade comms construct laced with gold static and halo interference.",
    image: "/characters/Bureau21BaseYellow.png",
    glow: "#ffd866",
  },
];

// Map legacy SVG-era slugs to current image-based characters
const LEGACY_SLUG_MAP: Record<string, string> = {
  "ember-754": "base-red",
  "void-monk": "base-onyx",
  "copper-saint": "base-orange",
  "glacier-wisp": "base-white",
  "toxin-jester": "base-green",
  "seraph-static": "base-yellow",
  "night-suture": "base-purple",
  "rust-halo": "base-red",
  "cinder-veil": "base-onyx",
  "solar-ivy": "base-green",
};

export function getStarterCharacter(slug?: string | null): StarterCharacter {
  if (!slug) return starterCharacters[0];
  const resolved = LEGACY_SLUG_MAP[slug] ?? slug;
  return starterCharacters.find((c) => c.slug === resolved) ?? starterCharacters[0];
}
