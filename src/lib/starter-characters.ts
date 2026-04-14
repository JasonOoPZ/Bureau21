export type CharacterPerk = {
  name: string;
  description: string;
  stat: string;
  value: string;
  color: string;
};

export type StarterCharacter = {
  slug: string;
  name: string;
  title: string;
  summary: string;
  image: string;
  glow: string;
  perk: CharacterPerk;
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
    perk: {
      name: "Shattering Power",
      description: "The core battle function of this unit is simple, direct damage. Start with an immediate and permanent increase to raw damage output, all sources, all types.",
      stat: "Damage Output",
      value: "+10%",
      color: "#ff4937",
    },
  },
  {
    slug: "base-green",
    name: "Unit 872",
    title: "Underbelly Trickster",
    summary: "Neon poison circuits and corrosive humor from the worst decks in the station.",
    image: "/characters/Bureau21BaseGreen.png",
    glow: "#39ff14",
    perk: {
      name: "Nature's Blessing",
      description: "Passive defense is this unit's core function. Start with an immediate and permanent resistance to all incoming damage types.",
      stat: "Damage Resistance",
      value: "+15%",
      color: "#39ff14",
    },
  },
  {
    slug: "base-onyx",
    name: "Unit 617",
    title: "Silent Navigator",
    summary: "Polished onyx chassis laced with cyan signal lines and deep-space optics.",
    image: "/characters/Bureau21BaseOnyx.png",
    glow: "#00e5ff",
    perk: {
      name: "Enduring Reflexes",
      description: "Deep space navigation grants unmatched tactical awareness. Start with an immediate and permanent bonus to all experience gained per battle.",
      stat: "Battle EXP",
      value: "+25%",
      color: "#00e5ff",
    },
  },
  {
    slug: "base-orange",
    name: "Unit 374",
    title: "Refinery Pilgrim",
    summary: "Brass-plated drifter threaded with refinery heat and old station signal marks.",
    image: "/characters/Bureau21BaseOrange.png",
    glow: "#ff9d4d",
    perk: {
      name: "Psionic Swiftness",
      description: "Swift, mobile actions are this unit's specialty. Start with an immediate and permanent boost to movement and attack/action speed.",
      stat: "Action Speed",
      value: "+10%",
      color: "#ff9d4d",
    },
  },
  {
    slug: "base-purple",
    name: "Unit 481",
    title: "Recovery Unit",
    summary: "Midnight medical chassis with violet repair seams and surgical patience.",
    image: "/characters/Bureau21BasePurple.png",
    glow: "#b07dff",
    perk: {
      name: "Assassin's Precision",
      description: "Precise strikes are essential. Start with an immediate and permanent bonus to critical hit chance.",
      stat: "Crit Chance",
      value: "+15%",
      color: "#b07dff",
    },
  },
  {
    slug: "base-white",
    name: "Unit 841",
    title: "Cryo Archivist",
    summary: "Marble-white frame with faint cryo filaments and archival precision.",
    image: "/characters/Bureau21BaseWhite.png",
    glow: "#b0e0ff",
    perk: {
      name: "Crushing Finality",
      description: "High-stakes damage is this unit's focus. Start with an immediate and permanent bonus to critical hit damage.",
      stat: "Crit Damage",
      value: "+25%",
      color: "#b0e0ff",
    },
  },
  {
    slug: "base-yellow",
    name: "Unit 627",
    title: "Signal Choir",
    summary: "Cathedral-grade comms construct laced with gold static and halo interference.",
    image: "/characters/Bureau21BaseYellow.png",
    glow: "#ffd866",
    perk: {
      name: "Mastered Focus",
      description: "A versatile starting boost. This unit enters every battle with bonus Confidence and a doubled max Confidence cap (100 instead of 50), giving a dominant edge before the first round.",
      stat: "Confidence",
      value: "+10 Start / 100 Max",
      color: "#ffd866",
    },
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
