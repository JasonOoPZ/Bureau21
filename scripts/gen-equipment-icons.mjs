// Generate SVG icons for all equipment
// Run: node scripts/gen-equipment-icons.mjs

import { writeFileSync } from "fs";

const TIER_COLORS = {
  GRAY:   { primary: "#9ca3af", dark: "#4b5563", glow: "#6b7280" },
  GREEN:  { primary: "#4ade80", dark: "#166534", glow: "#22c55e" },
  BLUE:   { primary: "#38bdf8", dark: "#075985", glow: "#0ea5e9" },
  AMBER:  { primary: "#fbbf24", dark: "#78350f", glow: "#f59e0b" },
  RED:    { primary: "#f87171", dark: "#7f1d1d", glow: "#ef4444" },
  VIOLET: { primary: "#c084fc", dark: "#581c87", glow: "#a855f7" },
  BLACK:  { primary: "#e2e8f0", dark: "#1e293b", glow: "#94a3b8" },
  OMEGA:  { primary: "#fcd34d", dark: "#713f12", glow: "#eab308" },
};

// Weapon SVG shapes by type keyword
function weaponShape(name, c) {
  const n = name.toLowerCase();
  if (n.includes("baton") || n.includes("staff") || n.includes("lance") || n.includes("scythe")) {
    // Melee pole weapon
    return `<line x1="20" y1="44" x2="44" y2="8" stroke="${c.primary}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="44" cy="8" r="4" fill="${c.primary}" opacity="0.7"/>
    <line x1="38" y1="10" x2="50" y2="6" stroke="${c.primary}" stroke-width="2" stroke-linecap="round"/>`;
  }
  if (n.includes("knife") || n.includes("blade") || n.includes("dagger") || n.includes("edge") || n.includes("fang") || n.includes("claw")) {
    // Blade
    return `<polygon points="16,44 32,6 36,8 22,44" fill="${c.primary}" opacity="0.8"/>
    <rect x="14" y="44" width="10" height="6" rx="1" fill="${c.dark}"/>
    <line x1="32" y1="6" x2="34" y2="4" stroke="${c.glow}" stroke-width="1.5" stroke-linecap="round"/>`;
  }
  if (n.includes("hammer") || n.includes("fist") || n.includes("flail")) {
    // Blunt
    return `<line x1="14" y1="46" x2="34" y2="14" stroke="${c.primary}" stroke-width="3" stroke-linecap="round"/>
    <rect x="28" y="6" width="16" height="12" rx="2" fill="${c.primary}" opacity="0.8"/>
    <rect x="30" y="8" width="12" height="8" rx="1" fill="${c.dark}" opacity="0.5"/>`;
  }
  if (n.includes("whip") || n.includes("lash")) {
    return `<path d="M14 44 Q20 30 30 24 Q40 18 46 10 Q48 8 50 6" fill="none" stroke="${c.primary}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="14" cy="44" r="3" fill="${c.dark}"/>
    <circle cx="50" cy="6" r="2" fill="${c.glow}"/>`;
  }
  if (n.includes("mortar") || n.includes("cannon") || n.includes("launcher") || n.includes("beam") || n.includes("siege")) {
    // Heavy
    return `<rect x="10" y="22" width="32" height="14" rx="3" fill="${c.primary}" opacity="0.8"/>
    <rect x="42" y="24" width="8" height="10" rx="1" fill="${c.dark}"/>
    <circle cx="14" cy="29" r="3" fill="${c.glow}" opacity="0.6"/>
    <rect x="6" y="30" width="8" height="6" rx="1" fill="${c.dark}" opacity="0.7"/>`;
  }
  if (n.includes("rifle") || n.includes("carbine") || n.includes("dmr") || n.includes("rail")) {
    // Long gun
    return `<rect x="8" y="26" width="38" height="6" rx="2" fill="${c.primary}" opacity="0.8"/>
    <rect x="46" y="27" width="6" height="4" rx="1" fill="${c.dark}"/>
    <rect x="4" y="28" width="6" height="8" rx="1" fill="${c.dark}" opacity="0.7"/>
    <circle cx="50" cy="29" r="1.5" fill="${c.glow}" opacity="0.8"/>
    <line x1="18" y1="26" x2="18" y2="32" stroke="${c.dark}" stroke-width="0.5"/>`;
  }
  if (n.includes("smg") || n.includes("scatter") || n.includes("shard")) {
    // Compact gun
    return `<rect x="12" y="24" width="28" height="8" rx="2" fill="${c.primary}" opacity="0.8"/>
    <rect x="40" y="25" width="5" height="6" rx="1" fill="${c.dark}"/>
    <rect x="16" y="32" width="6" height="8" rx="1" fill="${c.dark}" opacity="0.6"/>
    <circle cx="44" cy="28" r="1" fill="${c.glow}"/>`;
  }
  // Default: pistol/sidearm
  return `<rect x="14" y="20" width="24" height="10" rx="3" fill="${c.primary}" opacity="0.8"/>
  <rect x="38" y="22" width="6" height="6" rx="1" fill="${c.dark}"/>
  <rect x="18" y="30" width="6" height="10" rx="1" fill="${c.dark}" opacity="0.7"/>
  <circle cx="42" cy="25" r="1.5" fill="${c.glow}" opacity="0.8"/>`;
}

