/* ═══════════════════════════════════════════════
   BUREAU 21 — EQUIPMENT DATABASE
   Clearance-Based Weapon & Armor System
   ═══════════════════════════════════════════════ */

export type ClearanceTier = "GRAY" | "GREEN" | "BLUE" | "AMBER" | "RED" | "VIOLET" | "BLACK" | "OMEGA";
export type EquipmentSlot = "weapon" | "armor";

export interface ClearanceDef {
  id: ClearanceTier;
  label: string;
  range: string;
  desc: string;
  color: string;
  bg: string;
}

export const CLEARANCE_TIERS: ClearanceDef[] = [
  { id: "GRAY",   label: "GRAY",   range: "1–10",   desc: "Recruit / Civilian",   color: "#9ca3af", bg: "#1a1a22" },
  { id: "GREEN",  label: "GREEN",  range: "11–20",  desc: "Field Agent",          color: "#4ade80", bg: "#0f1f15" },
  { id: "BLUE",   label: "BLUE",   range: "21–35",  desc: "Tactical Ops",         color: "#38bdf8", bg: "#0f1725" },
  { id: "AMBER",  label: "AMBER",  range: "36–50",  desc: "Special Operations",   color: "#fbbf24", bg: "#1f1a0f" },
  { id: "RED",    label: "RED",    range: "51–65",  desc: "Black Ops",            color: "#f87171", bg: "#250f0f" },
  { id: "VIOLET", label: "VIOLET", range: "66–80",  desc: "Xenotech Division",    color: "#c084fc", bg: "#1a0f25" },
  { id: "BLACK",  label: "BLACK",  range: "81–95",  desc: "Ultra-Classified",     color: "#e2e8f0", bg: "#0a0a0a" },
  { id: "OMEGA",  label: "OMEGA",  range: "96–100", desc: "Director Tier",        color: "#fcd34d", bg: "#1a1508" },
];

export interface EquipmentDef {
  name: string;
  slot: EquipmentSlot;
  lvl: number;
  tier: ClearanceTier;
  stat: number;      // maxATK for weapons, maxDEF for armor
  price: number;     // credit cost (rp from design doc)
  notes: string;
  image: string;     // path under /equipment/
  purchasable: boolean; // true if available from vendor (GRAY/GREEN/BLUE)
}

// ═══════════════════════════════════════════════
// WEAPONS — 47 items across 8 clearance tiers
// ═══════════════════════════════════════════════

