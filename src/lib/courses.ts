export interface Course {
  slug: string;
  name: string;
  description: string;
  maxPoints: number;
}

export const COURSES: Course[] = [
  { slug: "xenochemistry", name: "Xenochemistry 101", description: "Alien compound synthesis. Improves fabrication yields.", maxPoints: 1000 },
  { slug: "synthetics", name: "Synthetics 101", description: "Artificial material design. Unlocks advanced crafting recipes.", maxPoints: 1000 },
  { slug: "terraforming", name: "Terraforming 101", description: "Planetary surface engineering. Boosts hydroponics growth.", maxPoints: 1000 },
  { slug: "void_fishing", name: "Void Fishing 101", description: "Deep-space aquatic extraction. Better catches at the Fishing Hut.", maxPoints: 1000 },
  { slug: "xenobiology", name: "Xenobiology 101", description: "Alien organism classification. Bonus XP from encounters.", maxPoints: 1000 },
  { slug: "probability", name: "Probability Theory 101", description: "Statistical analysis and odds calculation. Improves Casino returns.", maxPoints: 1000 },
  { slug: "hydroculture", name: "Hydroculture 101", description: "Advanced hydroponic cultivation. Higher herb yields.", maxPoints: 1000 },
  { slug: "station_design", name: "Station Design 101", description: "Habitat construction and layout. Unlocks cosmetic upgrades.", maxPoints: 1000 },
  { slug: "command", name: "Command Theory 103", description: "Leadership and fleet coordination. Syndicate bonuses.", maxPoints: 1000 },
  { slug: "rations", name: "Ration Processing 101", description: "Nutritional synthesis. Better consumable effects.", maxPoints: 1000 },
  { slug: "asteroid_mining", name: "Asteroid Mining 101", description: "Mineral extraction techniques. More ore per operation.", maxPoints: 1000 },
  { slug: "nanotech", name: "Nanotech 101", description: "Nanoscale engineering. Equipment upgrade efficiency.", maxPoints: 1000 },
  { slug: "pharmacology", name: "Pharmacology 101", description: "Medicinal compound theory. Stronger herb effects.", maxPoints: 1000 },
  { slug: "quantum_mechanics", name: "Quantum Mechanics 101", description: "Subatomic physics. Research and tech bonuses.", maxPoints: 1000 },
  { slug: "xenotheology", name: "Xenotheology 101", description: "Alien belief systems and cultural studies. Trade bonuses.", maxPoints: 1000 },
  { slug: "robotics", name: "Robotics 101", description: "Autonomous systems design. Drone and automation unlocks.", maxPoints: 1000 },
  { slug: "propulsion", name: "Propulsion Science 101", description: "Engine and thrust theory. Ship speed improvements.", maxPoints: 1000 },
  { slug: "smelting", name: "Ore Smelting 101", description: "Refinery metallurgy. Better conversion rates.", maxPoints: 1000 },
  { slug: "alloy_forging", name: "Alloy Forging 101", description: "Advanced metallurgy. Superior weapon and armor crafting.", maxPoints: 1000 },
  { slug: "spacefaring", name: "Spacefaring 101", description: "Deep-space navigation. Extended exploration range.", maxPoints: 1000 },
  { slug: "systems_eng", name: "Systems Engineering 101", description: "Complex systems integration. Station upgrade efficiency.", maxPoints: 1000 },
  { slug: "infiltration", name: "Infiltration 101", description: "Covert operations theory. Better smuggling success rates.", maxPoints: 1000 },
  { slug: "tactical_warfare", name: "Tactical Warfare 101", description: "Combat strategy and doctrine. Battle performance bonuses.", maxPoints: 1000 },
];

export const STUDY_COST = 5; // motivation per study
export const MAX_COURSES_FREE = 15; // non-subscribed account limit