// Armor SVG shapes by type keyword
function armorShape(name, c) {
  const n = name.toLowerCase();
  if (n.includes("vest") || n.includes("jacket") || n.includes("coat") || n.includes("overcoat") || n.includes("shroud") || n.includes("cloak") || n.includes("wrap") || n.includes("hide")) {
    // Light cloth/vest
    return `<path d="M18 16 L14 20 L14 40 L22 42 L32 42 L40 40 L40 20 L36 16 Z" fill="${c.primary}" opacity="0.7"/>
    <path d="M18 16 L27 12 L36 16" fill="none" stroke="${c.glow}" stroke-width="1.5"/>
    <line x1="27" y1="16" x2="27" y2="38" stroke="${c.dark}" stroke-width="1" opacity="0.5"/>`;
  }
  if (n.includes("pad") || n.includes("harness") || n.includes("rig")) {
    // Tactical harness
    return `<rect x="16" y="14" width="22" height="28" rx="3" fill="${c.primary}" opacity="0.6"/>
    <rect x="12" y="18" width="6" height="12" rx="1" fill="${c.dark}" opacity="0.5"/>
    <rect x="36" y="18" width="6" height="12" rx="1" fill="${c.dark}" opacity="0.5"/>
    <line x1="20" y1="14" x2="20" y2="42" stroke="${c.glow}" stroke-width="1" opacity="0.4"/>
    <line x1="34" y1="14" x2="34" y2="42" stroke="${c.glow}" stroke-width="1" opacity="0.4"/>`;
  }
  if (n.includes("plate") || n.includes("carrier") || n.includes("shell") || n.includes("plating") || n.includes("chassis") || n.includes("carapace") || n.includes("exo") || n.includes("frame") || n.includes("colossus")) {
    // Heavy plate armor
    return `<path d="M16 14 L12 18 L12 38 L20 44 L34 44 L42 38 L42 18 L38 14 Z" fill="${c.primary}" opacity="0.75"/>
    <path d="M16 14 L27 10 L38 14" fill="none" stroke="${c.glow}" stroke-width="2"/>
    <rect x="22" y="20" width="10" height="14" rx="2" fill="${c.dark}" opacity="0.4"/>
    <line x1="27" y1="20" x2="27" y2="34" stroke="${c.glow}" stroke-width="0.5"/>`;
  }
  if (n.includes("suit") || n.includes("skin") || n.includes("mesh") || n.includes("weave") || n.includes("membrane") || n.includes("integument")) {
    // Bodysuit
    return `<path d="M22 10 L18 14 L14 20 L16 42 L22 46 L32 46 L38 42 L40 20 L36 14 L32 10 Z" fill="${c.primary}" opacity="0.6"/>
    <ellipse cx="27" cy="22" rx="6" ry="4" fill="${c.glow}" opacity="0.2"/>
    <line x1="22" y1="10" x2="22" y2="46" stroke="${c.dark}" stroke-width="0.5" opacity="0.4"/>
    <line x1="32" y1="10" x2="32" y2="46" stroke="${c.dark}" stroke-width="0.5" opacity="0.4"/>`;
  }
  if (n.includes("ward") || n.includes("barrier") || n.includes("aegis") || n.includes("shield") || n.includes("deflector") || n.includes("mantle") || n.includes("cocoon") || n.includes("veil") || n.includes("lattice")) {
    // Energy shield
    return `<path d="M27 8 L12 18 L12 34 L27 46 L42 34 L42 18 Z" fill="none" stroke="${c.primary}" stroke-width="2"/>
    <path d="M27 14 L18 20 L18 32 L27 40 L36 32 L36 20 Z" fill="${c.primary}" opacity="0.3"/>
    <circle cx="27" cy="27" r="5" fill="${c.glow}" opacity="0.4"/>`;
  }
  // Default: generic armor piece
  return `<path d="M18 12 L14 18 L14 38 L22 44 L32 44 L40 38 L40 18 L36 12 Z" fill="${c.primary}" opacity="0.7"/>
  <path d="M18 12 L27 8 L36 12" fill="none" stroke="${c.glow}" stroke-width="1.5"/>
  <circle cx="27" cy="26" r="4" fill="${c.dark}" opacity="0.4"/>`;
}