export const WEAPONS: EquipmentDef[] = [
  // GRAY CLEARANCE (Lvl 1-10)
  { name: "Standard Baton",       slot: "weapon", lvl: 1,  tier: "GRAY",   stat: 3,    price: 0,     notes: "Issued at enrollment. Every agent starts here.",          image: "weapons/standard-baton.svg",       purchasable: true },
  { name: "B21 Sidearm",          slot: "weapon", lvl: 2,  tier: "GRAY",   stat: 6,    price: 50,    notes: "Bureau-standard .45 caliber pistol.",                     image: "weapons/b21-sidearm.svg",          purchasable: true },
  { name: "Stun Rod MK-I",        slot: "weapon", lvl: 4,  tier: "GRAY",   stat: 10,   price: 120,   notes: "Non-lethal compliance tool.",                             image: "weapons/stun-rod-mk1.svg",         purchasable: true },
  { name: "Tac-Knife 7",          slot: "weapon", lvl: 6,  tier: "GRAY",   stat: 14,   price: 200,   notes: "Reinforced carbon-steel combat blade.",                   image: "weapons/tac-knife-7.svg",          purchasable: true },
  { name: "Shock Pistol",         slot: "weapon", lvl: 8,  tier: "GRAY",   stat: 18,   price: 300,   notes: "Electrostatic discharge sidearm.",                        image: "weapons/shock-pistol.svg",         purchasable: true },
  { name: "Riot Launcher",        slot: "weapon", lvl: 10, tier: "GRAY",   stat: 22,   price: 400,   notes: "Fires rubber slugs and flashbangs.",                      image: "weapons/riot-launcher.svg",        purchasable: true },

  // GREEN CLEARANCE (Lvl 11-20)
  { name: "Agent's Carbine",      slot: "weapon", lvl: 11, tier: "GREEN",  stat: 26,   price: 550,   notes: "Standard-issue field rifle.",                             image: "weapons/agents-carbine.svg",       purchasable: true },
  { name: "Pulse Dagger",         slot: "weapon", lvl: 13, tier: "GREEN",  stat: 30,   price: 700,   notes: "Vibration-edged melee weapon.",                           image: "weapons/pulse-dagger.svg",         purchasable: true },
  { name: "Scattershot R2",       slot: "weapon", lvl: 15, tier: "GREEN",  stat: 35,   price: 900,   notes: "Short-range devastation.",                                image: "weapons/scattershot-r2.svg",       purchasable: true },
  { name: "Cryo Sling",           slot: "weapon", lvl: 17, tier: "GREEN",  stat: 40,   price: 1100,  notes: "Fires compressed nitrogen bolts.",                        image: "weapons/cryo-sling.svg",           purchasable: true },
  { name: "Fieldwork SMG",        slot: "weapon", lvl: 19, tier: "GREEN",  stat: 45,   price: 1350,  notes: "High fire-rate submachine gun.",                          image: "weapons/fieldwork-smg.svg",        purchasable: true },
  { name: "Concussion Lance",     slot: "weapon", lvl: 20, tier: "GREEN",  stat: 50,   price: 1600,  notes: "Kinetic burst polearm.",                                  image: "weapons/concussion-lance.svg",     purchasable: true },

  // BLUE CLEARANCE (Lvl 21-35)
  { name: "Tac-Ops Rifle",        slot: "weapon", lvl: 22, tier: "BLUE",   stat: 55,   price: 1900,  notes: "Modular tactical platform.",                              image: "weapons/tac-ops-rifle.svg",        purchasable: true },
  { name: "Arc Whip",             slot: "weapon", lvl: 25, tier: "BLUE",   stat: 62,   price: 2300,  notes: "Electrified filament lash.",                              image: "weapons/arc-whip.svg",             purchasable: true },
  { name: "Breacher's Hammer",    slot: "weapon", lvl: 28, tier: "BLUE",   stat: 70,   price: 2800,  notes: "Pneumatic-assisted war hammer.",                          image: "weapons/breachers-hammer.svg",     purchasable: true },
  { name: "Thermal Cutter",       slot: "weapon", lvl: 30, tier: "BLUE",   stat: 78,   price: 3300,  notes: "Plasma-edged close-range blade.",                         image: "weapons/thermal-cutter.svg",       purchasable: true },
  { name: "Marksman DMR",         slot: "weapon", lvl: 32, tier: "BLUE",   stat: 85,   price: 3800,  notes: "Designated marksman rifle.",                              image: "weapons/marksman-dmr.svg",         purchasable: true },
  { name: "Grav-Fist MK-II",      slot: "weapon", lvl: 35, tier: "BLUE",   stat: 95,   price: 4400,  notes: "Gravity-enhanced gauntlet.",                              image: "weapons/grav-fist-mk2.svg",        purchasable: true },

  // AMBER CLEARANCE (Lvl 36-50)
  { name: "SpecOps Railpistol",   slot: "weapon", lvl: 37, tier: "AMBER",  stat: 105,  price: 5000,  notes: "Compact electromagnetic sidearm.",                        image: "weapons/specops-railpistol.svg",   purchasable: false },
  { name: "Incendiary Staff",     slot: "weapon", lvl: 40, tier: "AMBER",  stat: 118,  price: 5800,  notes: "Thermite-core melee staff.",                              image: "weapons/incendiary-staff.svg",     purchasable: false },
  { name: "Needle Rifle",         slot: "weapon", lvl: 43, tier: "AMBER",  stat: 130,  price: 6600,  notes: "Fires micro-flechettes at mach 3.",                       image: "weapons/needle-rifle.svg",         purchasable: false },
  { name: "Disruptor Cannon",     slot: "weapon", lvl: 46, tier: "AMBER",  stat: 145,  price: 7500,  notes: "EM pulse heavy weapon.",                                  image: "weapons/disruptor-cannon.svg",     purchasable: false },
  { name: "Venom Edge",           slot: "weapon", lvl: 48, tier: "AMBER",  stat: 158,  price: 8300,  notes: "Chemical-coated alien-alloy blade.",                      image: "weapons/venom-edge.svg",           purchasable: false },
  { name: "Siege Mortar (P)",     slot: "weapon", lvl: 50, tier: "AMBER",  stat: 170,  price: 9200,  notes: "Portable micro-mortar launcher.",                         image: "weapons/siege-mortar.svg",         purchasable: false },

  // RED CLEARANCE (Lvl 51-65)
  { name: "Ghost Rifle",          slot: "weapon", lvl: 52, tier: "RED",    stat: 185,  price: 10500, notes: "Sound-suppressed, radar-invisible.",                      image: "weapons/ghost-rifle.svg",          purchasable: false },
  { name: "Ripper Claws",         slot: "weapon", lvl: 55, tier: "RED",    stat: 200,  price: 12000, notes: "Retractable monofilament talons.",                        image: "weapons/ripper-claws.svg",         purchasable: false },
  { name: "Ion Lancer",           slot: "weapon", lvl: 58, tier: "RED",    stat: 220,  price: 14000, notes: "Directed ion beam projector.",                            image: "weapons/ion-lancer.svg",           purchasable: false },
  { name: "Executioner's Rail",   slot: "weapon", lvl: 60, tier: "RED",    stat: 240,  price: 16000, notes: "Long-range railgun platform.",                            image: "weapons/executioners-rail.svg",    purchasable: false },
  { name: "Null Blade",           slot: "weapon", lvl: 63, tier: "RED",    stat: 260,  price: 18500, notes: "Gravity-null edge sword.",                                image: "weapons/null-blade.svg",           purchasable: false },
  { name: "Desolator MK-V",       slot: "weapon", lvl: 65, tier: "RED",    stat: 280,  price: 21000, notes: "Area-denial heavy cannon.",                               image: "weapons/desolator-mk5.svg",        purchasable: false },

  // VIOLET CLEARANCE (Lvl 66-80)
  { name: "Xeno-Spine Whip",     slot: "weapon", lvl: 67, tier: "VIOLET", stat: 305,  price: 24000, notes: "Bioengineered alien-spine lash.",                         image: "weapons/xeno-spine-whip.svg",      purchasable: false },
  { name: "Hive Shard Launcher", slot: "weapon", lvl: 70, tier: "VIOLET", stat: 335,  price: 28000, notes: "Fires crystallized alien resin.",                         image: "weapons/hive-shard-launcher.svg",  purchasable: false },
  { name: "Synapse Disruptor",   slot: "weapon", lvl: 73, tier: "VIOLET", stat: 365,  price: 32000, notes: "Psionic-frequency emitter.",                              image: "weapons/synapse-disruptor.svg",    purchasable: false },
  { name: "Chitinblade",          slot: "weapon", lvl: 76, tier: "VIOLET", stat: 400,  price: 37000, notes: "Forged from harvested xeno-chitin.",                      image: "weapons/chitinblade.svg",          purchasable: false },
  { name: "Spore Cannon",         slot: "weapon", lvl: 78, tier: "VIOLET", stat: 430,  price: 42000, notes: "Alien bio-weapon, causes decay.",                         image: "weapons/spore-cannon.svg",         purchasable: false },
  { name: "Void Scythe",          slot: "weapon", lvl: 80, tier: "VIOLET", stat: 465,  price: 48000, notes: "Dark-matter infused reaping blade.",                      image: "weapons/void-scythe.svg",          purchasable: false },

  // BLACK CLEARANCE (Lvl 81-95)
  { name: "Antimatter Pistol",   slot: "weapon", lvl: 82, tier: "BLACK",  stat: 505,  price: 55000, notes: "Pocket-sized annihilation. Handle with care.",            image: "weapons/antimatter-pistol.svg",    purchasable: false },
  { name: "Quantum Flail",        slot: "weapon", lvl: 85, tier: "BLACK",  stat: 555,  price: 64000, notes: "Exists in multiple states simultaneously.",               image: "weapons/quantum-flail.svg",        purchasable: false },
  { name: "Singularity Rifle",   slot: "weapon", lvl: 88, tier: "BLACK",  stat: 610,  price: 75000, notes: "Creates micro-black holes on impact.",                    image: "weapons/singularity-rifle.svg",    purchasable: false },
  { name: "Warden's Verdict",     slot: "weapon", lvl: 91, tier: "BLACK",  stat: 670,  price: 88000, notes: "Bureau-legend melee weapon.",                             image: "weapons/wardens-verdict.svg",      purchasable: false },
  { name: "Extinction Beam",     slot: "weapon", lvl: 93, tier: "BLACK",  stat: 730,  price: 100000,notes: "Orbital-class directed energy.",                          image: "weapons/extinction-beam.svg",      purchasable: false },
  { name: "Paradox Engine",      slot: "weapon", lvl: 95, tier: "BLACK",  stat: 800,  price: 120000,notes: "Temporal disruption cannon.",                              image: "weapons/paradox-engine.svg",       purchasable: false },

  // OMEGA CLEARANCE (Lvl 96-100)
  { name: "The Founder's Hand",  slot: "weapon", lvl: 96, tier: "OMEGA",  stat: 870,  price: 150000,notes: "Relic of Bureau 21's first Director.",                    image: "weapons/founders-hand.svg",        purchasable: false },
  { name: "Abyssal Fang",         slot: "weapon", lvl: 97, tier: "OMEGA",  stat: 920,  price: 180000,notes: "Xeno-organic living weapon.",                             image: "weapons/abyssal-fang.svg",         purchasable: false },
  { name: "Godkiller Lance",     slot: "weapon", lvl: 98, tier: "OMEGA",  stat: 960,  price: 220000,notes: "Built to slay the unslayable.",                           image: "weapons/godkiller-lance.svg",      purchasable: false },
  { name: "Echo of Silence",     slot: "weapon", lvl: 99, tier: "OMEGA",  stat: 990,  price: 280000,notes: "Erases the target from causality.",                       image: "weapons/echo-of-silence.svg",      purchasable: false },
  { name: "DIRECTIVE ZERO",       slot: "weapon", lvl: 100,tier: "OMEGA",  stat: 1000, price: 500000,notes: "The Bureau's final word. Classified beyond classification.",image: "weapons/directive-zero.svg",      purchasable: false },
];

