{/* Synthwave pixel-art hero banners — shared across all pages */}

type Scene =
  | "station"
  | "armory"
  | "bazaar"
  | "academy"
  | "docking-bay"
  | "syndicate-row"
  | "underbelly"
  | "outer-ring"
  | "hydroponics"
  | "fabrication"
  | "casino"
  | "training-grounds"
  | "fishing-hut"
  | "fight-pit"
  | "lounge"
  | "exploration-bay"
  | "info-broker"
  | "smugglers-den"
  | "mining-rig"
  | "outpost"
  | "refinery"
  | "salvage-yard"
  | "pawn-shop"
  | "tattoo-parlor"
  | "university"
  | "bank"
  | "battle"
  | "gym"
  | "heroes"
  | "house"
  | "inventory"
  | "lobby"
  | "chat"
  | "boards"
  | "primaris";

interface PixelBannerProps {
  scene: Scene;
  title: string;
  subtitle?: string;
  accentColor?: string;
  children?: React.ReactNode;
}

/* ── Palette presets by scene ─────────────────────────── */
const PALETTES: Record<string, { sky1: string; sky2: string; sky3: string; sun: string; neon1: string; neon2: string; building: string; buildingDark: string; accent: string }> = {
  "station":          { sky1: "#08010f", sky2: "#0c1830", sky3: "#162850", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#7b2fff", building: "#0a1a2a", buildingDark: "#060e18", accent: "#22d3ee" },
  "armory":           { sky1: "#0a0408", sky2: "#1a0818", sky3: "#2a1030", sun: "#ef4444", neon1: "#ef4444", neon2: "#f59e0b", building: "#1a0828", buildingDark: "#0a0418", accent: "#ef4444" },
  "bazaar":           { sky1: "#0a0604", sky2: "#201008", sky3: "#3a1810", sun: "#f59e0b", neon1: "#f59e0b", neon2: "#ef4444", building: "#181008", buildingDark: "#0a0804", accent: "#f59e0b" },
  "academy":          { sky1: "#04080f", sky2: "#081830", sky3: "#0c2850", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#3b82f6", building: "#081828", buildingDark: "#040c18", accent: "#22d3ee" },
  "docking-bay":      { sky1: "#06080f", sky2: "#0a1828", sky3: "#142840", sun: "#60a5fa", neon1: "#60a5fa", neon2: "#22d3ee", building: "#0c1420", buildingDark: "#060a14", accent: "#60a5fa" },
  "syndicate-row":    { sky1: "#0a040f", sky2: "#180830", sky3: "#2a1050", sun: "#a855f7", neon1: "#a855f7", neon2: "#ec4899", building: "#140828", buildingDark: "#0a0418", accent: "#a855f7" },
  "underbelly":       { sky1: "#08010f", sky2: "#150830", sky3: "#2a1050", sun: "#ff2d7b", neon1: "#ff2d7b", neon2: "#7b2fff", building: "#1a0838", buildingDark: "#0a0418", accent: "#c084fc" },
  "outer-ring":       { sky1: "#0f0404", sky2: "#200808", sky3: "#3a1010", sun: "#ef4444", neon1: "#ef4444", neon2: "#f97316", building: "#180808", buildingDark: "#0a0404", accent: "#ef4444" },
  "hydroponics":      { sky1: "#020f08", sky2: "#04200c", sky3: "#083818", sun: "#10b981", neon1: "#10b981", neon2: "#22d3ee", building: "#0a1810", buildingDark: "#040c08", accent: "#10b981" },
  "fabrication":      { sky1: "#0f0804", sky2: "#201508", sky3: "#382410", sun: "#f97316", neon1: "#f97316", neon2: "#ef4444", building: "#181008", buildingDark: "#0c0804", accent: "#f97316" },
  "casino":           { sky1: "#08010f", sky2: "#150830", sky3: "#2a1050", sun: "#ff2d7b", neon1: "#ff2d7b", neon2: "#7b2fff", building: "#1a0838", buildingDark: "#0a0418", accent: "#ff2d7b" },
  "training-grounds": { sky1: "#0a0404", sky2: "#1a0808", sky3: "#2a1010", sun: "#ef4444", neon1: "#ef4444", neon2: "#f59e0b", building: "#180808", buildingDark: "#0c0404", accent: "#ef4444" },
  "fishing-hut":      { sky1: "#040808", sky2: "#081820", sky3: "#0c2838", sun: "#14b8a6", neon1: "#14b8a6", neon2: "#22d3ee", building: "#081418", buildingDark: "#040a0e", accent: "#14b8a6" },
  "fight-pit":        { sky1: "#0f0204", sky2: "#200408", sky3: "#3a0810", sun: "#dc2626", neon1: "#dc2626", neon2: "#f59e0b", building: "#1a0408", buildingDark: "#0c0204", accent: "#dc2626" },
  "lounge":           { sky1: "#0a0410", sky2: "#180820", sky3: "#281038", sun: "#ec4899", neon1: "#ec4899", neon2: "#a855f7", building: "#140818", buildingDark: "#0a040c", accent: "#ec4899" },
  "exploration-bay":  { sky1: "#020810", sky2: "#041020", sky3: "#081838", sun: "#06b6d4", neon1: "#06b6d4", neon2: "#3b82f6", building: "#061018", buildingDark: "#020810", accent: "#06b6d4" },
  "info-broker":      { sky1: "#08040f", sky2: "#100818", sky3: "#1a1028", sun: "#8b5cf6", neon1: "#8b5cf6", neon2: "#06b6d4", building: "#0e0818", buildingDark: "#06040c", accent: "#8b5cf6" },
  "smugglers-den":    { sky1: "#0a060a", sky2: "#180c18", sky3: "#281428", sun: "#a855f7", neon1: "#a855f7", neon2: "#f59e0b", building: "#140c14", buildingDark: "#0a060a", accent: "#a855f7" },
  "mining-rig":       { sky1: "#080604", sky2: "#141008", sky3: "#201810", sun: "#a3a3a3", neon1: "#f59e0b", neon2: "#a3a3a3", building: "#121008", buildingDark: "#080604", accent: "#f59e0b" },
  "outpost":          { sky1: "#040806", sky2: "#081810", sky3: "#0c2818", sun: "#22c55e", neon1: "#22c55e", neon2: "#14b8a6", building: "#081810", buildingDark: "#040c08", accent: "#22c55e" },
  "refinery":         { sky1: "#080604", sky2: "#141008", sky3: "#201810", sun: "#78716c", neon1: "#f97316", neon2: "#a3a3a3", building: "#100c08", buildingDark: "#080604", accent: "#78716c" },
  "salvage-yard":     { sky1: "#060606", sky2: "#101010", sky3: "#1a1a1a", sun: "#71717a", neon1: "#a3a3a3", neon2: "#f59e0b", building: "#0e0e0e", buildingDark: "#060606", accent: "#a3a3a3" },
  "pawn-shop":        { sky1: "#0a0804", sky2: "#181408", sky3: "#282010", sun: "#eab308", neon1: "#eab308", neon2: "#ef4444", building: "#141008", buildingDark: "#0a0804", accent: "#eab308" },
  "tattoo-parlor":    { sky1: "#0a0410", sky2: "#180820", sky3: "#281038", sun: "#f472b6", neon1: "#f472b6", neon2: "#a855f7", building: "#140810", buildingDark: "#0a0408", accent: "#f472b6" },
  "university":       { sky1: "#040810", sky2: "#081828", sky3: "#0c2840", sun: "#38bdf8", neon1: "#38bdf8", neon2: "#a855f7", building: "#081420", buildingDark: "#040a14", accent: "#38bdf8" },
  "bank":             { sky1: "#04080a", sky2: "#081820", sky3: "#0c2838", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#f59e0b", building: "#081418", buildingDark: "#040a0e", accent: "#22d3ee" },
  "battle":           { sky1: "#0a0404", sky2: "#1a0808", sky3: "#2a1010", sun: "#ef4444", neon1: "#ef4444", neon2: "#f59e0b", building: "#180808", buildingDark: "#0c0404", accent: "#ef4444" },
  "gym":              { sky1: "#060806", sky2: "#0c180c", sky3: "#142814", sun: "#22c55e", neon1: "#22c55e", neon2: "#eab308", building: "#0a140a", buildingDark: "#060a06", accent: "#22c55e" },
  "heroes":           { sky1: "#06060a", sky2: "#0c1020", sky3: "#141838", sun: "#3b82f6", neon1: "#3b82f6", neon2: "#f59e0b", building: "#0a1020", buildingDark: "#060814", accent: "#3b82f6" },
  "house":            { sky1: "#06080a", sky2: "#0c1820", sky3: "#142838", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#f59e0b", building: "#081418", buildingDark: "#04080c", accent: "#22d3ee" },
  "inventory":        { sky1: "#080804", sky2: "#141808", sky3: "#202810", sun: "#eab308", neon1: "#eab308", neon2: "#f59e0b", building: "#101008", buildingDark: "#080804", accent: "#eab308" },
  "lobby":            { sky1: "#04080f", sky2: "#081830", sky3: "#0c2850", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#3b82f6", building: "#081828", buildingDark: "#040c18", accent: "#22d3ee" },
  "chat":             { sky1: "#060810", sky2: "#0c1828", sky3: "#142840", sun: "#60a5fa", neon1: "#60a5fa", neon2: "#22d3ee", building: "#0c1420", buildingDark: "#060a14", accent: "#60a5fa" },
  "boards":           { sky1: "#060810", sky2: "#0c1828", sky3: "#142840", sun: "#60a5fa", neon1: "#60a5fa", neon2: "#a855f7", building: "#0c1420", buildingDark: "#060a14", accent: "#60a5fa" },
  "primaris":         { sky1: "#04080f", sky2: "#081830", sky3: "#0c2850", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#a855f7", building: "#081828", buildingDark: "#040c18", accent: "#22d3ee" },
};

/* ── Scene-specific foreground elements ──────────────── */
function SceneDetails({ scene, p }: { scene: Scene; p: typeof PALETTES[string] }) {
  switch (scene) {
    case "armory": return (
      <g>
        {/* Weapon rack building */}
        <rect x="260" y="130" width="120" height="62" fill={p.buildingDark} />
        <rect x="260" y="130" width="120" height="4" fill={p.neon1} opacity="0.3" />
        {/* Swords on wall */}
        <rect x="278" y="142" width="2" height="18" fill={p.neon1} opacity="0.6" />
        <rect x="275" y="142" width="8" height="2" fill={p.neon1} opacity="0.4" />
        <rect x="298" y="140" width="2" height="22" fill={p.neon2} opacity="0.6" />
        <rect x="295" y="140" width="8" height="2" fill={p.neon2} opacity="0.4" />
        <rect x="318" y="144" width="2" height="16" fill={p.neon1} opacity="0.5" />
        <rect x="315" y="144" width="8" height="2" fill={p.neon1} opacity="0.4" />
        {/* Shield */}
        <rect x="340" y="138" width="16" height="20" rx="0" fill={p.neon2} opacity="0.15" stroke={p.neon2} strokeWidth="1" />
        <rect x="346" y="142" width="4" height="4" fill={p.neon2} opacity="0.4" />
        {/* Sign */}
        <rect x="270" y="122" width="40" height="9" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="290" y="130" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.85" shapeRendering="auto">ARMORY</text>
      </g>
    );
    case "bazaar": return (
      <g>
        {/* Market stalls */}
        <rect x="200" y="140" width="60" height="52" fill={p.buildingDark} />
        <rect x="200" y="136" width="60" height="4" fill={p.neon2} opacity="0.3" />
        <rect x="280" y="145" width="80" height="47" fill={p.buildingDark} />
        <rect x="280" y="141" width="80" height="4" fill={p.neon1} opacity="0.3" />
        {/* Goods on display */}
        <rect x="210" y="150" width="6" height="6" fill={p.neon1} opacity="0.3" />
        <rect x="222" y="152" width="6" height="4" fill={p.neon2} opacity="0.3" />
        <rect x="238" y="148" width="8" height="8" fill={p.neon1} opacity="0.2" />
        <rect x="290" y="155" width="5" height="5" fill={p.neon2} opacity="0.3" />
        <rect x="302" y="152" width="7" height="8" fill={p.neon1} opacity="0.25" />
        <rect x="318" y="154" width="4" height="6" fill={p.neon2} opacity="0.35" />
        <rect x="332" y="150" width="10" height="10" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="1" />
        {/* Signs */}
        <rect x="205" y="128" width="35" height="9" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="222" y="136" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.85" shapeRendering="auto">TRADE</text>
        <rect x="295" y="133" width="40" height="9" fill={p.neon2} opacity="0.1" stroke={p.neon2} strokeWidth="1" />
        <text x="315" y="141" textAnchor="middle" fill={p.neon2} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.85" shapeRendering="auto">BAZAAR</text>
      </g>
    );
    case "academy": return (
      <g>
        {/* Academy dome */}
        <rect x="250" y="120" width="140" height="72" fill={p.buildingDark} />
        <path d="M270 120 L320 90 L370 120" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.6" />
        <circle cx="320" cy="105" r="8" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="1" />
        {/* Columns */}
        <rect x="266" y="120" width="6" height="72" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity="0.3" />
        <rect x="288" y="120" width="6" height="72" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity="0.3" />
        <rect x="346" y="120" width="6" height="72" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity="0.3" />
        <rect x="368" y="120" width="6" height="72" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity="0.3" />
        {/* Holo-screen */}
        <rect x="302" y="132" width="36" height="24" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="306" y="138" width="28" height="2" fill={p.neon1} opacity="0.4" />
        <rect x="306" y="144" width="20" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="306" y="150" width="24" height="2" fill={p.neon2} opacity="0.3" />
        {/* Sign */}
        <text x="320" y="86" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.7" shapeRendering="auto">ACADEMY</text>
      </g>
    );
    case "docking-bay": return (
      <g>
        {/* Hangar ceiling */}
        <rect x="180" y="120" width="280" height="72" fill={p.buildingDark} />
        <rect x="180" y="120" width="280" height="3" fill={p.neon1} opacity="0.25" />
        {/* Ship silhouette */}
        <polygon points="280,148 320,132 360,148 350,156 290,156" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.5" />
        <rect x="310" y="136" width="20" height="4" fill={p.neon1} opacity="0.3" />
        <rect x="315" y="144" width="10" height="2" fill={p.neon2} opacity="0.4" />
        {/* Gantry arms */}
        <rect x="200" y="130" width="3" height="62" fill={p.building} />
        <rect x="200" y="130" width="60" height="3" fill={p.building} />
        <rect x="438" y="130" width="3" height="62" fill={p.building} />
        <rect x="380" y="130" width="61" height="3" fill={p.building} />
        {/* Cargo crates */}
        <rect x="210" y="168" width="14" height="14" fill={p.neon2} opacity="0.15" stroke={p.neon2} strokeWidth="1" />
        <rect x="230" y="172" width="10" height="10" fill={p.neon1} opacity="0.12" stroke={p.neon1} strokeWidth="1" />
        <rect x="410" y="166" width="16" height="16" fill={p.neon2} opacity="0.15" stroke={p.neon2} strokeWidth="1" />
        {/* Sign */}
        <text x="320" y="126" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">DOCK-07</text>
      </g>
    );
    case "syndicate-row": return (
      <g>
        {/* Guild hall */}
        <rect x="240" y="118" width="160" height="74" fill={p.buildingDark} />
        <rect x="240" y="118" width="160" height="3" fill={p.neon1} opacity="0.3" />
        {/* Hexagonal emblems */}
        <polygon points="290,138 298,134 306,138 306,146 298,150 290,146" fill={p.neon1} opacity="0.12" stroke={p.neon1} strokeWidth="1" />
        <polygon points="330,136 338,132 346,136 346,144 338,148 330,144" fill={p.neon2} opacity="0.12" stroke={p.neon2} strokeWidth="1" />
        <polygon points="368,140 374,136 380,140 380,148 374,152 368,148" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        {/* Banners hanging */}
        <rect x="260" y="125" width="8" height="20" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="388" y="125" width="8" height="20" fill={p.neon2} opacity="0.15" stroke={p.neon2} strokeWidth="0.5" />
        {/* Sign */}
        <rect x="270" y="108" width="100" height="11" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="117" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">SYNDICATE ROW</text>
      </g>
    );
    case "underbelly": return (
      <g>
        {/* Dark alley */}
        <rect x="260" y="132" width="30" height="60" fill="#0a0418" />
        <rect x="350" y="132" width="30" height="60" fill="#0a0418" />
        {/* Steam vents */}
        <rect x="270" y="160" width="4" height="4" fill={p.neon1} opacity="0.3" />
        <rect x="268" y="154" width="2" height="6" fill="#fff" opacity="0.08" />
        <rect x="272" y="150" width="2" height="10" fill="#fff" opacity="0.06" />
        <rect x="358" y="158" width="4" height="4" fill={p.neon2} opacity="0.3" />
        <rect x="362" y="152" width="2" height="6" fill="#fff" opacity="0.07" />
        {/* Neon signs */}
        <rect x="296" y="126" width="50" height="11" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="321" y="135" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.9" shapeRendering="auto">DANGER</text>
        <rect x="302" y="145" width="36" height="9" fill={p.neon2} opacity="0.08" stroke={p.neon2} strokeWidth="1" />
        <text x="320" y="152" textAnchor="middle" fill={p.neon2} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.7" shapeRendering="auto">NO LAW</text>
        {/* Shady figure */}
        <rect x="338" y="162" width="6" height="6" fill="#0a0418" />
        <rect x="337" y="168" width="8" height="10" fill="#0a0418" />
        <rect x="337" y="178" width="3" height="6" fill="#0a0418" />
        <rect x="342" y="178" width="3" height="6" fill="#0a0418" />
        <rect x="340" y="165" width="2" height="1" fill={p.neon1} opacity="0.5" />
      </g>
    );
    case "outer-ring": return (
      <g>
        {/* Ruined buildings */}
        <rect x="220" y="130" width="40" height="62" fill={p.buildingDark} />
        <rect x="220" y="130" width="20" height="40" fill={p.buildingDark} />
        <rect x="240" y="126" width="10" height="4" fill={p.neon1} opacity="0.2" />
        <rect x="340" y="125" width="50" height="67" fill={p.buildingDark} />
        <rect x="340" y="118" width="20" height="7" fill={p.buildingDark} />
        {/* Damage cracks */}
        <line x1="230" y1="136" x2="245" y2="148" stroke={p.neon1} strokeWidth="0.5" opacity="0.3" />
        <line x1="350" y1="130" x2="365" y2="145" stroke={p.neon1} strokeWidth="0.5" opacity="0.3" />
        {/* War machine silhouette */}
        <rect x="280" y="152" width="20" height="24" fill="#0a0404" />
        <rect x="276" y="148" width="28" height="4" fill="#0a0404" />
        <rect x="286" y="144" width="8" height="4" fill="#0a0404" />
        <rect x="270" y="156" width="6" height="3" fill={p.neon1} opacity="0.4" />
        <rect x="304" y="156" width="6" height="3" fill={p.neon1} opacity="0.4" />
        <rect x="288" y="150" width="2" height="1" fill={p.neon1} opacity="0.7" />
        <rect x="292" y="150" width="2" height="1" fill={p.neon1} opacity="0.7" />
        {/* Warning sign */}
        <rect x="380" y="160" width="28" height="9" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="394" y="168" textAnchor="middle" fill={p.neon1} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">DANGER</text>
      </g>
    );
    case "hydroponics": return (
      <g>
        {/* Grow bay structure */}
        <rect x="220" y="125" width="200" height="67" fill={p.buildingDark} />
        <rect x="220" y="125" width="200" height="3" fill={p.neon1} opacity="0.25" />
        {/* Grow pods — glowing green */}
        <rect x="240" y="140" width="16" height="28" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="244" y="150" width="8" height="14" fill={p.neon1} opacity="0.15" />
        <rect x="270" y="138" width="16" height="30" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="274" y="146" width="8" height="18" fill={p.neon1} opacity="0.2" />
        <rect x="300" y="142" width="16" height="26" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="304" y="150" width="8" height="14" fill={p.neon1} opacity="0.12" />
        <rect x="330" y="136" width="16" height="32" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="334" y="144" width="8" height="20" fill={p.neon1} opacity="0.18" />
        <rect x="360" y="140" width="16" height="28" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="364" y="148" width="8" height="16" fill={p.neon1} opacity="0.15" />
        <rect x="390" y="144" width="16" height="24" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="394" y="152" width="8" height="12" fill={p.neon1} opacity="0.1" />
        {/* Overhead grow lights */}
        <rect x="246" y="133" width="4" height="4" fill={p.neon1} opacity="0.5" />
        <rect x="276" y="131" width="4" height="4" fill={p.neon1} opacity="0.5" />
        <rect x="306" y="135" width="4" height="4" fill={p.neon1} opacity="0.5" />
        <rect x="336" y="129" width="4" height="4" fill={p.neon1} opacity="0.5" />
        <rect x="366" y="133" width="4" height="4" fill={p.neon1} opacity="0.5" />
        <rect x="396" y="137" width="4" height="4" fill={p.neon1} opacity="0.5" />
        {/* Sign */}
        <text x="320" y="122" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">HYDRO BAY</text>
      </g>
    );
    case "fabrication": return (
      <g>
        {/* Factory building */}
        <rect x="220" y="120" width="200" height="72" fill={p.buildingDark} />
        {/* Smokestacks */}
        <rect x="240" y="100" width="14" height="20" fill={p.building} />
        <rect x="380" y="95" width="14" height="25" fill={p.building} />
        <rect x="400" y="105" width="10" height="15" fill={p.building} />
        {/* Smoke */}
        <rect x="244" y="92" width="4" height="4" fill="#fff" opacity="0.06" />
        <rect x="246" y="86" width="4" height="4" fill="#fff" opacity="0.04" />
        <rect x="384" y="88" width="4" height="4" fill="#fff" opacity="0.05" />
        {/* Molten glow */}
        <rect x="280" y="155" width="80" height="8" fill={p.neon1} opacity="0.15" />
        <rect x="290" y="157" width="12" height="4" fill={p.neon1} opacity="0.4" />
        <rect x="320" y="157" width="8" height="4" fill={p.neon1} opacity="0.35" />
        <rect x="340" y="157" width="14" height="4" fill={p.neon2} opacity="0.3" />
        {/* Anvil */}
        <rect x="310" y="140" width="20" height="12" fill={p.building} />
        <rect x="306" y="148" width="28" height="4" fill={p.building} />
        {/* Sparks */}
        <rect x="316" y="134" width="2" height="2" fill={p.neon1} opacity="0.7" />
        <rect x="322" y="130" width="2" height="2" fill={p.neon2} opacity="0.6" />
        <rect x="328" y="136" width="2" height="2" fill={p.neon1} opacity="0.5" />
        <rect x="312" y="128" width="2" height="2" fill={p.neon2} opacity="0.4" />
        {/* Sign */}
        <rect x="265" y="112" width="50" height="9" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="290" y="120" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">FORGE</text>
      </g>
    );
    case "training-grounds": return (
      <g>
        {/* Arena walls */}
        <rect x="220" y="130" width="200" height="62" fill={p.buildingDark} />
        <rect x="220" y="130" width="200" height="3" fill={p.neon1} opacity="0.3" />
        {/* Training dummies */}
        <rect x="268" y="148" width="6" height="6" fill={p.building} />
        <rect x="267" y="154" width="8" height="12" fill={p.building} />
        <rect x="263" y="156" width="4" height="3" fill={p.building} />
        <rect x="275" y="156" width="4" height="3" fill={p.building} />
        <rect x="340" y="146" width="6" height="6" fill={p.building} />
        <rect x="339" y="152" width="8" height="14" fill={p.building} />
        {/* Combat target rings */}
        <circle cx="310" cy="152" r="12" fill="none" stroke={p.neon1} strokeWidth="1" opacity="0.3" shapeRendering="auto" />
        <circle cx="310" cy="152" r="7" fill="none" stroke={p.neon1} strokeWidth="1" opacity="0.4" shapeRendering="auto" />
        <circle cx="310" cy="152" r="3" fill={p.neon1} opacity="0.5" shapeRendering="auto" />
        {/* Sign */}
        <rect x="270" y="120" width="100" height="11" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="129" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">TRAIN</text>
      </g>
    );
    case "fishing-hut": return (
      <g>
        {/* Water surface */}
        <rect x="0" y="172" width="640" height="20" fill={p.neon1} opacity="0.06" />
        <rect x="40" y="176" width="30" height="2" fill={p.neon1} opacity="0.15" />
        <rect x="150" y="180" width="40" height="2" fill={p.neon1} opacity="0.1" />
        <rect x="350" y="178" width="35" height="2" fill={p.neon1} opacity="0.12" />
        <rect x="500" y="174" width="25" height="2" fill={p.neon1} opacity="0.1" />
        {/* Pier */}
        <rect x="270" y="164" width="100" height="4" fill={p.building} />
        <rect x="280" y="168" width="4" height="16" fill={p.building} />
        <rect x="356" y="168" width="4" height="16" fill={p.building} />
        {/* Hut */}
        <rect x="290" y="140" width="60" height="24" fill={p.buildingDark} />
        <path d="M286 140 L320 124 L354 140" fill={p.building} />
        <rect x="310" y="150" width="10" height="14" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="0.5" />
        {/* Fishing line */}
        <line x1="376" y1="155" x2="400" y2="178" stroke={p.neon2} strokeWidth="0.7" opacity="0.4" shapeRendering="auto" />
        <rect x="398" y="176" width="4" height="4" fill={p.neon2} opacity="0.4" />
        {/* Sign */}
        <text x="320" y="120" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">FISH HUT</text>
      </g>
    );
    case "fight-pit": return (
      <g>
        {/* Cage ring */}
        <rect x="240" y="128" width="160" height="64" fill={p.buildingDark} />
        {/* Cage bars */}
        <rect x="250" y="128" width="2" height="64" fill={p.neon1} opacity="0.2" />
        <rect x="268" y="128" width="2" height="64" fill={p.neon1} opacity="0.2" />
        <rect x="370" y="128" width="2" height="64" fill={p.neon1} opacity="0.2" />
        <rect x="388" y="128" width="2" height="64" fill={p.neon1} opacity="0.2" />
        {/* Ring ropes */}
        <rect x="260" y="148" width="120" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="260" y="168" width="120" height="2" fill={p.neon1} opacity="0.3" />
        {/* Fighters */}
        <rect x="295" y="152" width="6" height="6" fill="#0c0204" />
        <rect x="294" y="158" width="8" height="10" fill="#0c0204" />
        <rect x="340" y="150" width="6" height="6" fill="#0c0204" />
        <rect x="339" y="156" width="8" height="12" fill="#0c0204" />
        {/* Crowd silhouettes */}
        <rect x="220" y="155" width="4" height="4" fill="#0c0204" opacity="0.5" />
        <rect x="226" y="156" width="4" height="4" fill="#0c0204" opacity="0.4" />
        <rect x="410" y="154" width="4" height="4" fill="#0c0204" opacity="0.5" />
        <rect x="416" y="155" width="4" height="4" fill="#0c0204" opacity="0.4" />
        {/* Sign */}
        <rect x="278" y="118" width="84" height="11" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="127" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.9" shapeRendering="auto">FIGHT PIT</text>
      </g>
    );
    case "lounge": return (
      <g>
        {/* Bar building */}
        <rect x="240" y="128" width="160" height="64" fill={p.buildingDark} />
        {/* Bar counter */}
        <rect x="260" y="160" width="120" height="6" fill={p.building} />
        <rect x="260" y="160" width="120" height="2" fill={p.neon1} opacity="0.2" />
        {/* Bottles on shelf */}
        <rect x="270" y="140" width="4" height="12" fill={p.neon1} opacity="0.2" />
        <rect x="280" y="142" width="4" height="10" fill={p.neon2} opacity="0.25" />
        <rect x="290" y="138" width="4" height="14" fill={p.neon1} opacity="0.2" />
        <rect x="300" y="140" width="4" height="12" fill={p.neon2} opacity="0.2" />
        <rect x="310" y="136" width="4" height="16" fill={p.neon1} opacity="0.25" />
        <rect x="320" y="142" width="4" height="10" fill={p.neon2} opacity="0.2" />
        {/* Stools */}
        <rect x="278" y="166" width="6" height="10" fill={p.building} />
        <rect x="278" y="164" width="6" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="320" y="166" width="6" height="10" fill={p.building} />
        <rect x="320" y="164" width="6" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="358" y="166" width="6" height="10" fill={p.building} />
        <rect x="358" y="164" width="6" height="2" fill={p.neon1} opacity="0.3" />
        {/* Sign */}
        <rect x="275" y="118" width="90" height="11" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="127" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">LOUNGE</text>
      </g>
    );
    case "exploration-bay": return (
      <g>
        {/* Star map console */}
        <rect x="250" y="125" width="140" height="67" fill={p.buildingDark} />
        {/* Holographic star chart */}
        <rect x="270" y="132" width="100" height="50" fill={p.neon1} opacity="0.04" stroke={p.neon1} strokeWidth="1" />
        {/* Stars on chart */}
        <rect x="285" y="140" width="3" height="3" fill={p.neon1} opacity="0.6" />
        <rect x="310" y="148" width="3" height="3" fill={p.neon2} opacity="0.5" />
        <rect x="340" y="138" width="3" height="3" fill={p.neon1} opacity="0.5" />
        <rect x="295" y="160" width="3" height="3" fill={p.neon2} opacity="0.4" />
        <rect x="330" y="165" width="3" height="3" fill={p.neon1} opacity="0.5" />
        <rect x="355" y="155" width="3" height="3" fill={p.neon2} opacity="0.4" />
        {/* Route line */}
        <line x1="287" y1="142" x2="312" y2="150" stroke={p.neon1} strokeWidth="0.7" opacity="0.4" strokeDasharray="3 2" shapeRendering="auto" />
        <line x1="312" y1="150" x2="342" y2="140" stroke={p.neon1} strokeWidth="0.7" opacity="0.3" strokeDasharray="3 2" shapeRendering="auto" />
        {/* Sign */}
        <text x="320" y="122" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">DEEP SPACE</text>
      </g>
    );
    case "info-broker": return (
      <g>
        {/* Monitor wall */}
        <rect x="250" y="128" width="140" height="64" fill={p.buildingDark} />
        {/* Screens */}
        <rect x="260" y="134" width="24" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="1" />
        <rect x="264" y="138" width="16" height="2" fill={p.neon1} opacity="0.4" />
        <rect x="264" y="143" width="12" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="292" y="134" width="24" height="18" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="1" />
        <rect x="296" y="138" width="16" height="2" fill={p.neon2} opacity="0.4" />
        <rect x="296" y="143" width="10" height="2" fill={p.neon2} opacity="0.3" />
        <rect x="324" y="134" width="24" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="1" />
        <rect x="328" y="138" width="16" height="2" fill={p.neon1} opacity="0.4" />
        <rect x="356" y="134" width="24" height="18" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="1" />
        {/* Dark figure */}
        <rect x="316" y="162" width="6" height="6" fill="#06040c" />
        <rect x="315" y="168" width="8" height="10" fill="#06040c" />
        <rect x="315" y="178" width="3" height="6" fill="#06040c" />
        <rect x="320" y="178" width="3" height="6" fill="#06040c" />
        <rect x="318" y="165" width="2" height="1" fill={p.neon1} opacity="0.6" />
        {/* Sign */}
        <rect x="280" y="118" width="80" height="11" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="127" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.75" shapeRendering="auto">INFO BKR</text>
      </g>
    );
    case "smugglers-den": return (
      <g>
        {/* Hidden bay */}
        <rect x="240" y="130" width="160" height="62" fill={p.buildingDark} />
        {/* Cargo crates */}
        <rect x="260" y="150" width="18" height="18" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.4" />
        <rect x="262" y="152" width="4" height="4" fill={p.neon1} opacity="0.3" />
        <rect x="285" y="155" width="14" height="14" fill={p.building} stroke={p.neon2} strokeWidth="1" opacity="0.4" />
        <rect x="310" y="148" width="20" height="20" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.4" />
        <rect x="314" y="152" width="4" height="4" fill={p.neon2} opacity="0.3" />
        <rect x="340" y="152" width="16" height="16" fill={p.building} stroke={p.neon2} strokeWidth="1" opacity="0.4" />
        <rect x="365" y="156" width="12" height="12" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.3" />
        {/* Dim hanging light */}
        <rect x="318" y="132" width="4" height="8" fill={p.neon2} opacity="0.2" />
        <rect x="316" y="140" width="8" height="4" fill={p.neon2} opacity="0.15" />
        {/* Sign */}
        <rect x="280" y="120" width="80" height="11" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="129" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.65" shapeRendering="auto">SMUGGLER</text>
      </g>
    );
    case "mining-rig": return (
      <g>
        {/* Rig structure */}
        <rect x="260" y="110" width="120" height="82" fill={p.buildingDark} />
        {/* Drill tower */}
        <rect x="308" y="86" width="24" height="24" fill={p.building} />
        <rect x="316" y="70" width="8" height="16" fill={p.building} />
        <rect x="318" y="66" width="4" height="4" fill={p.neon1} opacity="0.5" />
        {/* Conveyor belt */}
        <rect x="260" y="168" width="120" height="6" fill={p.building} />
        <rect x="270" y="168" width="8" height="6" fill={p.neon1} opacity="0.12" />
        <rect x="290" y="168" width="8" height="6" fill={p.neon2} opacity="0.1" />
        <rect x="310" y="168" width="8" height="6" fill={p.neon1} opacity="0.12" />
        <rect x="330" y="168" width="8" height="6" fill={p.neon2} opacity="0.1" />
        <rect x="350" y="168" width="8" height="6" fill={p.neon1} opacity="0.12" />
        {/* Ore chunks */}
        <rect x="275" y="158" width="6" height="6" fill={p.neon2} opacity="0.25" />
        <rect x="310" y="155" width="8" height="8" fill={p.neon1} opacity="0.2" />
        <rect x="348" y="158" width="6" height="6" fill={p.neon2} opacity="0.25" />
        {/* Sign */}
        <text x="320" y="82" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">MINE</text>
      </g>
    );
    case "outpost": return (
      <g>
        {/* Outpost building */}
        <rect x="280" y="135" width="80" height="57" fill={p.buildingDark} />
        <rect x="280" y="135" width="80" height="3" fill={p.neon1} opacity="0.25" />
        {/* Radio tower */}
        <rect x="316" y="90" width="8" height="45" fill={p.building} />
        <rect x="308" y="90" width="24" height="4" fill={p.building} />
        <rect x="310" y="100" width="20" height="3" fill={p.building} />
        <rect x="312" y="110" width="16" height="3" fill={p.building} />
        <rect x="318" y="86" width="4" height="4" fill={p.neon1} opacity="0.6" />
        {/* Barricades */}
        <rect x="250" y="170" width="30" height="10" fill={p.building} />
        <rect x="250" y="168" width="30" height="2" fill={p.neon1} opacity="0.2" />
        <rect x="360" y="172" width="30" height="10" fill={p.building} />
        <rect x="360" y="170" width="30" height="2" fill={p.neon1} opacity="0.2" />
        {/* Sign */}
        <text x="320" y="130" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">OUTPOST</text>
      </g>
    );
    case "refinery": return (
      <g>
        {/* Refinery building */}
        <rect x="230" y="115" width="180" height="77" fill={p.buildingDark} />
        {/* Pipes */}
        <rect x="250" y="130" width="140" height="4" fill={p.building} />
        <rect x="250" y="145" width="140" height="4" fill={p.building} />
        <rect x="250" y="160" width="140" height="4" fill={p.building} />
        {/* Pipe joints */}
        <rect x="290" y="128" width="8" height="8" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity="0.4" />
        <rect x="340" y="143" width="8" height="8" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity="0.4" />
        <rect x="310" y="158" width="8" height="8" fill={p.building} stroke={p.neon2} strokeWidth="0.5" opacity="0.3" />
        {/* Furnace glow */}
        <rect x="370" y="150" width="20" height="18" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <rect x="374" y="154" width="12" height="10" fill={p.neon1} opacity="0.2" />
        {/* Chimney */}
        <rect x="250" y="100" width="12" height="15" fill={p.building} />
        <rect x="252" y="94" width="4" height="4" fill="#fff" opacity="0.05" />
        {/* Sign */}
        <text x="320" y="112" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.5" shapeRendering="auto">REFINERY</text>
      </g>
    );
    case "salvage-yard": return (
      <g>
        {/* Scrap piles */}
        <polygon points="240,192 260,150 280,162 300,145 320,165 340,152 360,170 380,148 400,192" fill={p.buildingDark} />
        {/* Wrecked ship hull */}
        <polygon points="280,140 320,125 360,140 355,155 285,155" fill={p.building} opacity="0.6" />
        <rect x="300" y="132" width="20" height="4" fill={p.neon1} opacity="0.2" />
        <line x1="290" y1="138" x2="310" y2="150" stroke={p.neon2} strokeWidth="0.5" opacity="0.3" shapeRendering="auto" />
        <line x1="340" y1="135" x2="325" y2="148" stroke={p.neon2} strokeWidth="0.5" opacity="0.3" shapeRendering="auto" />
        {/* Crane */}
        <rect x="420" y="100" width="6" height="92" fill={p.building} />
        <rect x="380" y="100" width="48" height="4" fill={p.building} />
        <line x1="390" y1="104" x2="390" y2="140" stroke={p.neon1} strokeWidth="0.5" opacity="0.4" shapeRendering="auto" />
        <rect x="386" y="140" width="8" height="4" fill={p.neon1} opacity="0.3" />
        {/* Sign */}
        <text x="320" y="120" textAnchor="middle" fill={p.neon2} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.5" shapeRendering="auto">SALVAGE</text>
      </g>
    );
    case "pawn-shop": return (
      <g>
        {/* Shop building */}
        <rect x="260" y="130" width="120" height="62" fill={p.buildingDark} />
        {/* Window display */}
        <rect x="275" y="145" width="30" height="22" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="1" />
        <rect x="335" y="145" width="30" height="22" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="1" />
        {/* Items in window */}
        <rect x="280" y="152" width="6" height="10" fill={p.neon1} opacity="0.3" />
        <rect x="290" y="155" width="8" height="8" fill={p.neon2} opacity="0.25" />
        <rect x="340" y="150" width="10" height="6" fill={p.neon1} opacity="0.3" />
        <rect x="352" y="154" width="6" height="10" fill={p.neon2} opacity="0.25" />
        {/* OPEN neon sign */}
        <rect x="300" y="132" width="40" height="11" fill={p.neon1} opacity="0.12" stroke={p.neon1} strokeWidth="1.5" />
        <text x="320" y="141" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.9" shapeRendering="auto">PAWN</text>
        {/* Door */}
        <rect x="312" y="162" width="16" height="20" fill={p.building} stroke={p.neon2} strokeWidth="0.5" opacity="0.4" />
      </g>
    );
    case "tattoo-parlor": return (
      <g>
        {/* Parlor building */}
        <rect x="260" y="130" width="120" height="62" fill={p.buildingDark} />
        {/* Neon sign */}
        <rect x="272" y="120" width="96" height="12" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1.5" />
        <text x="320" y="130" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.9" shapeRendering="auto">TATTOO INK</text>
        {/* Ink machine */}
        <rect x="280" y="150" width="4" height="16" fill={p.neon2} opacity="0.4" />
        <rect x="278" y="148" width="8" height="4" fill={p.neon2} opacity="0.3" />
        <line x1="284" y1="154" x2="296" y2="162" stroke={p.neon2} strokeWidth="0.7" opacity="0.4" shapeRendering="auto" />
        {/* Chair */}
        <rect x="300" y="155" width="24" height="10" fill={p.building} />
        <rect x="324" y="148" width="6" height="17" fill={p.building} />
        <rect x="298" y="165" width="4" height="10" fill={p.building} />
        <rect x="322" y="165" width="4" height="10" fill={p.building} />
        {/* Flash art on walls */}
        <rect x="345" y="140" width="12" height="12" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="345" y="158" width="12" height="12" fill={p.neon2} opacity="0.08" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="365" y="148" width="10" height="10" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="0.5" />
      </g>
    );
    case "university": return (
      <g>
        {/* Main building */}
        <rect x="230" y="118" width="180" height="74" fill={p.buildingDark} />
        {/* Dome */}
        <path d="M290 118 L320 92 L350 118" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.5" />
        <circle cx="320" cy="104" r="6" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="1" shapeRendering="auto" />
        {/* Wings */}
        <rect x="200" y="135" width="30" height="57" fill={p.buildingDark} />
        <rect x="410" y="135" width="30" height="57" fill={p.buildingDark} />
        {/* Columns */}
        <rect x="250" y="118" width="5" height="74" fill={p.building} stroke={p.neon1} strokeWidth="0.3" opacity="0.25" />
        <rect x="275" y="118" width="5" height="74" fill={p.building} stroke={p.neon1} strokeWidth="0.3" opacity="0.25" />
        <rect x="360" y="118" width="5" height="74" fill={p.building} stroke={p.neon1} strokeWidth="0.3" opacity="0.25" />
        <rect x="385" y="118" width="5" height="74" fill={p.building} stroke={p.neon1} strokeWidth="0.3" opacity="0.25" />
        {/* Windows */}
        <rect x="300" y="130" width="40" height="24" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="1" />
        <rect x="304" y="136" width="32" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="304" y="142" width="24" height="2" fill={p.neon2} opacity="0.25" />
        <rect x="304" y="148" width="28" height="2" fill={p.neon1} opacity="0.3" />
        {/* Sign */}
        <text x="320" y="88" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">UNIVERSITY</text>
      </g>
    );
    case "bank": return (
      <g>
        {/* Vault building */}
        <rect x="250" y="118" width="140" height="74" fill={p.buildingDark} />
        <rect x="250" y="118" width="140" height="3" fill={p.neon1} opacity="0.25" />
        {/* Vault door */}
        <circle cx="320" cy="155" r="22" fill={p.building} stroke={p.neon1} strokeWidth="1.5" opacity="0.5" shapeRendering="auto" />
        <circle cx="320" cy="155" r="14" fill="none" stroke={p.neon1} strokeWidth="1" strokeDasharray="4 3" opacity="0.3" shapeRendering="auto" />
        <circle cx="320" cy="155" r="6" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="1" shapeRendering="auto" />
        {/* Handle */}
        <rect x="330" y="148" width="14" height="3" fill={p.neon2} opacity="0.4" />
        {/* Gold stacks */}
        <rect x="260" y="168" width="12" height="8" fill={p.neon2} opacity="0.3" />
        <rect x="262" y="164" width="8" height="4" fill={p.neon2} opacity="0.25" />
        <rect x="370" y="170" width="10" height="6" fill={p.neon2} opacity="0.3" />
        {/* Sign */}
        <rect x="280" y="108" width="80" height="11" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="117" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">BANK</text>
      </g>
    );
    case "battle": return (
      <g>
        {/* Arena */}
        <rect x="220" y="125" width="200" height="67" fill={p.buildingDark} />
        {/* Mecha silhouettes */}
        <rect x="270" y="140" width="14" height="14" fill="#0c0404" />
        <rect x="266" y="134" width="22" height="6" fill="#0c0404" />
        <rect x="274" y="128" width="6" height="6" fill="#0c0404" />
        <rect x="268" y="154" width="5" height="14" fill="#0c0404" />
        <rect x="283" y="154" width="5" height="14" fill="#0c0404" />
        <rect x="260" y="142" width="6" height="3" fill={p.neon1} opacity="0.5" />
        <rect x="358" y="138" width="14" height="16" fill="#0c0404" />
        <rect x="354" y="132" width="22" height="6" fill="#0c0404" />
        <rect x="362" y="126" width="6" height="6" fill="#0c0404" />
        <rect x="356" y="154" width="5" height="14" fill="#0c0404" />
        <rect x="371" y="154" width="5" height="14" fill="#0c0404" />
        <rect x="376" y="140" width="6" height="3" fill={p.neon2} opacity="0.5" />
        {/* Eye glow */}
        <rect x="276" y="130" width="2" height="1" fill={p.neon1} opacity="0.8" />
        <rect x="364" y="128" width="2" height="1" fill={p.neon2} opacity="0.8" />
        {/* Explosion between */}
        <rect x="315" y="142" width="4" height="4" fill={p.neon1} opacity="0.5" />
        <rect x="311" y="138" width="3" height="3" fill={p.neon2} opacity="0.4" />
        <rect x="320" y="136" width="3" height="3" fill={p.neon1} opacity="0.3" />
        <rect x="318" y="148" width="3" height="3" fill={p.neon2} opacity="0.3" />
        {/* Sign */}
        <rect x="278" y="115" width="84" height="11" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="124" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.9" shapeRendering="auto">ARENA</text>
      </g>
    );
    case "gym": return (
      <g>
        {/* Gym building */}
        <rect x="240" y="125" width="160" height="67" fill={p.buildingDark} />
        {/* Weight rack */}
        <rect x="260" y="130" width="4" height="42" fill={p.building} />
        <rect x="254" y="140" width="16" height="4" fill={p.building} />
        <rect x="252" y="138" width="6" height="8" fill={p.neon1} opacity="0.25" />
        <rect x="266" y="138" width="6" height="8" fill={p.neon1} opacity="0.25" />
        <rect x="254" y="154" width="16" height="4" fill={p.building} />
        <rect x="252" y="152" width="8" height="8" fill={p.neon2} opacity="0.2" />
        <rect x="264" y="152" width="8" height="8" fill={p.neon2} opacity="0.2" />
        {/* Mecha training pod */}
        <rect x="300" y="135" width="40" height="40" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.4" />
        <rect x="310" y="145" width="20" height="20" fill={p.neon1} opacity="0.06" />
        <rect x="316" y="150" width="8" height="10" fill={p.neon1} opacity="0.15" />
        {/* Punching bag */}
        <rect x="370" y="132" width="2" height="8" fill={p.building} />
        <rect x="364" y="140" width="14" height="24" fill={p.building} stroke={p.neon2} strokeWidth="0.5" opacity="0.4" />
        <rect x="368" y="144" width="6" height="4" fill={p.neon2} opacity="0.15" />
        {/* Sign */}
        <rect x="280" y="115" width="80" height="11" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="124" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.8" shapeRendering="auto">GYM</text>
      </g>
    );
    case "heroes": return (
      <g>
        {/* Barracks */}
        <rect x="230" y="120" width="180" height="72" fill={p.buildingDark} />
        {/* Deployment pods */}
        <rect x="252" y="132" width="26" height="40" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.4" />
        <rect x="258" y="140" width="14" height="22" fill={p.neon1} opacity="0.06" />
        <rect x="262" y="146" width="6" height="12" fill={p.neon1} opacity="0.15" />
        <rect x="295" y="132" width="26" height="40" fill={p.building} stroke={p.neon2} strokeWidth="1" opacity="0.4" />
        <rect x="301" y="140" width="14" height="22" fill={p.neon2} opacity="0.06" />
        <rect x="305" y="146" width="6" height="12" fill={p.neon2} opacity="0.15" />
        <rect x="338" y="132" width="26" height="40" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.4" />
        <rect x="344" y="140" width="14" height="22" fill={p.neon1} opacity="0.06" />
        <rect x="348" y="146" width="6" height="12" fill={p.neon1} opacity="0.15" />
        <rect x="381" y="132" width="26" height="40" fill={p.building} stroke={p.neon2} strokeWidth="1" opacity="0.3" />
        {/* Status lights */}
        <rect x="262" y="134" width="4" height="3" fill={p.neon1} opacity="0.6" />
        <rect x="305" y="134" width="4" height="3" fill={p.neon2} opacity="0.6" />
        <rect x="348" y="134" width="4" height="3" fill={p.neon1} opacity="0.6" />
        <rect x="391" y="134" width="4" height="3" fill={p.neon2} opacity="0.3" />
        {/* Sign */}
        <text x="320" y="116" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">HERO BAY</text>
      </g>
    );
    case "house": return (
      <g>
        {/* Quarters */}
        <rect x="260" y="128" width="120" height="64" fill={p.buildingDark} />
        {/* Command desk */}
        <rect x="280" y="160" width="80" height="8" fill={p.building} />
        <rect x="280" y="158" width="80" height="2" fill={p.neon1} opacity="0.2" />
        {/* Holo portrait frame */}
        <rect x="296" y="134" width="28" height="24" fill={p.neon1} opacity="0.05" stroke={p.neon1} strokeWidth="1" />
        <rect x="304" y="140" width="12" height="14" fill={p.neon1} opacity="0.1" />
        <rect x="308" y="142" width="4" height="4" fill={p.neon1} opacity="0.2" />
        <rect x="306" y="148" width="8" height="6" fill={p.neon1} opacity="0.15" />
        {/* Screen */}
        <rect x="270" y="162" width="16" height="10" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="354" y="162" width="16" height="10" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="0.5" />
        {/* Sign */}
        <text x="320" y="124" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.5" shapeRendering="auto">QUARTERS</text>
      </g>
    );
    case "inventory": return (
      <g>
        {/* Gear locker room */}
        <rect x="250" y="125" width="140" height="67" fill={p.buildingDark} />
        {/* Weapon racks */}
        <rect x="265" y="132" width="4" height="40" fill={p.building} />
        <rect x="260" y="138" width="14" height="3" fill={p.building} />
        <rect x="260" y="148" width="14" height="3" fill={p.building} />
        <rect x="260" y="158" width="14" height="3" fill={p.building} />
        {/* Shelves */}
        <rect x="290" y="140" width="80" height="3" fill={p.building} />
        <rect x="290" y="155" width="80" height="3" fill={p.building} />
        {/* Items on shelves */}
        <rect x="295" y="132" width="8" height="8" fill={p.neon1} opacity="0.2" />
        <rect x="310" y="134" width="6" height="6" fill={p.neon2} opacity="0.25" />
        <rect x="325" y="130" width="10" height="10" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="345" y="132" width="8" height="8" fill={p.neon2} opacity="0.2" />
        <rect x="295" y="147" width="6" height="8" fill={p.neon1} opacity="0.25" />
        <rect x="310" y="145" width="10" height="10" fill={p.neon2} opacity="0.15" />
        <rect x="330" y="148" width="8" height="7" fill={p.neon1} opacity="0.2" />
        <rect x="348" y="146" width="10" height="9" fill={p.neon2} opacity="0.15" />
        {/* Sign */}
        <rect x="280" y="115" width="80" height="11" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <text x="320" y="124" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.75" shapeRendering="auto">GEAR</text>
      </g>
    );
    case "lobby": return (
      <g>
        {/* Command centre */}
        <rect x="220" y="118" width="200" height="74" fill={p.buildingDark} />
        {/* Large central screen */}
        <rect x="270" y="126" width="100" height="40" fill={p.neon1} opacity="0.04" stroke={p.neon1} strokeWidth="1" />
        <rect x="278" y="134" width="84" height="2" fill={p.neon1} opacity="0.35" />
        <rect x="278" y="140" width="60" height="2" fill={p.neon2} opacity="0.25" />
        <rect x="278" y="146" width="72" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="278" y="152" width="50" height="2" fill={p.neon2} opacity="0.2" />
        <rect x="278" y="158" width="80" height="2" fill={p.neon1} opacity="0.25" />
        {/* Side screens */}
        <rect x="232" y="130" width="30" height="22" fill={p.neon2} opacity="0.04" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="378" y="130" width="30" height="22" fill={p.neon2} opacity="0.04" stroke={p.neon2} strokeWidth="0.5" />
        {/* Console desk */}
        <rect x="260" y="170" width="120" height="8" fill={p.building} />
        <rect x="260" y="168" width="120" height="2" fill={p.neon1} opacity="0.15" />
        {/* Sign */}
        <text x="320" y="122" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.5" shapeRendering="auto">COMMAND</text>
      </g>
    );
    case "chat": return (
      <g>
        {/* Comms tower building */}
        <rect x="260" y="125" width="120" height="67" fill={p.buildingDark} />
        {/* Antenna dishes */}
        <path d="M300 118 Q310 105 320 118" fill="none" stroke={p.neon1} strokeWidth="1.5" opacity="0.5" shapeRendering="auto" />
        <rect x="308" y="110" width="4" height="8" fill={p.building} />
        <rect x="306" y="108" width="8" height="4" fill={p.neon1} opacity="0.3" />
        <path d="M340 120 Q348 110 356 120" fill="none" stroke={p.neon2} strokeWidth="1" opacity="0.4" shapeRendering="auto" />
        <rect x="346" y="114" width="4" height="6" fill={p.building} />
        {/* Radio panels */}
        <rect x="275" y="140" width="28" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="1" />
        <rect x="279" y="144" width="20" height="2" fill={p.neon1} opacity="0.4" />
        <rect x="279" y="150" width="14" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="315" y="138" width="28" height="20" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="1" />
        <rect x="319" y="142" width="20" height="2" fill={p.neon2} opacity="0.4" />
        <rect x="319" y="148" width="16" height="2" fill={p.neon2} opacity="0.3" />
        <rect x="355" y="140" width="20" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="0.5" />
        {/* Signal waves */}
        <circle cx="310" cy="105" r="8" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity="0.2" strokeDasharray="2 2" shapeRendering="auto" />
        <circle cx="310" cy="105" r="14" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity="0.12" strokeDasharray="2 3" shapeRendering="auto" />
        {/* Sign */}
        <text x="320" y="132" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">COMMS</text>
      </g>
    );
    case "boards": return (
      <g>
        {/* Board wall */}
        <rect x="250" y="125" width="140" height="67" fill={p.buildingDark} />
        {/* Pinned notes */}
        <rect x="264" y="134" width="22" height="16" fill={p.neon1} opacity="0.1" stroke={p.neon1} strokeWidth="1" />
        <rect x="268" y="138" width="14" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="268" y="143" width="10" height="2" fill={p.neon1} opacity="0.25" />
        <rect x="294" y="132" width="26" height="20" fill={p.neon2} opacity="0.1" stroke={p.neon2} strokeWidth="1" />
        <rect x="298" y="136" width="18" height="2" fill={p.neon2} opacity="0.35" />
        <rect x="298" y="142" width="12" height="2" fill={p.neon2} opacity="0.25" />
        <rect x="298" y="146" width="16" height="2" fill={p.neon2} opacity="0.2" />
        <rect x="330" y="134" width="20" height="18" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="334" y="138" width="12" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="334" y="144" width="8" height="2" fill={p.neon1} opacity="0.2" />
        <rect x="358" y="130" width="18" height="14" fill={p.neon2} opacity="0.08" stroke={p.neon2} strokeWidth="1" />
        <rect x="362" y="134" width="10" height="2" fill={p.neon2} opacity="0.3" />
        {/* Second row */}
        <rect x="270" y="156" width="24" height="14" fill={p.neon2} opacity="0.08" stroke={p.neon2} strokeWidth="1" />
        <rect x="302" y="158" width="20" height="12" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="332" y="156" width="26" height="14" fill={p.neon2} opacity="0.1" stroke={p.neon2} strokeWidth="1" />
        {/* Pins */}
        <rect x="274" y="133" width="3" height="3" fill={p.neon1} opacity="0.5" />
        <rect x="306" y="131" width="3" height="3" fill={p.neon2} opacity="0.5" />
        <rect x="339" y="133" width="3" height="3" fill={p.neon1} opacity="0.5" />
        {/* Sign */}
        <text x="320" y="122" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">BOARDS</text>
      </g>
    );
    case "primaris": return (
      <g>
        {/* Central hub building */}
        <rect x="240" y="110" width="160" height="82" fill={p.buildingDark} />
        <rect x="240" y="110" width="160" height="3" fill={p.neon1} opacity="0.3" />
        {/* Dome */}
        <path d="M280 110 L320 84 L360 110" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity="0.4" />
        <circle cx="320" cy="96" r="6" fill={p.neon1} opacity="0.15" stroke={p.neon1} strokeWidth="1" shapeRendering="auto" />
        {/* District markers */}
        <rect x="210" y="145" width="20" height="20" fill={p.neon1} opacity="0.08" stroke={p.neon1} strokeWidth="1" />
        <rect x="214" y="152" width="12" height="2" fill={p.neon1} opacity="0.3" />
        <rect x="410" y="145" width="20" height="20" fill={p.neon2} opacity="0.08" stroke={p.neon2} strokeWidth="1" />
        <rect x="414" y="152" width="12" height="2" fill={p.neon2} opacity="0.3" />
        {/* Pathways */}
        <rect x="230" y="155" width="10" height="2" fill={p.neon1} opacity="0.15" />
        <rect x="400" y="155" width="10" height="2" fill={p.neon2} opacity="0.15" />
        {/* Holo-map in centre */}
        <rect x="290" y="128" width="60" height="36" fill={p.neon1} opacity="0.04" stroke={p.neon1} strokeWidth="1" />
        <rect x="296" y="134" width="8" height="8" fill={p.neon1} opacity="0.15" />
        <rect x="310" y="138" width="6" height="6" fill={p.neon2} opacity="0.15" />
        <rect x="322" y="132" width="10" height="10" fill={p.neon1} opacity="0.1" />
        <rect x="336" y="140" width="8" height="8" fill={p.neon2} opacity="0.1" />
        {/* Sign */}
        <text x="320" y="80" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">PRIMARIS</text>
      </g>
    );
    case "station": return (
      <g>
        {/* Central station hub */}
        <rect x="230" y="110" width="180" height="82" fill={p.buildingDark} />
        <rect x="230" y="110" width="180" height="3" fill={p.neon1} opacity="0.3" />
        {/* Tower */}
        <rect x="308" y="75" width="24" height="35" fill={p.building} />
        <rect x="314" y="68" width="12" height="7" fill={p.building} />
        <rect x="318" y="64" width="4" height="4" fill={p.neon1} opacity="0.6" />
        {/* Antenna */}
        <rect x="319" y="56" width="2" height="8" fill={p.building} />
        <rect x="315" y="56" width="10" height="2" fill={p.building} />
        {/* District tiles */}
        <rect x="248" y="125" width="28" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="284" y="125" width="28" height="18" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="320" y="125" width="28" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="356" y="125" width="28" height="18" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="248" y="150" width="28" height="18" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="284" y="150" width="28" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="320" y="150" width="28" height="18" fill={p.neon2} opacity="0.06" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="356" y="150" width="28" height="18" fill={p.neon1} opacity="0.06" stroke={p.neon1} strokeWidth="0.5" />
        {/* Sign */}
        <text x="320" y="72" textAnchor="middle" fill={p.neon1} fontSize="6" fontFamily="monospace" fontWeight="bold" opacity="0.6" shapeRendering="auto">NULL STN</text>
      </g>
    );
    default: return null;
  }
}

/* ── Main Component ──────────────────────────────────── */
export function PixelBanner({ scene, title, subtitle, accentColor, children }: PixelBannerProps) {
  const p = PALETTES[scene] ?? PALETTES["station"];
  const borderColor = accentColor ?? p.accent;

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl" style={{ borderWidth: 1, borderStyle: "solid", borderColor: `${borderColor}40` }}>
        <svg viewBox="0 0 640 220" className="w-full h-auto block" shapeRendering="crispEdges">
          <defs>
            <linearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.sky1}/>
              <stop offset="45%" stopColor={p.sky2}/>
              <stop offset="80%" stopColor={p.sky3}/>
              <stop offset="100%" stopColor={p.sky2}/>
            </linearGradient>
            <clipPath id={`sun-${scene}`}>
              <circle cx="320" cy="155" r="55"/>
            </clipPath>
          </defs>

          {/* Sky */}
          <rect width="640" height="220" fill={`url(#sky-${scene})`}/>

          {/* Stars */}
          <g>
            <rect x="45" y="10" width="2" height="2" fill="#fff" opacity="0.6"/>
            <rect x="92" y="25" width="2" height="2" fill={p.neon1} opacity="0.4"/>
            <rect x="148" y="6" width="2" height="2" fill="#fff" opacity="0.7"/>
            <rect x="195" y="38" width="1" height="1" fill={p.neon2} opacity="0.4"/>
            <rect x="265" y="14" width="2" height="2" fill="#fff" opacity="0.5"/>
            <rect x="358" y="22" width="1" height="1" fill={p.neon1} opacity="0.3"/>
            <rect x="405" y="8" width="2" height="2" fill={p.neon2} opacity="0.5"/>
            <rect x="462" y="28" width="2" height="2" fill="#fff" opacity="0.5"/>
            <rect x="510" y="12" width="1" height="1" fill="#fff" opacity="0.6"/>
            <rect x="555" y="32" width="2" height="2" fill={p.neon1} opacity="0.3"/>
            <rect x="588" y="6" width="2" height="2" fill="#fff" opacity="0.7"/>
            <rect x="30" y="45" width="1" height="1" fill={p.neon2} opacity="0.3"/>
            <rect x="490" y="48" width="1" height="1" fill={p.neon2} opacity="0.3"/>
            {/* Cross sparkle */}
            <rect x="330" y="3" width="6" height="1" fill="#fff" opacity="0.8"/>
            <rect x="332" y="1" width="1" height="6" fill="#fff" opacity="0.8"/>
          </g>

          {/* Sun */}
          <g clipPath={`url(#sun-${scene})`}>
            <rect x="265" y="100" width="110" height="8" fill={p.sun} opacity="0.7"/>
            <rect x="265" y="112" width="110" height="7" fill={p.sun} opacity="0.6"/>
            <rect x="265" y="123" width="110" height="6" fill={p.sun} opacity="0.5"/>
            <rect x="265" y="133" width="110" height="5" fill={p.sun} opacity="0.4"/>
            <rect x="265" y="142" width="110" height="5" fill={p.sun} opacity="0.32"/>
            <rect x="265" y="151" width="110" height="4" fill={p.sun} opacity="0.24"/>
            <rect x="265" y="159" width="110" height="4" fill={p.sun} opacity="0.18"/>
            <rect x="265" y="167" width="110" height="3" fill={p.sun} opacity="0.12"/>
            <rect x="265" y="174" width="110" height="3" fill={p.sun} opacity="0.08"/>
          </g>

          {/* Haze */}
          <rect x="0" y="135" width="640" height="2" fill={p.sky3} opacity="0.4"/>
          <rect x="80" y="145" width="200" height="2" fill={p.sky3} opacity="0.3"/>
          <rect x="400" y="142" width="180" height="2" fill={p.sky3} opacity="0.25"/>

          {/* Back buildings */}
          <g fill={p.building}>
            <rect x="20" y="120" width="40" height="100"/>
            <rect x="80" y="110" width="36" height="110"/>
            <rect x="140" y="118" width="32" height="102"/>
            <rect x="440" y="115" width="36" height="105"/>
            <rect x="500" y="120" width="30" height="100"/>
            <rect x="560" y="112" width="40" height="108"/>
            <rect x="610" y="125" width="30" height="95"/>
          </g>

          {/* Mid buildings */}
          <g fill={p.buildingDark}>
            <rect x="0" y="140" width="55" height="80"/>
            <rect x="60" y="128" width="35" height="92"/>
            <rect x="100" y="118" width="40" height="102"/>
            <rect x="150" y="132" width="30" height="88"/>
            <rect x="185" y="125" width="35" height="95"/>
            <rect x="430" y="122" width="35" height="98"/>
            <rect x="470" y="130" width="30" height="90"/>
            <rect x="505" y="118" width="40" height="102"/>
            <rect x="555" y="128" width="30" height="92"/>
            <rect x="590" y="135" width="50" height="85"/>
          </g>

          {/* Windows on background buildings */}
          <g>
            <rect x="30" y="130" width="3" height="3" fill={p.neon1} opacity="0.5"/>
            <rect x="38" y="138" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="30" y="148" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="90" y="120" width="3" height="3" fill={p.neon2} opacity="0.5"/>
            <rect x="100" y="130" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="90" y="142" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="12" y="148" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="22" y="158" width="3" height="3" fill={p.neon1} opacity="0.3"/>
            <rect x="68" y="136" width="3" height="3" fill={p.neon2} opacity="0.5"/>
            <rect x="76" y="146" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="112" y="126" width="3" height="3" fill={p.neon2} opacity="0.5"/>
            <rect x="122" y="134" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="112" y="144" width="3" height="3" fill={p.neon2} opacity="0.3"/>
            <rect x="160" y="140" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="168" y="150" width="3" height="3" fill={p.neon2} opacity="0.3"/>
            <rect x="195" y="134" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="205" y="144" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="448" y="130" width="3" height="3" fill={p.neon1} opacity="0.5"/>
            <rect x="456" y="140" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="448" y="150" width="3" height="3" fill={p.neon1} opacity="0.3"/>
            <rect x="480" y="138" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="515" y="126" width="3" height="3" fill={p.neon1} opacity="0.5"/>
            <rect x="525" y="136" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="515" y="148" width="3" height="3" fill={p.neon1} opacity="0.3"/>
            <rect x="565" y="136" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="600" y="142" width="3" height="3" fill={p.neon2} opacity="0.4"/>
            <rect x="618" y="135" width="3" height="3" fill={p.neon1} opacity="0.4"/>
            <rect x="626" y="148" width="3" height="3" fill={p.neon2} opacity="0.3"/>
          </g>

          {/* Scene-specific centre elements */}
          <SceneDetails scene={scene} p={p} />

          {/* Ground */}
          <rect x="0" y="192" width="640" height="28" fill={p.buildingDark}/>
          <rect x="0" y="192" width="640" height="2" fill={p.accent} opacity="0.15"/>
        </svg>

        {/* Text overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-3.5 pt-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-[0.15em] drop-shadow-lg" style={{ color: `${borderColor}cc`, textShadow: `0 0 16px ${borderColor}55` }}>{title}</h1>
              {subtitle && <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>}
            </div>
            {children && <div className="hidden sm:block text-right">{children}</div>}
          </div>
        </div>
      </div>
      {/* Mobile slot for children */}
      {children && (
        <div className="sm:hidden rounded-md bg-[#0b0f14] px-4 py-2.5 flex items-center justify-between" style={{ borderWidth: 1, borderStyle: "solid", borderColor: `${borderColor}30` }}>
          {children}
        </div>
      )}
    </div>
  );
}