function makeSVG(shapeFn, name, tier) {
  const c = TIER_COLORS[tier];
  const shape = shapeFn(name, c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" width="56" height="56">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${c.glow}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="56" height="56" rx="6" fill="#0a0d11"/>
  <rect x="1" y="1" width="54" height="54" rx="5" fill="none" stroke="${c.primary}" stroke-width="0.5" opacity="0.3"/>
  <circle cx="28" cy="28" r="22" fill="url(#g)"/>
  ${shape}
</svg>`;
}

const WEAPONS = [
  // GRAY
  ["standard-baton","GRAY"],["b21-sidearm","GRAY"],["stun-rod-mk1","GRAY"],["tac-knife-7","GRAY"],["shock-pistol","GRAY"],["riot-launcher","GRAY"],
  // GREEN
  ["agents-carbine","GREEN"],["pulse-dagger","GREEN"],["scattershot-r2","GREEN"],["cryo-sling","GREEN"],["fieldwork-smg","GREEN"],["concussion-lance","GREEN"],
  // BLUE
  ["tac-ops-rifle","BLUE"],["arc-whip","BLUE"],["breachers-hammer","BLUE"],["thermal-cutter","BLUE"],["marksman-dmr","BLUE"],["grav-fist-mk2","BLUE"],
  // AMBER
  ["specops-railpistol","AMBER"],["incendiary-staff","AMBER"],["needle-rifle","AMBER"],["disruptor-cannon","AMBER"],["venom-edge","AMBER"],["siege-mortar","AMBER"],
  // RED
  ["ghost-rifle","RED"],["ripper-claws","RED"],["ion-lancer","RED"],["executioners-rail","RED"],["null-blade","RED"],["desolator-mk5","RED"],
  // VIOLET
  ["xeno-spine-whip","VIOLET"],["hive-shard-launcher","VIOLET"],["synapse-disruptor","VIOLET"],["chitinblade","VIOLET"],["spore-cannon","VIOLET"],["void-scythe","VIOLET"],
  // BLACK
  ["antimatter-pistol","BLACK"],["quantum-flail","BLACK"],["singularity-rifle","BLACK"],["wardens-verdict","BLACK"],["extinction-beam","BLACK"],["paradox-engine","BLACK"],
  // OMEGA
  ["founders-hand","OMEGA"],["abyssal-fang","OMEGA"],["godkiller-lance","OMEGA"],["echo-of-silence","OMEGA"],["directive-zero","OMEGA"],
];

const ARMOR = [
  // GRAY
  ["trainee-vest","GRAY"],["b21-field-jacket","GRAY"],["riot-pads","GRAY"],["recon-harness","GRAY"],["ceramic-plate-carrier","GRAY"],["enforcer-shell","GRAY"],
  // GREEN
  ["agents-overcoat","GREEN"],["nano-mesh-suit","GREEN"],["blast-vest-mk3","GREEN"],["thermal-wrap","GREEN"],["stealth-shroud","GREEN"],["bulwark-frame","GREEN"],
  // BLUE
  ["tac-ops-rig","BLUE"],["shock-absorber-suit","BLUE"],["hazmat-carapace","BLUE"],["deflector-mantle","BLUE"],["juggernaut-plating","BLUE"],["ghost-weave","BLUE"],
  // AMBER
  ["sentinel-chassis","AMBER"],["inferno-guard","AMBER"],["mirage-shell","AMBER"],["fortress-coat","AMBER"],["predators-hide","AMBER"],["colossus-rig","AMBER"],
  // RED
  ["shadow-skin","RED"],["reactor-plate","RED"],["graviton-aegis","RED"],["hardlight-barrier","RED"],["eclipse-mantle","RED"],["dreadnaught-exo","RED"],
  // VIOLET
  ["chitin-integument","VIOLET"],["hive-woven-cloak","VIOLET"],["psionic-ward","VIOLET"],["xenograft-suit","VIOLET"],["spore-cocoon","VIOLET"],["void-carapace","VIOLET"],
  // BLACK
  ["antimatter-shroud","BLACK"],["quantum-lattice","BLACK"],["singularity-shell","BLACK"],["wardens-resolve","BLACK"],["extinction-plate","BLACK"],["paradox-barrier","BLACK"],
  // OMEGA
  ["founders-coat","OMEGA"],["abyssal-membrane","OMEGA"],["godshield-mantle","OMEGA"],["veil-of-redaction","OMEGA"],["protocol-alpha","OMEGA"],
];

let count = 0;
for (const [slug, tier] of WEAPONS) {
  const name = slug.replace(/-/g, " ");
  const svg = makeSVG(weaponShape, name, tier);
  writeFileSync(`public/equipment/weapons/${slug}.svg`, svg);
  count++;
}
for (const [slug, tier] of ARMOR) {
  const name = slug.replace(/-/g, " ");
  const svg = makeSVG(armorShape, name, tier);
  writeFileSync(`public/equipment/armor/${slug}.svg`, svg);
  count++;
}

console.log(`Generated ${count} equipment icons.`);