// ═══════════════════════════════════════════════
// ARMOR — 47 items across 8 clearance tiers
// ═══════════════════════════════════════════════

export const ARMOR: EquipmentDef[] = [
  // GRAY CLEARANCE (Lvl 1-10)
  { name: "Trainee Vest",          slot: "armor", lvl: 1,  tier: "GRAY",   stat: 3,    price: 0,     notes: "Standard issue padded vest.",                             image: "armor/trainee-vest.svg",           purchasable: true },
  { name: "B21 Field Jacket",      slot: "armor", lvl: 2,  tier: "GRAY",   stat: 6,    price: 50,    notes: "Kevlar-lined bureau jacket.",                             image: "armor/b21-field-jacket.svg",       purchasable: true },
  { name: "Riot Pads",             slot: "armor", lvl: 4,  tier: "GRAY",   stat: 10,   price: 120,   notes: "Impact-absorbing joint protection.",                      image: "armor/riot-pads.svg",              purchasable: true },
  { name: "Recon Harness",         slot: "armor", lvl: 6,  tier: "GRAY",   stat: 14,   price: 200,   notes: "Lightweight surveillance-ops gear.",                      image: "armor/recon-harness.svg",          purchasable: true },
  { name: "Ceramic Plate Carrier", slot: "armor", lvl: 8,  tier: "GRAY",   stat: 18,   price: 300,   notes: "Ballistic ceramic inserts.",                              image: "armor/ceramic-plate-carrier.svg",  purchasable: true },
  { name: "Enforcer Shell",        slot: "armor", lvl: 10, tier: "GRAY",   stat: 22,   price: 400,   notes: "Riot-grade full-torso guard.",                            image: "armor/enforcer-shell.svg",         purchasable: true },

  // GREEN CLEARANCE (Lvl 11-20)
  { name: "Agent's Overcoat",      slot: "armor", lvl: 11, tier: "GREEN",  stat: 26,   price: 550,   notes: "Ballistic-weave trenchcoat.",                             image: "armor/agents-overcoat.svg",        purchasable: true },
  { name: "Nano-Mesh Suit",        slot: "armor", lvl: 13, tier: "GREEN",  stat: 30,   price: 700,   notes: "Self-repairing micro-fiber armor.",                       image: "armor/nano-mesh-suit.svg",         purchasable: true },
  { name: "Blast Vest MK-III",     slot: "armor", lvl: 15, tier: "GREEN",  stat: 35,   price: 900,   notes: "Explosive ordnance protection.",                          image: "armor/blast-vest-mk3.svg",         purchasable: true },
  { name: "Thermal Wrap",          slot: "armor", lvl: 17, tier: "GREEN",  stat: 40,   price: 1100,  notes: "Heat-dissipating body shield.",                           image: "armor/thermal-wrap.svg",           purchasable: true },
  { name: "Stealth Shroud",        slot: "armor", lvl: 19, tier: "GREEN",  stat: 45,   price: 1350,  notes: "Radar-dampening field suit.",                             image: "armor/stealth-shroud.svg",         purchasable: true },
  { name: "Bulwark Frame",         slot: "armor", lvl: 20, tier: "GREEN",  stat: 50,   price: 1600,  notes: "Powered exo-frame, light class.",                         image: "armor/bulwark-frame.svg",          purchasable: true },

  // BLUE CLEARANCE (Lvl 21-35)
  { name: "Tac-Ops Rig",           slot: "armor", lvl: 22, tier: "BLUE",   stat: 55,   price: 1900,  notes: "Modular tactical armor system.",                          image: "armor/tac-ops-rig.svg",            purchasable: true },
  { name: "Shock Absorber Suit",   slot: "armor", lvl: 25, tier: "BLUE",   stat: 62,   price: 2300,  notes: "Kinetic energy redistribution.",                          image: "armor/shock-absorber-suit.svg",    purchasable: true },
  { name: "Hazmat Carapace",       slot: "armor", lvl: 28, tier: "BLUE",   stat: 70,   price: 2800,  notes: "CBRN-rated sealed armor.",                                image: "armor/hazmat-carapace.svg",        purchasable: true },
  { name: "Deflector Mantle",      slot: "armor", lvl: 30, tier: "BLUE",   stat: 78,   price: 3300,  notes: "Projectile-redirect energy field.",                       image: "armor/deflector-mantle.svg",       purchasable: true },
  { name: "Juggernaut Plating",    slot: "armor", lvl: 32, tier: "BLUE",   stat: 85,   price: 3800,  notes: "Heavy composite battle armor.",                           image: "armor/juggernaut-plating.svg",     purchasable: true },
  { name: "Ghost Weave",           slot: "armor", lvl: 35, tier: "BLUE",   stat: 95,   price: 4400,  notes: "Phase-shift camouflage suit.",                            image: "armor/ghost-weave.svg",            purchasable: true },

  // AMBER CLEARANCE (Lvl 36-50)
  { name: "Sentinel Chassis",     slot: "armor", lvl: 37, tier: "AMBER",  stat: 105,  price: 5000,  notes: "Powered medium-class exosuit.",                           image: "armor/sentinel-chassis.svg",       purchasable: false },
  { name: "Inferno Guard",        slot: "armor", lvl: 40, tier: "AMBER",  stat: 118,  price: 5800,  notes: "Extreme heat resistance plating.",                        image: "armor/inferno-guard.svg",          purchasable: false },
  { name: "Mirage Shell",         slot: "armor", lvl: 43, tier: "AMBER",  stat: 130,  price: 6600,  notes: "Holographic decoy armor.",                                image: "armor/mirage-shell.svg",           purchasable: false },
  { name: "Fortress Coat",        slot: "armor", lvl: 46, tier: "AMBER",  stat: 145,  price: 7500,  notes: "Deployable cover built into armor.",                      image: "armor/fortress-coat.svg",          purchasable: false },
  { name: "Predator's Hide",      slot: "armor", lvl: 48, tier: "AMBER",  stat: 158,  price: 8300,  notes: "Alien-leather reinforced suit.",                          image: "armor/predators-hide.svg",         purchasable: false },
  { name: "Colossus Rig",         slot: "armor", lvl: 50, tier: "AMBER",  stat: 170,  price: 9200,  notes: "Heavy powered assault frame.",                            image: "armor/colossus-rig.svg",           purchasable: false },

  // RED CLEARANCE (Lvl 51-65)
  { name: "Shadow Skin",          slot: "armor", lvl: 52, tier: "RED",    stat: 185,  price: 10500, notes: "Light-bending stealth suit.",                             image: "armor/shadow-skin.svg",            purchasable: false },
  { name: "Reactor Plate",        slot: "armor", lvl: 55, tier: "RED",    stat: 200,  price: 12000, notes: "Nuclear-powered shield emitter.",                         image: "armor/reactor-plate.svg",          purchasable: false },
  { name: "Graviton Aegis",       slot: "armor", lvl: 58, tier: "RED",    stat: 220,  price: 14000, notes: "Gravity-well defense system.",                            image: "armor/graviton-aegis.svg",         purchasable: false },
  { name: "Hardlight Barrier",    slot: "armor", lvl: 60, tier: "RED",    stat: 240,  price: 16000, notes: "Solid-light projected armor.",                            image: "armor/hardlight-barrier.svg",      purchasable: false },
  { name: "Eclipse Mantle",       slot: "armor", lvl: 63, tier: "RED",    stat: 260,  price: 18500, notes: "Absorbs incoming energy attacks.",                        image: "armor/eclipse-mantle.svg",         purchasable: false },
  { name: "Dreadnaught Exo",      slot: "armor", lvl: 65, tier: "RED",    stat: 280,  price: 21000, notes: "Walking fortress. Slow but invincible.",                  image: "armor/dreadnaught-exo.svg",        purchasable: false },

  // VIOLET CLEARANCE (Lvl 66-80)
  { name: "Chitin Integument",    slot: "armor", lvl: 67, tier: "VIOLET", stat: 305,  price: 24000, notes: "Grafted alien exoskeleton layer.",                        image: "armor/chitin-integument.svg",      purchasable: false },
  { name: "Hive-Woven Cloak",     slot: "armor", lvl: 70, tier: "VIOLET", stat: 335,  price: 28000, notes: "Living alien-silk defense wrap.",                         image: "armor/hive-woven-cloak.svg",       purchasable: false },
  { name: "Psionic Ward",         slot: "armor", lvl: 73, tier: "VIOLET", stat: 365,  price: 32000, notes: "Mental-frequency shield generator.",                     image: "armor/psionic-ward.svg",           purchasable: false },
  { name: "Xenograft Suit",       slot: "armor", lvl: 76, tier: "VIOLET", stat: 400,  price: 37000, notes: "Human-alien hybrid bio-armor.",                           image: "armor/xenograft-suit.svg",         purchasable: false },
  { name: "Spore Cocoon",         slot: "armor", lvl: 78, tier: "VIOLET", stat: 430,  price: 42000, notes: "Regenerative alien organism shell.",                      image: "armor/spore-cocoon.svg",           purchasable: false },
  { name: "Void Carapace",        slot: "armor", lvl: 80, tier: "VIOLET", stat: 465,  price: 48000, notes: "Dark-matter reinforced xeno-plate.",                     image: "armor/void-carapace.svg",          purchasable: false },

  // BLACK CLEARANCE (Lvl 81-95)
  { name: "Antimatter Shroud",    slot: "armor", lvl: 82, tier: "BLACK",  stat: 505,  price: 55000, notes: "Annihilates incoming projectiles.",                       image: "armor/antimatter-shroud.svg",      purchasable: false },
  { name: "Quantum Lattice",      slot: "armor", lvl: 85, tier: "BLACK",  stat: 555,  price: 64000, notes: "Probabilistic damage avoidance.",                        image: "armor/quantum-lattice.svg",        purchasable: false },
  { name: "Singularity Shell",    slot: "armor", lvl: 88, tier: "BLACK",  stat: 610,  price: 75000, notes: "Event-horizon personal defense.",                        image: "armor/singularity-shell.svg",      purchasable: false },
  { name: "Warden's Resolve",     slot: "armor", lvl: 91, tier: "BLACK",  stat: 670,  price: 88000, notes: "Legendary Bureau defense relic.",                         image: "armor/wardens-resolve.svg",        purchasable: false },
  { name: "Extinction Plate",     slot: "armor", lvl: 93, tier: "BLACK",  stat: 730,  price: 100000,notes: "Survives planetary-class impacts.",                       image: "armor/extinction-plate.svg",       purchasable: false },
  { name: "Paradox Barrier",      slot: "armor", lvl: 95, tier: "BLACK",  stat: 800,  price: 120000,notes: "Temporal loop defense — unkillable.",                     image: "armor/paradox-barrier.svg",        purchasable: false },

  // OMEGA CLEARANCE (Lvl 96-100)
  { name: "The Founder's Coat",   slot: "armor", lvl: 96, tier: "OMEGA",  stat: 870,  price: 150000,notes: "Worn by Bureau 21's first Director.",                     image: "armor/founders-coat.svg",          purchasable: false },
  { name: "Abyssal Membrane",     slot: "armor", lvl: 97, tier: "OMEGA",  stat: 920,  price: 180000,notes: "Xeno-organic living shield.",                             image: "armor/abyssal-membrane.svg",       purchasable: false },
  { name: "Godshield Mantle",     slot: "armor", lvl: 98, tier: "OMEGA",  stat: 960,  price: 220000,notes: "Repels forces that shouldn't exist.",                     image: "armor/godshield-mantle.svg",       purchasable: false },
  { name: "Veil of Redaction",    slot: "armor", lvl: 99, tier: "OMEGA",  stat: 990,  price: 280000,notes: "You can't hit what's been erased.",                       image: "armor/veil-of-redaction.svg",      purchasable: false },
  { name: "PROTOCOL ALPHA",       slot: "armor", lvl: 100,tier: "OMEGA",  stat: 1000, price: 500000,notes: "Bureau 21's ultimate shield. File not found.",             image: "armor/protocol-alpha.svg",         purchasable: false },
];

