export type StarterCharacter = {
  slug: string;
  name: string;
  title: string;
  summary: string;
  palette: {
    shell: string;
    glow: string;
    core: string;
    eye: string;
  };
};

export const defaultStarterCharacter = "ember-754";

export const starterCharacters: StarterCharacter[] = [
  {
    slug: "ember-754",
    name: "Ember-754",
    title: "Faultborn Oracle",
    summary: "Obsidian shell, molten fracture lines, stellar eyes, and a live reactor core.",
    palette: { shell: "#201a1e", glow: "#ff4937", core: "#ff7e6d", eye: "#7e8fff" },
  },
  {
    slug: "void-monk",
    name: "Void Monk",
    title: "Silent Navigator",
    summary: "Ash-grey mystic built for discipline, speed, and long-range tracing.",
    palette: { shell: "#444b5c", glow: "#8dd6ff", core: "#bfe9ff", eye: "#d8f4ff" },
  },
  {
    slug: "copper-saint",
    name: "Copper Saint",
    title: "Refinery Pilgrim",
    summary: "Brass-plated drifter threaded with refinery heat and old station signal marks.",
    palette: { shell: "#5a3724", glow: "#ff9d4d", core: "#ffd38b", eye: "#fff1c4" },
  },
  {
    slug: "glacier-wisp",
    name: "Glacier Wisp",
    title: "Cryo Archivist",
    summary: "Frost-veined operator carrying archival memory and clean precision fire.",
    palette: { shell: "#27465a", glow: "#7ef3ff", core: "#ddfdff", eye: "#d6f8ff" },
  },
  {
    slug: "toxin-jester",
    name: "Toxin Jester",
    title: "Underbelly Trickster",
    summary: "Neon poison circuits and corrosive humor from the worst decks in the station.",
    palette: { shell: "#262229", glow: "#8dff42", core: "#daff97", eye: "#d0ff78" },
  },
  {
    slug: "seraph-static",
    name: "Seraph Static",
    title: "Signal Choir",
    summary: "Cathedral-grade comms construct laced with gold static and halo interference.",
    palette: { shell: "#40373b", glow: "#ffd866", core: "#fff2a3", eye: "#ffe98a" },
  },
  {
    slug: "night-suture",
    name: "Night Suture",
    title: "Recovery Unit",
    summary: "Midnight medical chassis with violet repair seams and surgical patience.",
    palette: { shell: "#241f34", glow: "#b07dff", core: "#dec5ff", eye: "#cdb8ff" },
  },
  {
    slug: "rust-halo",
    name: "Rust Halo",
    title: "Dockyard Relic",
    summary: "Recovered from a dead shipyard, still humming with redline ignition scars.",
    palette: { shell: "#3b2a24", glow: "#ff6b57", core: "#ffc0aa", eye: "#ffd7cf" },
  },
  {
    slug: "cinder-veil",
    name: "Cinder Veil",
    title: "Smuggler Ghost",
    summary: "Smoke-black skin and dim ember veins for silent work in bad districts.",
    palette: { shell: "#22252a", glow: "#ff6b4a", core: "#ffac8f", eye: "#ffe5d8" },
  },
  {
    slug: "solar-ivy",
    name: "Solar Ivy",
    title: "Hydroponics Bloom",
    summary: "Bioluminescent plant-synthetic with warm solar filaments and adaptive growth.",
    palette: { shell: "#263626", glow: "#5df08a", core: "#d7ff9e", eye: "#e5ffd5" },
  },
];

export function getStarterCharacter(slug?: string | null): StarterCharacter {
  return starterCharacters.find((character) => character.slug === slug) ?? starterCharacters[0];
}