/** All equipment combined */
export const ALL_EQUIPMENT: EquipmentDef[] = [...WEAPONS, ...ARMOR];

/** Get equipment purchasable from the vendor (GRAY/GREEN/BLUE) */
export function getVendorCatalog(slot?: EquipmentSlot): EquipmentDef[] {
  const purchasable = ALL_EQUIPMENT.filter((e) => e.purchasable);
  return slot ? purchasable.filter((e) => e.slot === slot) : purchasable;
}

/** Find equipment by name */
export function findEquipment(name: string): EquipmentDef | undefined {
  return ALL_EQUIPMENT.find((e) => e.name === name);
}

/** Get clearance tier definition */
export function getClearance(tier: ClearanceTier): ClearanceDef {
  return CLEARANCE_TIERS.find((c) => c.id === tier)!;
}

/** Tier-based Tailwind colors for borders/text */
export const TIER_STYLES: Record<ClearanceTier, { text: string; border: string; bg: string; glow: string }> = {
  GRAY:   { text: "text-slate-400",   border: "border-slate-600",   bg: "bg-slate-900/30",   glow: "shadow-slate-700/20" },
  GREEN:  { text: "text-emerald-400", border: "border-emerald-700", bg: "bg-emerald-950/20",  glow: "shadow-emerald-700/20" },
  BLUE:   { text: "text-sky-400",     border: "border-sky-700",     bg: "bg-sky-950/20",      glow: "shadow-sky-700/20" },
  AMBER:  { text: "text-amber-400",   border: "border-amber-700",   bg: "bg-amber-950/20",    glow: "shadow-amber-700/20" },
  RED:    { text: "text-red-400",     border: "border-red-700",     bg: "bg-red-950/20",      glow: "shadow-red-700/20" },
  VIOLET: { text: "text-purple-400",  border: "border-purple-700",  bg: "bg-purple-950/20",   glow: "shadow-purple-700/20" },
  BLACK:  { text: "text-slate-200",   border: "border-slate-400",   bg: "bg-slate-950/40",    glow: "shadow-slate-300/20" },
  OMEGA:  { text: "text-yellow-300",  border: "border-yellow-600",  bg: "bg-yellow-950/20",   glow: "shadow-yellow-500/30" },
};
