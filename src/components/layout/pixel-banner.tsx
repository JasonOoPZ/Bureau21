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
type Pal = { sky1: string; sky2: string; sky3: string; sun: string; neon1: string; neon2: string; building: string; buildingDark: string; accent: string };
const PALETTES: Record<string, Pal> = {
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
  "training-grounds": { sky1: "#0a0408", sky2: "#1a0818", sky3: "#2a1028", sun: "#ef4444", neon1: "#ef4444", neon2: "#f59e0b", building: "#140818", buildingDark: "#0a0410", accent: "#ef4444" },
  "fishing-hut":      { sky1: "#02080f", sky2: "#041830", sky3: "#062848", sun: "#38bdf8", neon1: "#38bdf8", neon2: "#22d3ee", building: "#081828", buildingDark: "#040c18", accent: "#38bdf8" },
  "fight-pit":        { sky1: "#0f0204", sky2: "#280810", sky3: "#3a0c18", sun: "#ef4444", neon1: "#ef4444", neon2: "#dc2626", building: "#200810", buildingDark: "#0c0408", accent: "#ef4444" },
  "lounge":           { sky1: "#08040f", sky2: "#180c30", sky3: "#281850", sun: "#c084fc", neon1: "#c084fc", neon2: "#ec4899", building: "#140828", buildingDark: "#08040c", accent: "#c084fc" },
  "exploration-bay":  { sky1: "#04060f", sky2: "#081028", sky3: "#0c1840", sun: "#3b82f6", neon1: "#3b82f6", neon2: "#22d3ee", building: "#0a1420", buildingDark: "#040a14", accent: "#3b82f6" },
  "info-broker":      { sky1: "#06040f", sky2: "#100830", sky3: "#1c1050", sun: "#8b5cf6", neon1: "#8b5cf6", neon2: "#22d3ee", building: "#100828", buildingDark: "#080418", accent: "#8b5cf6" },
  "smugglers-den":    { sky1: "#06040a", sky2: "#0c0818", sky3: "#161028", sun: "#6366f1", neon1: "#6366f1", neon2: "#f59e0b", building: "#0c0818", buildingDark: "#060410", accent: "#6366f1" },
  "mining-rig":       { sky1: "#0a0604", sky2: "#1a1008", sky3: "#2a1810", sun: "#f59e0b", neon1: "#f59e0b", neon2: "#ef4444", building: "#181008", buildingDark: "#0a0804", accent: "#f59e0b" },
  "outpost":          { sky1: "#060808", sky2: "#0c1418", sky3: "#142028", sun: "#94a3b8", neon1: "#94a3b8", neon2: "#22d3ee", building: "#0c1418", buildingDark: "#060a10", accent: "#94a3b8" },
  "refinery":         { sky1: "#0a0604", sky2: "#1a1008", sky3: "#2a1810", sun: "#f97316", neon1: "#f97316", neon2: "#fbbf24", building: "#181008", buildingDark: "#0c0804", accent: "#f97316" },
  "salvage-yard":     { sky1: "#080804", sky2: "#141408", sky3: "#202010", sun: "#a3e635", neon1: "#a3e635", neon2: "#fbbf24", building: "#141408", buildingDark: "#0a0a04", accent: "#a3e635" },
  "pawn-shop":        { sky1: "#0a0604", sky2: "#1a1008", sky3: "#2a1810", sun: "#fbbf24", neon1: "#fbbf24", neon2: "#f59e0b", building: "#181008", buildingDark: "#0a0804", accent: "#fbbf24" },
  "tattoo-parlor":    { sky1: "#0a040f", sky2: "#1a0830", sky3: "#2a1050", sun: "#ec4899", neon1: "#ec4899", neon2: "#a855f7", building: "#140828", buildingDark: "#0a0418", accent: "#ec4899" },
  "university":       { sky1: "#040608", sky2: "#081020", sky3: "#0c1838", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#3b82f6", building: "#081020", buildingDark: "#040810", accent: "#22d3ee" },
  "bank":             { sky1: "#04080a", sky2: "#081418", sky3: "#0c2028", sun: "#fbbf24", neon1: "#fbbf24", neon2: "#10b981", building: "#0c1818", buildingDark: "#060c10", accent: "#fbbf24" },
  "battle":           { sky1: "#0f0408", sky2: "#200818", sky3: "#381028", sun: "#ef4444", neon1: "#ef4444", neon2: "#f97316", building: "#180818", buildingDark: "#0c0410", accent: "#ef4444" },
  "gym":              { sky1: "#0a0604", sky2: "#181008", sky3: "#281810", sun: "#f97316", neon1: "#f97316", neon2: "#ef4444", building: "#181008", buildingDark: "#0c0804", accent: "#f97316" },
  "heroes":           { sky1: "#04060f", sky2: "#081028", sky3: "#0c1840", sun: "#60a5fa", neon1: "#60a5fa", neon2: "#22d3ee", building: "#0a1420", buildingDark: "#040a14", accent: "#60a5fa" },
  "house":            { sky1: "#060608", sky2: "#0c0c18", sky3: "#141428", sun: "#94a3b8", neon1: "#94a3b8", neon2: "#c084fc", building: "#0c0c18", buildingDark: "#060610", accent: "#94a3b8" },
  "inventory":        { sky1: "#060808", sky2: "#0c1418", sky3: "#142028", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#10b981", building: "#0c1418", buildingDark: "#060a10", accent: "#22d3ee" },
  "lobby":            { sky1: "#08010f", sky2: "#0c1830", sky3: "#162850", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#7b2fff", building: "#0a1a2a", buildingDark: "#060e18", accent: "#22d3ee" },
  "chat":             { sky1: "#040608", sky2: "#081020", sky3: "#0c1838", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#3b82f6", building: "#081020", buildingDark: "#040810", accent: "#22d3ee" },
  "boards":           { sky1: "#060608", sky2: "#0c0c18", sky3: "#141428", sun: "#a855f7", neon1: "#a855f7", neon2: "#ec4899", building: "#0c0c18", buildingDark: "#060610", accent: "#a855f7" },
  "primaris":         { sky1: "#08010f", sky2: "#0c1830", sky3: "#162850", sun: "#22d3ee", neon1: "#22d3ee", neon2: "#a855f7", building: "#0a1a2a", buildingDark: "#060e18", accent: "#22d3ee" },
};

/* ── Window grid helper ───────────────────────────────── */
function Windows({ x, y, cols, rows, size, gap, c1, c2 }: { x: number; y: number; cols: number; rows: number; size: number; gap: number; c1: string; c2: string }) {
  const rects = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fill = (r + c) % 3 === 0 ? c2 : c1;
      const op = 0.2 + Math.abs(Math.sin((r * cols + c) * 2.7)) * 0.4;
      rects.push(<rect key={`${r}-${c}`} x={x + c * (size + gap)} y={y + r * (size + gap)} width={size} height={size} fill={fill} opacity={op} />);
    }
  }
  return <>{rects}</>;
}

/* ── Neon sign helper ─────────────────────────────────── */
function NeonSign({ x, y, w, h, text, color, glow }: { x: number; y: number; w: number; h: number; text: string; color: string; glow?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} opacity={glow ?? 0.12} rx="1" />
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={color} strokeWidth="1" opacity={0.7} rx="1" />
      <text x={x + w / 2} y={y + h - 3} textAnchor="middle" fill={color} fontSize={Math.min(h - 2, 7)} fontFamily="monospace" fontWeight="bold" opacity={0.95} shapeRendering="auto">{text}</text>
      {/* Glow bleed */}
      <rect x={x - 2} y={y + h} width={w + 4} height={4} fill={color} opacity={0.06} />
    </g>
  );
}

/* ── Searchlight beam ─────────────────────────────────── */
function Searchlight({ x, y, angle, color, length }: { x: number; y: number; angle: number; color: string; length?: number }) {
  const len = length ?? 80;
  const rad = (angle * Math.PI) / 180;
  const x2 = x + Math.sin(rad) * len;
  const y2 = y - Math.cos(rad) * len;
  const spread = 12;
  const x3 = x + Math.sin(rad + 0.15) * len;
  const y3 = y - Math.cos(rad + 0.15) * len;
  return (
    <g>
      <polygon points={`${x},${y} ${x2 - spread},${y2} ${x3 + spread},${y3}`} fill={color} opacity={0.04} />
      <line x1={x} y1={y} x2={(x2 + x3) / 2} y2={(y2 + y3) / 2} stroke={color} strokeWidth="1" opacity={0.08} shapeRendering="auto" />
    </g>
  );
}

/* ── Antenna/rooftop detail ────────────────────────────── */
function Antenna({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width="2" height="12" fill={color} opacity={0.4} />
      <rect x={x - 3} y={y} width="8" height="2" fill={color} opacity={0.3} />
      <rect x={x} y={y - 2} width="2" height="2" fill={color} opacity={0.7} />
    </g>
  );
}

function SatDish({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <path d={`M${x} ${y + 6} Q${x + 5} ${y - 2} ${x + 10} ${y + 6}`} fill="none" stroke={color} strokeWidth="1.5" opacity={0.35} shapeRendering="auto" />
      <rect x={x + 4} y={y + 4} width="2" height="6" fill={color} opacity={0.3} />
    </g>
  );
}

/* ── Building block helper ─────────────────────────────── */
function Building({ x, y, w, h, color, windowColor1, windowColor2, windowCols, windowRows, windowSize, rooftop, neonSign, neonColor }: {
  x: number; y: number; w: number; h: number; color: string;
  windowColor1?: string; windowColor2?: string; windowCols?: number; windowRows?: number; windowSize?: number;
  rooftop?: "antenna" | "dish" | "tower" | "none"; neonSign?: string; neonColor?: string;
}) {
  const wc = windowCols ?? Math.floor(w / 8);
  const wr = windowRows ?? Math.floor(h / 10);
  const ws = windowSize ?? 3;
  const wg = Math.max(2, Math.floor((w - wc * ws) / (wc + 1)));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} />
      {/* Top edge highlight */}
      <rect x={x} y={y} width={w} height="1" fill="#fff" opacity={0.04} />
      {/* Windows */}
      {windowColor1 && <Windows x={x + wg} y={y + 4} cols={wc} rows={wr} size={ws} gap={wg} c1={windowColor1} c2={windowColor2 ?? windowColor1} />}
      {/* Rooftop */}
      {rooftop === "antenna" && <Antenna x={x + w / 2} y={y - 12} color={windowColor1 ?? "#fff"} />}
      {rooftop === "dish" && <SatDish x={x + w / 2 - 5} y={y - 10} color={windowColor1 ?? "#fff"} />}
      {rooftop === "tower" && (
        <g>
          <rect x={x + w / 2 - 4} y={y - 18} width="8" height="18" fill={color} />
          <rect x={x + w / 2 - 1} y={y - 22} width="2" height="4" fill={windowColor1 ?? "#fff"} opacity={0.6} />
        </g>
      )}
      {/* Neon sign on building */}
      {neonSign && <NeonSign x={x + 3} y={y + h * 0.3} w={w - 6} h={10} text={neonSign} color={neonColor ?? windowColor1 ?? "#fff"} />}
    </g>
  );
}

/* ── Atmosphere: nebula glow / haze layers ─────────────── */
function Atmosphere({ p }: { p: Pal }) {
  return (
    <g>
      {/* Nebula clouds */}
      <ellipse cx="120" cy="50" rx="80" ry="30" fill={p.neon1} opacity={0.025} shapeRendering="auto" />
      <ellipse cx="500" cy="40" rx="100" ry="25" fill={p.neon2} opacity={0.02} shapeRendering="auto" />
      <ellipse cx="320" cy="80" rx="60" ry="20" fill={p.sun} opacity={0.015} shapeRendering="auto" />
      {/* Horizon haze lines */}
      <rect x="0" y="130" width="640" height="2" fill={p.sky3} opacity={0.4} />
      <rect x="0" y="134" width="640" height="1" fill={p.neon1} opacity={0.06} />
      <rect x="50" y="140" width="540" height="2" fill={p.sky3} opacity={0.25} />
      <rect x="0" y="148" width="640" height="1" fill={p.neon2} opacity={0.04} />
      {/* Light pollution glow from below */}
      <rect x="0" y="180" width="640" height="40" fill={p.neon1} opacity={0.02} />
      <rect x="200" y="175" width="240" height="45" fill={p.neon2} opacity={0.015} />
    </g>
  );
}

/* ── Dense starfield ───────────────────────────────────── */
function Stars({ p }: { p: Pal }) {
  return (
    <g>
      {/* Layer 1 — bright stars */}
      <rect x="15" y="8" width="2" height="2" fill="#fff" opacity={0.7} />
      <rect x="52" y="22" width="2" height="2" fill="#fff" opacity={0.6} />
      <rect x="95" y="5" width="2" height="2" fill="#fff" opacity={0.8} />
      <rect x="130" y="35" width="2" height="2" fill="#fff" opacity={0.5} />
      <rect x="188" y="12" width="2" height="2" fill="#fff" opacity={0.7} />
      <rect x="235" y="28" width="2" height="2" fill="#fff" opacity={0.6} />
      <rect x="278" y="8" width="2" height="2" fill="#fff" opacity={0.7} />
      <rect x="362" y="15" width="2" height="2" fill="#fff" opacity={0.65} />
      <rect x="410" y="5" width="2" height="2" fill="#fff" opacity={0.8} />
      <rect x="458" y="30" width="2" height="2" fill="#fff" opacity={0.55} />
      <rect x="508" y="10" width="2" height="2" fill="#fff" opacity={0.75} />
      <rect x="555" y="25" width="2" height="2" fill="#fff" opacity={0.6} />
      <rect x="595" y="8" width="2" height="2" fill="#fff" opacity={0.7} />
      <rect x="625" y="18" width="2" height="2" fill="#fff" opacity={0.5} />
      {/* Layer 2 — colored stars */}
      <rect x="38" y="42" width="1" height="1" fill={p.neon1} opacity={0.4} />
      <rect x="108" y="18" width="1" height="1" fill={p.neon2} opacity={0.4} />
      <rect x="162" y="48" width="1" height="1" fill={p.neon1} opacity={0.35} />
      <rect x="210" y="8" width="1" height="1" fill={p.neon2} opacity={0.45} />
      <rect x="305" y="38" width="1" height="1" fill={p.neon1} opacity={0.35} />
      <rect x="388" y="42" width="1" height="1" fill={p.neon2} opacity={0.3} />
      <rect x="432" y="20" width="1" height="1" fill={p.neon1} opacity={0.4} />
      <rect x="485" y="45" width="1" height="1" fill={p.neon2} opacity={0.35} />
      <rect x="538" y="15" width="1" height="1" fill={p.neon1} opacity={0.4} />
      <rect x="580" y="40" width="1" height="1" fill={p.neon2} opacity={0.35} />
      {/* Layer 3 — tiny faint dots */}
      <rect x="22" y="55" width="1" height="1" fill="#fff" opacity={0.25} />
      <rect x="75" y="48" width="1" height="1" fill="#fff" opacity={0.2} />
      <rect x="145" y="58" width="1" height="1" fill="#fff" opacity={0.22} />
      <rect x="248" y="52" width="1" height="1" fill="#fff" opacity={0.2} />
      <rect x="340" y="48" width="1" height="1" fill="#fff" opacity={0.25} />
      <rect x="470" y="55" width="1" height="1" fill="#fff" opacity={0.2} />
      <rect x="560" y="50" width="1" height="1" fill="#fff" opacity={0.22} />
      <rect x="610" y="45" width="1" height="1" fill="#fff" opacity={0.18} />
      {/* Cross-sparkle star */}
      <rect x="330" y="3" width="6" height="1" fill="#fff" opacity={0.9} />
      <rect x="332" y="1" width="2" height="6" fill="#fff" opacity={0.9} />
      <rect x="331" y="2" width="4" height="4" fill="#fff" opacity={0.15} />
      {/* Second sparkle */}
      <rect x="88" y="12" width="4" height="1" fill={p.neon1} opacity={0.5} />
      <rect x="89" y="11" width="2" height="4" fill={p.neon1} opacity={0.5} />
    </g>
  );
}

/* ── Layered cityscape background (far) ────────────────── */
function FarCity({ p }: { p: Pal }) {
  return (
    <g>
      {/* Far distant silhouettes - very dark, minimal detail */}
      <rect x="0" y="108" width="32" height="112" fill={p.building} opacity={0.5} />
      <rect x="35" y="98" width="25" height="122" fill={p.building} opacity={0.45} />
      <rect x="65" y="105" width="20" height="115" fill={p.building} opacity={0.5} />
      <rect x="90" y="95" width="30" height="125" fill={p.building} opacity={0.45} />
      <rect x="125" y="102" width="22" height="118" fill={p.building} opacity={0.5} />
      <rect x="150" y="112" width="18" height="108" fill={p.building} opacity={0.45} />
      {/* Right side */}
      <rect x="465" y="100" width="25" height="120" fill={p.building} opacity={0.45} />
      <rect x="495" y="108" width="30" height="112" fill={p.building} opacity={0.5} />
      <rect x="530" y="95" width="22" height="125" fill={p.building} opacity={0.45} />
      <rect x="555" y="105" width="28" height="115" fill={p.building} opacity={0.5} />
      <rect x="588" y="110" width="22" height="110" fill={p.building} opacity={0.45} />
      <rect x="615" y="102" width="25" height="118" fill={p.building} opacity={0.5} />
      {/* Distant window twinkles */}
      {[18,48,78,100,135,478,508,542,568,598,625].map((wx, i) => (
        <rect key={`fw${i}`} x={wx} y={110 + (i * 7) % 20} width="2" height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.15 + (i % 3) * 0.08} />
      ))}
    </g>
  );
}

/* ── Layered cityscape background (mid) ────────────────── */
function MidCity({ p }: { p: Pal }) {
  return (
    <g>
      {/* Left cluster */}
      <Building x={-5} y={125} w={50} h={95} color={p.buildingDark} windowColor1={p.neon1} windowColor2={p.neon2} windowCols={4} windowRows={6} windowSize={3} rooftop="antenna" />
      <Building x={50} y={115} w={40} h={105} color={p.building} windowColor1={p.neon2} windowColor2={p.neon1} windowCols={3} windowRows={7} windowSize={3} rooftop="dish" />
      <Building x={95} y={108} w={35} h={112} color={p.buildingDark} windowColor1={p.neon1} windowColor2={p.neon2} windowCols={3} windowRows={8} windowSize={3} rooftop="tower" />
      <Building x={135} y={120} w={30} h={100} color={p.building} windowColor1={p.neon2} windowCols={2} windowRows={6} windowSize={3} />
      <Building x={168} y={112} w={38} h={108} color={p.buildingDark} windowColor1={p.neon1} windowColor2={p.neon2} windowCols={3} windowRows={7} windowSize={3} rooftop="antenna" />
      {/* Right cluster */}
      <Building x={435} y={118} w={35} h={102} color={p.building} windowColor1={p.neon1} windowColor2={p.neon2} windowCols={3} windowRows={7} windowSize={3} rooftop="dish" />
      <Building x={475} y={110} w={40} h={110} color={p.buildingDark} windowColor1={p.neon2} windowColor2={p.neon1} windowCols={3} windowRows={8} windowSize={3} rooftop="antenna" />
      <Building x={520} y={105} w={35} h={115} color={p.building} windowColor1={p.neon1} windowCols={3} windowRows={8} windowSize={3} rooftop="tower" />
      <Building x={560} y={115} w={30} h={105} color={p.buildingDark} windowColor1={p.neon2} windowColor2={p.neon1} windowCols={2} windowRows={7} windowSize={3} />
      <Building x={595} y={108} w={45} h={112} color={p.building} windowColor1={p.neon1} windowColor2={p.neon2} windowCols={4} windowRows={8} windowSize={3} rooftop="antenna" />
      {/* Neon signs on mid buildings */}
      <NeonSign x={55} y={135} w={30} h={9} text="NEON" color={p.neon1} />
      <NeonSign x={480} y={132} w={32} h={9} text="24HR" color={p.neon2} />
      {/* Rooftop lights */}
      {[10,70,110,150,450,500,540,580,620].map((lx, i) => (
        <rect key={`rl${i}`} x={lx} y={[125,115,108,120,118,110,105,115,108][i] - 2} width="3" height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.35} />
      ))}
    </g>
  );
}

/* ── Ground / street details ───────────────────────────── */
function Ground({ p }: { p: Pal }) {
  return (
    <g>
      <rect x="0" y="192" width="640" height="28" fill={p.buildingDark} />
      <rect x="0" y="192" width="640" height="2" fill={p.accent} opacity={0.2} />
      <rect x="0" y="193" width="640" height="1" fill={p.neon1} opacity={0.06} />
      {/* Street markings */}
      <rect x="30" y="198" width="20" height="2" fill={p.neon1} opacity={0.04} />
      <rect x="100" y="198" width="20" height="2" fill={p.neon1} opacity={0.04} />
      <rect x="200" y="198" width="20" height="2" fill={p.neon1} opacity={0.04} />
      <rect x="320" y="198" width="20" height="2" fill={p.neon1} opacity={0.04} />
      <rect x="440" y="198" width="20" height="2" fill={p.neon1} opacity={0.04} />
      <rect x="540" y="198" width="20" height="2" fill={p.neon1} opacity={0.04} />
      {/* Puddle reflections */}
      <rect x="60" y="200" width="30" height="4" fill={p.neon1} opacity={0.02} />
      <rect x="350" y="202" width="40" height="3" fill={p.neon2} opacity={0.02} />
      <rect x="500" y="200" width="25" height="4" fill={p.neon1} opacity={0.02} />
    </g>
  );
}

/* ── Scene-specific centre art ─────────────────────────── */
function SceneDetails({ scene, p }: { scene: Scene; p: Pal }) {
  switch (scene) {
    case "station": return (
      <g>
        {/* Massive central command tower */}
        <rect x="260" y="70" width="120" height="122" fill={p.buildingDark} />
        <rect x="260" y="70" width="120" height="2" fill={p.neon1} opacity={0.4} />
        <rect x="275" y="50" width="90" height="20" fill={p.building} />
        <rect x="295" y="35" width="50" height="15" fill={p.building} />
        <rect x="310" y="22" width="20" height="13" fill={p.building} />
        <rect x="317" y="14" width="6" height="8" fill={p.building} />
        <rect x="318" y="10" width="4" height="4" fill={p.neon1} opacity={0.8} />
        {/* Antenna array */}
        <Antenna x={285} y={38} color={p.neon1} />
        <Antenna x={350} y={38} color={p.neon2} />
        <SatDish x={300} y={28} color={p.neon1} />
        {/* Window grid on tower */}
        <Windows x={270} y={78} cols={10} rows={10} size={3} gap={6} c1={p.neon1} c2={p.neon2} />
        {/* Main screen */}
        <rect x="286" y="82" width="68" height="32" fill={p.neon1} opacity={0.04} />
        <rect x="286" y="82" width="68" height="32" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.5} />
        <rect x="290" y="88" width="60" height="2" fill={p.neon1} opacity={0.4} />
        <rect x="290" y="94" width="45" height="2" fill={p.neon2} opacity={0.3} />
        <rect x="290" y="100" width="55" height="2" fill={p.neon1} opacity={0.35} />
        <rect x="290" y="106" width="38" height="2" fill={p.neon2} opacity={0.25} />
        {/* Landing pads on sides */}
        <rect x="215" y="160" width="40" height="8" fill={p.building} />
        <rect x="215" y="158" width="40" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="230" y="155" width="10" height="3" fill={p.neon1} opacity={0.15} />
        <rect x="385" y="158" width="40" height="10" fill={p.building} />
        <rect x="385" y="156" width="40" height="2" fill={p.neon2} opacity={0.3} />
        <rect x="400" y="153" width="10" height="3" fill={p.neon2} opacity={0.15} />
        {/* Neon signs */}
        <NeonSign x={268} y={125} w={48} h={10} text="NULL STN" color={p.neon1} />
        <NeonSign x={328} y={140} w={40} h={9} text="DOCKING" color={p.neon2} />
        {/* Searchlights */}
        <Searchlight x={320} y={14} angle={-20} color={p.neon1} length={90} />
        <Searchlight x={320} y={14} angle={25} color={p.neon2} length={85} />
        {/* Ship silhouettes */}
        <polygon points="220,145 230,140 240,145 238,148 222,148" fill={p.neon1} opacity={0.08} />
        <polygon points="395,142 405,137 415,142 413,146 397,146" fill={p.neon2} opacity={0.08} />
        {/* Connecting walkways */}
        <rect x="215" y="130" width="45" height="3" fill={p.building} opacity={0.6} />
        <rect x="380" y="128" width="45" height="3" fill={p.building} opacity={0.6} />
      </g>
    );
    case "armory": return (
      <g>
        {/* Weapon factory complex */}
        <rect x="230" y="95" width="180" height="97" fill={p.buildingDark} />
        <rect x="230" y="95" width="180" height="2" fill={p.neon1} opacity={0.5} />
        {/* Smokestacks */}
        <rect x="240" y="60" width="16" height="35" fill={p.building} />
        <rect x="246" y="52" width="4" height="8" fill={p.neon1} opacity={0.4} />
        <rect x="390" y="65" width="14" height="30" fill={p.building} />
        <rect x="395" y="58" width="4" height="7" fill={p.neon1} opacity={0.35} />
        {/* Smoke particles */}
        <rect x="244" y="48" width="6" height="4" fill="#fff" opacity={0.05} />
        <rect x="248" y="40" width="4" height="4" fill="#fff" opacity={0.03} />
        <rect x="246" y="32" width="5" height="3" fill="#fff" opacity={0.02} />
        <rect x="393" y="54" width="5" height="3" fill="#fff" opacity={0.04} />
        <rect x="395" y="46" width="4" height="3" fill="#fff" opacity={0.025} />
        {/* Large weapon display */}
        <rect x="270" y="105" width="100" height="60" fill={p.building} />
        <rect x="270" y="105" width="100" height="60" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.6} />
        {/* Mounted rifles */}
        <rect x="280" y="115" width="28" height="3" fill={p.neon1} opacity={0.35} />
        <rect x="278" y="114" width="4" height="5" fill={p.neon1} opacity={0.25} />
        <rect x="280" y="125" width="32" height="3" fill={p.neon2} opacity={0.3} />
        <rect x="278" y="124" width="4" height="5" fill={p.neon2} opacity={0.2} />
        <rect x="280" y="135" width="25" height="3" fill={p.neon1} opacity={0.3} />
        <rect x="278" y="134" width="4" height="5" fill={p.neon1} opacity={0.2} />
        {/* Mech arm display */}
        <rect x="330" y="110" width="30" height="40" fill={p.neon1} opacity={0.04} />
        <rect x="330" y="110" width="30" height="40" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="340" y="115" width="10" height="10" fill={p.building} />
        <rect x="338" y="125" width="14" height="18" fill={p.building} />
        <rect x="344" y="117" width="2" height="2" fill={p.neon1} opacity={0.6} />
        {/* Ammo crates stacked */}
        <rect x="240" y="155" width="20" height="14" fill={p.building} />
        <rect x="240" y="155" width="20" height="14" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.5} />
        <rect x="244" y="157" width="4" height="4" fill={p.neon1} opacity={0.2} />
        <rect x="240" y="145" width="16" height="10" fill={p.building} />
        <rect x="240" y="145" width="16" height="10" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.4} />
        <rect x="380" y="158" width="18" height="12" fill={p.building} />
        <rect x="380" y="158" width="18" height="12" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="384" y="160" width="4" height="4" fill={p.neon2} opacity={0.2} />
        {/* Sparks from welding */}
        {[315,320,325,318,322,328].map((sx, i) => (
          <rect key={`sp${i}`} x={sx} y={145 + (i * 5) % 12} width="2" height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3 + i * 0.08} />
        ))}
        {/* Neon signs */}
        <NeonSign x={245} y={97} w={60} h={10} text="ARMORY" color={p.neon1} />
        <NeonSign x={350} y={97} w={50} h={10} text="WEAPONS" color={p.neon2} />
        {/* Guard silhouette */}
        <rect x="420" y="155" width="6" height="6" fill="#0a0404" />
        <rect x="419" y="161" width="8" height="12" fill="#0a0404" />
        <rect x="419" y="173" width="3" height="6" fill="#0a0404" />
        <rect x="424" y="173" width="3" height="6" fill="#0a0404" />
        <rect x="427" y="158" width="8" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="422" y="158" width="2" height="1" fill={p.neon1} opacity={0.5} />
        <Searchlight x={320} y={95} angle={-15} color={p.neon1} length={70} />
      </g>
    );
    case "bazaar": return (
      <g>
        {/* Crowded market street */}
        <rect x="210" y="110" width="220" height="82" fill={p.buildingDark} />
        {/* Awnings / stall roofs */}
        <polygon points="215,130 240,118 265,130" fill={p.neon1} opacity={0.15} />
        <polygon points="270,128 300,116 330,128" fill={p.neon2} opacity={0.12} />
        <polygon points="335,130 360,118 385,130" fill={p.neon1} opacity={0.13} />
        <polygon points="390,128 415,118 440,128" fill={p.neon2} opacity={0.11} />
        {/* Stall 1 — Food vendor */}
        <rect x="218" y="130" width="44" height="42" fill={p.building} />
        <Windows x={222} y={134} cols={3} rows={2} size={4} gap={6} c1={p.neon1} c2={p.neon2} />
        <NeonSign x={220} y={118} w={42} h={9} text="FOOD" color={p.neon1} />
        <rect x="225" y="155" width="8" height="8" fill={p.neon1} opacity={0.15} />
        <rect x="238" y="157" width="6" height="6" fill={p.neon2} opacity={0.12} />
        <rect x="248" y="156" width="8" height="7" fill={p.neon1} opacity={0.1} />
        {/* Stall 2 — Tech parts */}
        <rect x="272" y="128" width="56" height="44" fill={p.building} />
        <Windows x={278} y={134} cols={4} rows={2} size={4} gap={5} c1={p.neon2} c2={p.neon1} />
        <NeonSign x={276} y={116} w={48} h={9} text="TECH" color={p.neon2} />
        <rect x="280" y="155" width="10" height="6" fill={p.neon2} opacity={0.2} />
        <rect x="295" y="153" width="8" height="8" fill={p.neon1} opacity={0.15} />
        <rect x="308" y="155" width="12" height="6" fill={p.neon2} opacity={0.12} />
        {/* Stall 3 — Mods */}
        <rect x="338" y="130" width="48" height="42" fill={p.building} />
        <NeonSign x={340} y={118} w={44} h={9} text="MODS" color={p.neon1} />
        <rect x="345" y="142" width="6" height="18" fill={p.neon1} opacity={0.1} />
        <rect x="345" y="142" width="6" height="18" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="358" y="140" width="6" height="20" fill={p.neon2} opacity={0.08} />
        <rect x="358" y="140" width="6" height="20" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="370" y="144" width="6" height="16" fill={p.neon1} opacity={0.1} />
        <rect x="370" y="144" width="6" height="16" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        {/* Hanging lanterns */}
        {[230,260,290,320,350,380,410].map((lx, i) => (
          <g key={`la${i}`}>
            <rect x={lx} y={108} width="1" height={6 + i % 3} fill="#fff" opacity={0.1} />
            <rect x={lx - 1} y={108 + 6 + i % 3} width="3" height="3" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3} />
          </g>
        ))}
        {/* Crowd silhouettes */}
        {[220,240,265,285,305,330,355,375,400,420].map((cx, i) => (
          <g key={`cr${i}`}>
            <rect x={cx} y={168 - (i % 3) * 2} width="5" height="5" fill="#0a0804" opacity={0.4 + (i % 2) * 0.15} />
            <rect x={cx - 1} y={173 - (i % 3) * 2} width="7" height="10" fill="#0a0804" opacity={0.35 + (i % 2) * 0.1} />
          </g>
        ))}
        {/* Steam vents */}
        <rect x="265" y="170" width="3" height="8" fill="#fff" opacity={0.04} />
        <rect x="360" y="172" width="3" height="6" fill="#fff" opacity={0.03} />
        {/* Floating holo-price */}
        <rect x="300" y="105" width="40" height="8" fill={p.neon1} opacity={0.06} />
        <rect x="300" y="105" width="40" height="8" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <text x="320" y="112" textAnchor="middle" fill={p.neon1} fontSize="5" fontFamily="monospace" opacity={0.5} shapeRendering="auto">¢ 2,450</text>
      </g>
    );
    case "academy": return (
      <g>
        {/* Grand academy building */}
        <rect x="230" y="85" width="180" height="107" fill={p.buildingDark} />
        <rect x="230" y="85" width="180" height="2" fill={p.neon1} opacity={0.4} />
        {/* Central dome */}
        <path d="M280 85 L320 55 L360 85" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity={0.6} />
        <circle cx="320" cy="68" r="8" fill={p.neon1} opacity={0.12} shapeRendering="auto" />
        <circle cx="320" cy="68" r="8" fill="none" stroke={p.neon1} strokeWidth="1" shapeRendering="auto" />
        <rect x="318" y="48" width="4" height="7" fill={p.neon1} opacity={0.5} />
        {/* Columns */}
        {[245,265,285,345,365,385].map((cx, i) => (
          <rect key={`col${i}`} x={cx} y={85} width="6" height="107" fill={p.building} opacity={0.35} />
        ))}
        {/* Knowledge screens — three large panels */}
        <rect x="248" y="100" width="42" height="28" fill={p.neon1} opacity={0.04} />
        <rect x="248" y="100" width="42" height="28" fill="none" stroke={p.neon1} strokeWidth="1" />
        {[104,110,116,122].map((ly, i) => (
          <rect key={`t1${i}`} x={252} y={ly} width={35 - i * 4} height="2" fill={p.neon1} opacity={0.35 - i * 0.06} />
        ))}
        <rect x="300" y="100" width="42" height="28" fill={p.neon2} opacity={0.04} />
        <rect x="300" y="100" width="42" height="28" fill="none" stroke={p.neon2} strokeWidth="1" />
        {[104,110,116,122].map((ly, i) => (
          <rect key={`t2${i}`} x={304} y={ly} width={35 - i * 3} height="2" fill={p.neon2} opacity={0.3 - i * 0.05} />
        ))}
        <rect x="350" y="100" width="42" height="28" fill={p.neon1} opacity={0.04} />
        <rect x="350" y="100" width="42" height="28" fill="none" stroke={p.neon1} strokeWidth="1" />
        {/* Holographic globe */}
        <circle cx="320" cy="155" r="16" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.25} shapeRendering="auto" />
        <ellipse cx="320" cy="155" rx="16" ry="6" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        <ellipse cx="320" cy="155" rx="6" ry="16" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        <rect x="319" y="154" width="2" height="2" fill={p.neon1} opacity={0.5} />
        {/* Student silhouettes */}
        {[260,280,350,370].map((sx, i) => (
          <g key={`st${i}`}>
            <rect x={sx} y={162} width="5" height="5" fill="#040c18" opacity={0.5} />
            <rect x={sx - 1} y={167} width="7" height="10" fill="#040c18" opacity={0.4} />
          </g>
        ))}
        {/* Floating symbols */}
        <text x="258" y="96" fill={p.neon1} fontSize="6" fontFamily="monospace" opacity={0.25} shapeRendering="auto">∑</text>
        <text x="380" y="94" fill={p.neon2} fontSize="6" fontFamily="monospace" opacity={0.2} shapeRendering="auto">Ω</text>
        <NeonSign x={275} y={78} w={90} h={10} text="ACADEMY" color={p.neon1} />
      </g>
    );
    case "docking-bay": return (
      <g>
        {/* Massive hangar structure */}
        <rect x="210" y="85" width="220" height="107" fill={p.buildingDark} />
        <rect x="210" y="85" width="220" height="3" fill={p.neon1} opacity={0.35} />
        {/* Hangar arch */}
        <path d="M240 192 L240 120 Q320 80 400 120 L400 192" fill="none" stroke={p.neon1} strokeWidth="2" opacity={0.25} shapeRendering="auto" />
        {/* Interior glow */}
        <rect x="245" y="125" width="150" height="67" fill={p.neon1} opacity={0.02} />
        {/* Docked ship — large */}
        <polygon points="280,155 320,130 360,155" fill={p.building} opacity={0.7} />
        <rect x="295" y="155" width="50" height="12" fill={p.building} opacity={0.6} />
        <rect x="305" y="148" width="30" height="7" fill={p.building} opacity={0.5} />
        <rect x="312" y="142" width="16" height="6" fill={p.building} opacity={0.4} />
        {/* Ship windows */}
        <rect x="310" y="150" width="3" height="3" fill={p.neon1} opacity={0.4} />
        <rect x="318" y="150" width="3" height="3" fill={p.neon1} opacity={0.35} />
        <rect x="326" y="150" width="3" height="3" fill={p.neon1} opacity={0.3} />
        {/* Engine glow */}
        <rect x="300" y="167" width="10" height="6" fill={p.neon1} opacity={0.15} />
        <rect x="330" y="167" width="10" height="6" fill={p.neon1} opacity={0.15} />
        {/* Gantry cranes */}
        <rect x="245" y="90" width="4" height="102" fill={p.building} opacity={0.5} />
        <rect x="391" y="88" width="4" height="104" fill={p.building} opacity={0.5} />
        <rect x="245" y="105" width="150" height="3" fill={p.building} opacity={0.3} />
        {/* Fuel lines */}
        <line x1="250" y1="140" x2="290" y2="155" stroke={p.neon2} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        <line x1="390" y1="138" x2="350" y2="155" stroke={p.neon2} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        {/* Cargo containers */}
        <rect x="215" y="162" width="20" height="14" fill={p.building} />
        <rect x="215" y="162" width="20" height="14" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="215" y="152" width="16" height="10" fill={p.building} />
        <rect x="215" y="152" width="16" height="10" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.3} />
        <rect x="405" y="160" width="18" height="16" fill={p.building} />
        <rect x="405" y="160" width="18" height="16" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        {/* Workers */}
        {[255,268,370,385].map((wx, i) => (
          <g key={`wk${i}`}>
            <rect x={wx} y={174} width="4" height="4" fill="#060a14" opacity={0.5} />
            <rect x={wx - 1} y={178} width="6" height="8" fill="#060a14" opacity={0.4} />
          </g>
        ))}
        <NeonSign x={260} y={88} w={56} h={10} text="BAY 7" color={p.neon1} />
        <NeonSign x={340} y={88} w={52} h={10} text="DOCK" color={p.neon2} />
        {/* Landing lights */}
        {[260,280,300,320,340,360,380].map((lx, i) => (
          <rect key={`ll${i}`} x={lx} y={188} width="3" height="3" fill={p.neon1} opacity={0.2 + (i % 2) * 0.15} />
        ))}
      </g>
    );
    case "syndicate-row": return (
      <g>
        {/* Dark alley with towering buildings */}
        <rect x="210" y="90" width="80" height="102" fill={p.buildingDark} />
        <rect x="350" y="85" width="80" height="107" fill={p.buildingDark} />
        <Windows x={218} y={98} cols={6} rows={8} size={3} gap={5} c1={p.neon1} c2={p.neon2} />
        <Windows x={358} y={93} cols={6} rows={8} size={3} gap={5} c1={p.neon2} c2={p.neon1} />
        {/* Narrow alley between buildings */}
        <rect x="290" y="100" width="60" height="92" fill={p.building} opacity={0.15} />
        {/* Neon galore on buildings */}
        <NeonSign x={215} y={100} w={70} h={10} text="SYNDICATE" color={p.neon1} />
        <NeonSign x={215} y={125} w={50} h={9} text="DEALS" color={p.neon2} />
        <NeonSign x={355} y={95} w={68} h={10} text="BLACK MKT" color={p.neon2} />
        <NeonSign x={355} y={120} w={55} h={9} text="NO RULES" color={p.neon1} />
        <NeonSign x={355} y={145} w={48} h={9} text="OPEN" color={p.neon2} />
        {/* Vertical neon strips */}
        <rect x="290" y="100" width="2" height="92" fill={p.neon1} opacity={0.15} />
        <rect x="348" y="85" width="2" height="107" fill={p.neon2} opacity={0.12} />
        {/* Shady figures in alley */}
        {[300,318,335].map((fx, i) => (
          <g key={`sf${i}`}>
            <rect x={fx} y={162 - i * 4} width="5" height="5" fill="#0a0418" opacity={0.6} />
            <rect x={fx - 1} y={167 - i * 4} width="7" height="12" fill="#0a0418" opacity={0.5} />
            <rect x={fx + 1} y={164 - i * 4} width="2" height="1" fill={p.neon1} opacity={0.4} />
          </g>
        ))}
        {/* Hanging cables */}
        <path d="M288 110 Q310 125 350 112" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        <path d="M290 135 Q315 148 348 136" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.15} shapeRendering="auto" />
        {/* Dripping neon */}
        <rect x="287" y="145" width="1" height="8" fill={p.neon1} opacity={0.2} />
        <rect x="287" y="155" width="1" height="3" fill={p.neon1} opacity={0.1} />
        <rect x="349" y="160" width="1" height="6" fill={p.neon2} opacity={0.15} />
        {/* Contraband crates */}
        <rect x="295" y="175" width="12" height="10" fill={p.building} />
        <rect x="295" y="175" width="12" height="10" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.4} />
        <rect x="312" y="172" width="14" height="13" fill={p.building} />
        <rect x="312" y="172" width="14" height="13" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="330" y="177" width="10" height="8" fill={p.building} />
        <rect x="330" y="177" width="10" height="8" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.35} />
        <Searchlight x={250} y={90} angle={10} color={p.neon1} length={65} />
      </g>
    );
    case "underbelly": return (
      <g>
        {/* Grimy underground district */}
        <rect x="200" y="100" width="240" height="92" fill={p.buildingDark} />
        {/* Overhead pipes and ducts */}
        <rect x="200" y="95" width="240" height="5" fill={p.building} />
        <rect x="210" y="85" width="8" height="10" fill={p.building} />
        <rect x="310" y="82" width="8" height="13" fill={p.building} />
        <rect x="420" y="86" width="8" height="9" fill={p.building} />
        {/* Dripping pipes */}
        <rect x="213" y="95" width="1" height="6" fill={p.neon1} opacity={0.2} />
        <rect x="313" y="95" width="1" height="8" fill={p.neon2} opacity={0.15} />
        <rect x="423" y="95" width="1" height="5" fill={p.neon1} opacity={0.18} />
        {/* Neon-lit storefronts */}
        <rect x="210" y="118" width="55" height="50" fill={p.building} />
        <NeonSign x={212} y={108} w={51} h={10} text="DANGER" color={p.neon1} />
        <Windows x={215} y={122} cols={4} rows={3} size={4} gap={5} c1={p.neon1} c2={p.neon2} />
        <rect x="275" y="115" width="55" height="53" fill={p.building} />
        <NeonSign x={277} y={105} w={51} h={10} text="NO LAW" color={p.neon2} />
        <Windows x={280} y={120} cols={4} rows={3} size={4} gap={5} c1={p.neon2} c2={p.neon1} />
        <rect x="340" y="118" width="55" height="50" fill={p.building} />
        <NeonSign x={342} y={108} w={51} h={10} text="VICE" color={p.neon1} />
        <Windows x={345} y={122} cols={4} rows={3} size={4} gap={5} c1={p.neon1} c2={p.neon2} />
        {/* Graffiti-like neon splashes */}
        <rect x="220" y="148" width="8" height="3" fill={p.neon1} opacity={0.15} />
        <rect x="290" y="145" width="6" height="6" fill={p.neon2} opacity={0.1} />
        <rect x="355" y="150" width="10" height="2" fill={p.neon1} opacity={0.12} />
        {/* Shady figures */}
        {[215,260,310,365,405].map((fx, i) => (
          <g key={`uf${i}`}>
            <rect x={fx} y={168} width="5" height="5" fill="#0a0418" opacity={0.5 + (i % 2) * 0.1} />
            <rect x={fx - 1} y={173} width="7" height="10" fill="#0a0418" opacity={0.4 + (i % 2) * 0.1} />
            <rect x={fx + 1} y={170} width="2" height="1" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.45} />
          </g>
        ))}
        {/* Rats */}
        <rect x="250" y="186" width="4" height="2" fill="#0a0418" opacity={0.3} />
        <rect x="254" y="185" width="2" height="1" fill="#0a0418" opacity={0.2} />
        <rect x="380" y="188" width="3" height="2" fill="#0a0418" opacity={0.25} />
        {/* Smoke/steam */}
        <rect x="265" y="160" width="4" height="10" fill="#fff" opacity={0.03} />
        <rect x="335" y="158" width="4" height="12" fill="#fff" opacity={0.025} />
        {/* Broken sign */}
        <rect x="400" y="120" width="30" height="9" fill={p.neon2} opacity={0.06} />
        <rect x="400" y="120" width="30" height="9" fill="none" stroke={p.neon2} strokeWidth="0.5" strokeDasharray="3 2" />
        <text x="415" y="127" textAnchor="middle" fill={p.neon2} fontSize="5" fontFamily="monospace" opacity={0.35} shapeRendering="auto">BR?KEN</text>
      </g>
    );
    case "outer-ring": return (
      <g>
        {/* War-torn ruins */}
        <rect x="210" y="105" width="60" height="87" fill={p.buildingDark} />
        <rect x="210" y="105" width="20" height="50" fill={p.buildingDark} />
        {/* Destroyed top — jagged */}
        <polygon points="210,105 215,95 225,100 235,90 245,98 255,92 270,105" fill={p.buildingDark} />
        <rect x="340" y="100" width="70" height="92" fill={p.buildingDark} />
        <polygon points="340,100 350,88 365,95 375,85 390,92 400,88 410,100" fill={p.buildingDark} />
        {/* Damage cracks */}
        <line x1="220" y1="115" x2="240" y2="135" stroke={p.neon1} strokeWidth="0.5" opacity={0.25} shapeRendering="auto" />
        <line x1="225" y1="140" x2="250" y2="155" stroke={p.neon1} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        <line x1="350" y1="108" x2="375" y2="130" stroke={p.neon1} strokeWidth="0.5" opacity={0.25} shapeRendering="auto" />
        <line x1="380" y1="120" x2="395" y2="145" stroke={p.neon2} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        {/* Scattered broken windows */}
        <rect x="220" y="120" width="3" height="3" fill={p.neon1} opacity={0.2} />
        <rect x="235" y="130" width="3" height="3" fill={p.neon2} opacity={0.15} />
        <rect x="225" y="145" width="3" height="3" fill={p.neon1} opacity={0.12} />
        <rect x="355" y="110" width="3" height="3" fill={p.neon2} opacity={0.2} />
        <rect x="370" y="125" width="3" height="3" fill={p.neon1} opacity={0.15} />
        <rect x="390" y="115" width="3" height="3" fill={p.neon2} opacity={0.12} />
        {/* War machine in center */}
        <rect x="280" y="140" width="24" height="28" fill="#0a0404" />
        <rect x="274" y="136" width="36" height="6" fill="#0a0404" />
        <rect x="290" y="128" width="10" height="8" fill="#0a0404" />
        <rect x="268" y="142" width="8" height="4" fill={p.neon1} opacity={0.4} />
        <rect x="308" y="142" width="8" height="4" fill={p.neon1} opacity={0.4} />
        <rect x="292" y="132" width="2" height="2" fill={p.neon1} opacity={0.8} />
        <rect x="296" y="132" width="2" height="2" fill={p.neon1} opacity={0.8} />
        {/* Tank treads */}
        <rect x="275" y="168" width="14" height="8" fill="#0a0404" />
        <rect x="295" y="168" width="14" height="8" fill="#0a0404" />
        {/* Rubble */}
        {[215,235,255,290,310,330,360,385].map((rx, i) => (
          <rect key={`rb${i}`} x={rx} y={178 + (i % 3) * 3} width={4 + i % 3 * 2} height={3 + i % 2 * 2} fill={p.building} opacity={0.3 + i * 0.03} />
        ))}
        {/* Warning signs */}
        <NeonSign x={215} y={160} w={40} h={9} text="DANGER" color={p.neon1} />
        <NeonSign x={360} y={155} w={46} h={9} text="KEEP OUT" color={p.neon2} />
        {/* Distant explosions */}
        <rect x="440" y="120" width="6" height="6" fill={p.neon1} opacity={0.15} />
        <rect x="444" y="115" width="4" height="4" fill={p.neon2} opacity={0.1} />
        <rect x="438" y="118" width="3" height="3" fill={p.neon1} opacity={0.08} />
        <Searchlight x={297} y={128} angle={0} color={p.neon1} length={60} />
      </g>
    );
    case "hydroponics": return (
      <g>
        {/* Bio-dome greenhouse */}
        <rect x="220" y="100" width="200" height="92" fill={p.buildingDark} />
        <path d="M220 100 Q320 55 420 100" fill={p.building} opacity={0.3} stroke={p.neon1} strokeWidth="1.5" shapeRendering="auto" />
        {/* Internal structure beams */}
        <line x1="270" y1="100" x2="270" y2="85" stroke={p.neon1} strokeWidth="0.5" opacity={0.15} shapeRendering="auto" />
        <line x1="320" y1="100" x2="320" y2="65" stroke={p.neon1} strokeWidth="0.5" opacity={0.15} shapeRendering="auto" />
        <line x1="370" y1="100" x2="370" y2="85" stroke={p.neon1} strokeWidth="0.5" opacity={0.15} shapeRendering="auto" />
        {/* Grow racks — tiered */}
        {[235,275,315,355,395].map((gx, i) => (
          <g key={`gr${i}`}>
            <rect x={gx} y={110} width={28} height={60} fill={p.building} opacity={0.4} />
            <rect x={gx + 2} y={108} width={24} height="3" fill={p.neon1} opacity={0.4} />
            <rect x={gx + 4} y={120} width={6} height={14 + i * 3} fill={p.neon1} opacity={0.15 + i * 0.02} />
            <rect x={gx + 14} y={118} width={6} height={16 + i * 2} fill={p.neon1} opacity={0.12 + i * 0.02} />
            <rect x={gx + 8} y={124} width={4} height={10 + i * 2} fill={p.neon2} opacity={0.1 + i * 0.01} />
            <rect x={gx + 18} y={122} width={5} height={12 + i * 2} fill={p.neon1} opacity={0.13 + i * 0.02} />
            <rect x={gx + 2} y={148} width={24} height="2" fill={p.neon2} opacity={0.15} />
            <rect x={gx} y={165} width={28} height="5" fill={p.building} opacity={0.5} />
          </g>
        ))}
        {/* Water droplets / mist */}
        {[248,282,328,368,408].map((dx, i) => (
          <rect key={`dr${i}`} x={dx} y={155 + i * 3} width="1" height="3" fill={p.neon1} opacity={0.12 + i * 0.02} />
        ))}
        {/* Monitoring screen */}
        <rect x="222" y="172" width="30" height="16" fill={p.neon1} opacity={0.04} />
        <rect x="222" y="172" width="30" height="16" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="226" y="176" width="22" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="226" y="181" width="16" height="2" fill={p.neon2} opacity={0.2} />
        {/* Bio-hazard / DNA symbol */}
        <circle cx="320" cy="75" r="6" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        <NeonSign x={270} y={90} w={100} h={10} text="HYDRO BAY" color={p.neon1} />
      </g>
    );
    case "fabrication": return (
      <g>
        {/* Industrial forge complex */}
        <rect x="220" y="90" width="200" height="102" fill={p.buildingDark} />
        <rect x="220" y="90" width="200" height="2" fill={p.neon1} opacity={0.4} />
        {/* Smokestacks — large */}
        <rect x="230" y="50" width="20" height="40" fill={p.building} />
        <rect x="238" y="42" width="4" height="8" fill={p.neon1} opacity={0.45} />
        <rect x="390" y="55" width="18" height="35" fill={p.building} />
        <rect x="397" y="48" width="4" height="7" fill={p.neon1} opacity={0.4} />
        <rect x="410" y="60" width="14" height="30" fill={p.building} />
        {/* Heavy smoke */}
        {[234,238,242,394,398].map((sx, i) => (
          <g key={`sm${i}`}>
            <rect x={sx} y={38 - i * 8} width={6 + i * 2} height={4 + i} fill="#fff" opacity={0.04 - i * 0.005} />
          </g>
        ))}
        {/* Conveyor system */}
        <rect x="250" y="165" width="140" height="6" fill={p.building} />
        {[260,280,300,320,340,360,380].map((cx, i) => (
          <rect key={`cv${i}`} x={cx} y={165} width="8" height="6" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.1} />
        ))}
        {/* Forge / molten area */}
        <rect x="275" y="140" width="90" height="20" fill={p.neon1} opacity={0.06} />
        <rect x="285" y="148" width="14" height="8" fill={p.neon1} opacity={0.3} />
        <rect x="310" y="146" width="10" height="10" fill={p.neon1} opacity={0.35} />
        <rect x="335" y="149" width="16" height="7" fill={p.neon2} opacity={0.25} />
        {/* Anvil + hammer bot */}
        <rect x="305" y="120" width="30" height="16" fill={p.building} />
        <rect x="300" y="132" width="40" height="6" fill={p.building} />
        <rect x="310" y="112" width="4" height="8" fill={p.neon2} opacity={0.3} />
        <rect x="326" y="114" width="4" height="6" fill={p.neon1} opacity={0.35} />
        {/* Flying sparks */}
        {[298,308,315,322,328,338,342].map((sx, i) => (
          <rect key={`fsp${i}`} x={sx} y={128 + (i * 7) % 18} width="2" height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3 + i * 0.06} />
        ))}
        {/* Gear / cog shape */}
        <circle cx="260" cy="115" r="10" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        <circle cx="260" cy="115" r="5" fill={p.neon1} opacity={0.08} shapeRendering="auto" />
        <NeonSign x={260} y={92} w={60} h={10} text="FORGE" color={p.neon1} />
        <NeonSign x={340} y={92} w={60} h={10} text="CRAFT" color={p.neon2} />
      </g>
    );
    case "casino": return (
      <g>
        {/* Grand casino facade */}
        <rect x="210" y="85" width="220" height="107" fill={p.buildingDark} />
        <rect x="210" y="85" width="220" height="3" fill={p.neon1} opacity={0.5} />
        {/* Ornate entrance */}
        <rect x="285" y="150" width="70" height="42" fill={p.building} opacity={0.6} />
        <path d="M285 150 L320 130 L355 150" fill={p.neon1} opacity={0.08} />
        <rect x="290" y="155" width="60" height="2" fill={p.neon1} opacity={0.3} />
        {/* Card symbols */}
        <text x="252" y="115" fill={p.neon1} fontSize="10" fontFamily="monospace" opacity={0.3} shapeRendering="auto">♠</text>
        <text x="320" y="148" fill={p.neon2} fontSize="8" fontFamily="monospace" opacity={0.25} shapeRendering="auto">♦</text>
        <text x="388" y="115" fill={p.neon1} fontSize="10" fontFamily="monospace" opacity={0.3} shapeRendering="auto">♣</text>
        <text x="320" y="115" fill={p.neon2} fontSize="12" fontFamily="monospace" opacity={0.2} shapeRendering="auto">♥</text>
        {/* Slot machine row */}
        {[225,255,365,395].map((sx, i) => (
          <g key={`sl${i}`}>
            <rect x={sx} y={130} width={18} height={30} fill={p.building} />
            <rect x={sx} y={130} width={18} height={30} fill="none" stroke={i % 2 === 0 ? p.neon1 : p.neon2} strokeWidth="0.5" opacity={0.5} />
            <rect x={sx + 3} y={135} width={4} height={6} fill={p.neon1} opacity={0.3} />
            <rect x={sx + 9} y={135} width={4} height={6} fill={p.neon2} opacity={0.25} />
            <rect x={sx + 3} y={144} width={4} height={6} fill={p.neon2} opacity={0.2} />
            <rect x={sx + 9} y={144} width={4} height={6} fill={p.neon1} opacity={0.25} />
          </g>
        ))}
        {/* Roulette table glow */}
        <circle cx="320" cy="172" r="14" fill={p.neon1} opacity={0.05} shapeRendering="auto" />
        <circle cx="320" cy="172" r="14" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        <circle cx="320" cy="172" r="8" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.15} shapeRendering="auto" />
        <rect x="318" y="170" width="4" height="4" fill={p.neon1} opacity={0.4} />
        {/* Neon signs — flashy */}
        <NeonSign x={230} y={87} w={80} h={12} text="CASINO" color={p.neon1} glow={0.18} />
        <NeonSign x={330} y={87} w={80} h={12} text="JACKPOT" color={p.neon2} glow={0.15} />
        <NeonSign x={275} y={102} w={90} h={10} text="HIGH STAKES" color={p.neon1} />
        {/* Marquee lights around entrance */}
        {[286,296,306,316,326,336,346,354].map((lx, i) => (
          <rect key={`ml${i}`} x={lx} y={148} width="3" height="3" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3 + (i % 3) * 0.1} />
        ))}
        {/* Dollar signs floating */}
        <text x="240" y="145" fill={p.neon2} fontSize="6" fontFamily="monospace" opacity={0.2} shapeRendering="auto">$</text>
        <text x="395" y="140" fill={p.neon1} fontSize="6" fontFamily="monospace" opacity={0.18} shapeRendering="auto">$</text>
        {/* Dice */}
        <rect x="210" y="170" width="10" height="10" fill={p.building} />
        <rect x="210" y="170" width="10" height="10" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="212" y="172" width="2" height="2" fill={p.neon2} opacity={0.4} />
        <rect x="216" y="176" width="2" height="2" fill={p.neon2} opacity={0.4} />
        <Searchlight x={320} y={85} angle={-20} color={p.neon1} length={70} />
        <Searchlight x={320} y={85} angle={20} color={p.neon2} length={70} />
      </g>
    );
    case "training-grounds": return (
      <g>
        {/* Open arena with walls */}
        <rect x="220" y="100" width="200" height="92" fill={p.buildingDark} />
        <rect x="220" y="100" width="200" height="3" fill={p.neon1} opacity={0.4} />
        {/* Arena floor markings */}
        <rect x="240" y="165" width="160" height="27" fill={p.building} opacity={0.3} />
        <circle cx="320" cy="175" r="20" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.15} shapeRendering="auto" />
        <circle cx="320" cy="175" r="10" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.1} shapeRendering="auto" />
        {/* Training dummies — detailed */}
        {[260,290,345,375].map((dx, i) => (
          <g key={`td${i}`}>
            <rect x={dx} y={145} width="8" height="8" fill={p.building} />
            <rect x={dx - 1} y={153} width="10" height="14" fill={p.building} />
            <rect x={dx - 4} y={155} width="6" height="3" fill={p.building} />
            <rect x={dx + 6} y={155} width="6" height="3" fill={p.building} />
            <rect x={dx - 1} y={167} width="4" height="8" fill={p.building} />
            <rect x={dx + 5} y={167} width="4" height="8" fill={p.building} />
            <rect x={dx + 2} y={156} width="4" height="4" fill={p.neon1} opacity={0.3} />
          </g>
        ))}
        {/* Combat target rings */}
        <circle cx="320" cy="140" r="14" fill="none" stroke={p.neon1} strokeWidth="1.5" opacity={0.3} shapeRendering="auto" />
        <circle cx="320" cy="140" r="8" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.4} shapeRendering="auto" />
        <circle cx="320" cy="140" r="3" fill={p.neon1} opacity={0.5} shapeRendering="auto" />
        {/* Weapon rack */}
        <rect x="225" y="108" width="4" height="50" fill={p.building} />
        <rect x="222" y="115" width="10" height="3" fill={p.neon1} opacity={0.2} />
        <rect x="222" y="125" width="10" height="3" fill={p.neon2} opacity={0.2} />
        <rect x="222" y="135" width="10" height="3" fill={p.neon1} opacity={0.2} />
        <rect x="222" y="145" width="10" height="3" fill={p.neon2} opacity={0.2} />
        {/* Score display */}
        <rect x="400" y="108" width="16" height="24" fill={p.neon1} opacity={0.04} />
        <rect x="400" y="108" width="16" height="24" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <text x="408" y="118" textAnchor="middle" fill={p.neon1} fontSize="5" fontFamily="monospace" opacity={0.5} shapeRendering="auto">HIT</text>
        <text x="408" y="127" textAnchor="middle" fill={p.neon1} fontSize="7" fontFamily="monospace" fontWeight="bold" opacity={0.6} shapeRendering="auto">97</text>
        <NeonSign x={262} y={102} w={116} h={10} text="TRAINING" color={p.neon1} />
        {/* Sparring fighter silhouettes */}
        <rect x="305" y="155" width="6" height="6" fill="#0c0204" opacity={0.5} />
        <rect x="304" y="161" width="8" height="10" fill="#0c0204" opacity={0.4} />
        <rect x="327" y="153" width="6" height="6" fill="#0c0204" opacity={0.5} />
        <rect x="326" y="159" width="8" height="12" fill="#0c0204" opacity={0.4} />
      </g>
    );
    case "fishing-hut": return (
      <g>
        {/* Deep water area */}
        <rect x="0" y="160" width="640" height="32" fill={p.neon1} opacity={0.04} />
        {/* Water surface reflections */}
        {[20,60,110,170,240,320,400,460,520,580].map((wx, i) => (
          <rect key={`wv${i}`} x={wx} y={162 + (i % 3) * 4} width={20 + i * 2} height="2" fill={p.neon1} opacity={0.06 + (i % 3) * 0.03} />
        ))}
        {/* Main pier */}
        <rect x="250" y="152" width="140" height="5" fill={p.building} />
        <rect x="260" y="157" width="4" height="18" fill={p.building} />
        <rect x="306" y="157" width="4" height="18" fill={p.building} />
        <rect x="376" y="157" width="4" height="18" fill={p.building} />
        {/* The hut */}
        <rect x="272" y="118" width="96" height="34" fill={p.buildingDark} />
        <path d="M268 118 L320 94 L372 118" fill={p.building} stroke={p.neon1} strokeWidth="0.5" opacity={0.4} />
        {/* Chimney with smoke */}
        <rect x="340" y="98" width="8" height="12" fill={p.building} />
        <rect x="342" y="92" width="4" height="4" fill="#fff" opacity={0.04} />
        <rect x="343" y="86" width="3" height="3" fill="#fff" opacity={0.025} />
        {/* Windows */}
        <rect x="280" y="126" width="12" height="10" fill={p.neon1} opacity={0.08} />
        <rect x="280" y="126" width="12" height="10" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="348" y="126" width="12" height="10" fill={p.neon1} opacity={0.08} />
        <rect x="348" y="126" width="12" height="10" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        {/* Door */}
        <rect x="310" y="130" width="14" height="22" fill={p.building} />
        <rect x="310" y="130" width="14" height="2" fill={p.neon1} opacity={0.2} />
        {/* Fishing rods */}
        <line x1="255" y1="140" x2="220" y2="175" stroke={p.neon2} strokeWidth="0.7" opacity={0.35} shapeRendering="auto" />
        <rect x="218" y="173" width="4" height="4" fill={p.neon2} opacity={0.25} />
        <line x1="385" y1="145" x2="420" y2="178" stroke={p.neon2} strokeWidth="0.7" opacity={0.3} shapeRendering="auto" />
        <rect x="418" y="176" width="4" height="4" fill={p.neon2} opacity={0.2} />
        {/* Sitting figure with rod */}
        <rect x="390" y="142" width="5" height="5" fill="#040c18" opacity={0.5} />
        <rect x="389" y="147" width="7" height="8" fill="#040c18" opacity={0.4} />
        {/* Hanging lantern */}
        <rect x="318" y="92" width="1" height="4" fill="#fff" opacity={0.1} />
        <rect x="316" y="96" width="5" height="4" fill={p.neon1} opacity={0.25} />
        {/* Bioluminescent fish below surface */}
        <rect x="180" y="170" width="3" height="2" fill={p.neon1} opacity={0.2} />
        <rect x="340" y="174" width="3" height="2" fill={p.neon2} opacity={0.15} />
        <rect x="480" y="168" width="3" height="2" fill={p.neon1} opacity={0.18} />
        <NeonSign x={284} y={108} w={72} h={10} text="FISH HUT" color={p.neon1} />
      </g>
    );
    case "fight-pit": return (
      <g>
        {/* Underground cage arena */}
        <rect x="220" y="95" width="200" height="97" fill={p.buildingDark} />
        {/* Cage structure */}
        {[230,250,270,370,390,410].map((bx, i) => (
          <rect key={`cb${i}`} x={bx} y={95} width="2" height="97" fill={p.neon1} opacity={0.15 + (i % 2) * 0.05} />
        ))}
        <rect x="228" y="115" width="184" height="2" fill={p.neon1} opacity={0.15} />
        <rect x="228" y="150" width="184" height="2" fill={p.neon1} opacity={0.15} />
        {/* Ring ropes */}
        <rect x="260" y="130" width="120" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="260" y="160" width="120" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="260" y="130" width="2" height="30" fill={p.neon1} opacity={0.2} />
        <rect x="378" y="130" width="2" height="30" fill={p.neon1} opacity={0.2} />
        {/* Fighter 1 */}
        <rect x="288" y="138" width="8" height="8" fill="#0c0204" />
        <rect x="286" y="146" width="12" height="16" fill="#0c0204" />
        <rect x="282" y="148" width="6" height="4" fill="#0c0204" />
        <rect x="298" y="148" width="6" height="4" fill="#0c0204" />
        <rect x="286" y="162" width="5" height="10" fill="#0c0204" />
        <rect x="293" y="162" width="5" height="10" fill="#0c0204" />
        <rect x="290" y="140" width="3" height="2" fill={p.neon1} opacity={0.7} />
        {/* Fighter 2 */}
        <rect x="342" y="136" width="8" height="8" fill="#0c0204" />
        <rect x="340" y="144" width="12" height="18" fill="#0c0204" />
        <rect x="352" y="146" width="6" height="4" fill="#0c0204" />
        <rect x="334" y="148" width="6" height="4" fill="#0c0204" />
        <rect x="340" y="162" width="5" height="10" fill="#0c0204" />
        <rect x="347" y="162" width="5" height="10" fill="#0c0204" />
        <rect x="345" y="138" width="3" height="2" fill={p.neon2} opacity={0.7} />
        {/* Impact effect */}
        <rect x="316" y="145" width="6" height="6" fill={p.neon1} opacity={0.4} />
        <rect x="310" y="140" width="4" height="4" fill={p.neon2} opacity={0.3} />
        <rect x="322" y="138" width="4" height="4" fill={p.neon1} opacity={0.25} />
        <rect x="318" y="152" width="4" height="4" fill={p.neon2} opacity={0.2} />
        {/* Crowd silhouettes — tiered */}
        {[222,232,242,398,408,418].map((cx, i) => (
          <g key={`fc${i}`}>
            <rect x={cx} y={140 + (i % 3) * 8} width="5" height="5" fill="#0c0204" opacity={0.5 - i * 0.04} />
            <rect x={cx - 1} y={145 + (i % 3) * 8} width="7" height="8" fill="#0c0204" opacity={0.4 - i * 0.03} />
          </g>
        ))}
        {/* Blood splatter */}
        <rect x="312" y="168" width="3" height="2" fill={p.neon1} opacity={0.15} />
        <rect x="320" y="170" width="4" height="2" fill={p.neon1} opacity={0.1} />
        <rect x="328" y="167" width="2" height="3" fill={p.neon1} opacity={0.12} />
        <NeonSign x={265} y={97} w={110} h={12} text="FIGHT PIT" color={p.neon1} glow={0.18} />
        {/* Overhead spotlight */}
        <rect x="318" y="95" width="4" height="4" fill={p.neon1} opacity={0.5} />
        <polygon points="310,99 330,99 340,130 300,130" fill={p.neon1} opacity={0.03} />
      </g>
    );
    case "lounge": return (
      <g>
        {/* Upscale bar interior */}
        <rect x="230" y="100" width="180" height="92" fill={p.buildingDark} />
        {/* Back wall shelves */}
        <rect x="245" y="108" width="150" height="3" fill={p.building} />
        <rect x="245" y="120" width="150" height="3" fill={p.building} />
        {/* Bottles — diverse shapes */}
        {[250,260,270,280,290,300,310,320,330,340,350,360,370,380].map((bx, i) => (
          <rect key={`bt${i}`} x={bx} y={108 - 4 - (i % 3) * 4} width="4" height={4 + (i % 3) * 4} fill={i % 3 === 0 ? p.neon1 : i % 3 === 1 ? p.neon2 : p.neon1} opacity={0.15 + (i % 4) * 0.05} />
        ))}
        {[252,264,276,288,300,312,324,336,348,360,372].map((bx, i) => (
          <rect key={`bt2${i}`} x={bx} y={120 - 3 - (i % 2) * 3} width="3" height={3 + (i % 2) * 3} fill={i % 2 === 0 ? p.neon2 : p.neon1} opacity={0.12 + (i % 3) * 0.05} />
        ))}
        {/* Mirror/backlight */}
        <rect x="248" y="105" width="144" height="1" fill={p.neon1} opacity={0.15} />
        {/* Bar counter — polished */}
        <rect x="242" y="145" width="156" height="8" fill={p.building} />
        <rect x="242" y="143" width="156" height="2" fill={p.neon1} opacity={0.2} />
        <rect x="242" y="145" width="156" height="1" fill="#fff" opacity={0.04} />
        {/* Bar stools with people */}
        {[262,292,322,352,382].map((sx, i) => (
          <g key={`bs${i}`}>
            <rect x={sx} y={153} width="8" height="14" fill={p.building} opacity={0.6} />
            <rect x={sx} y={151} width="8" height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.2} />
            {i % 2 === 0 && (
              <g>
                <rect x={sx + 1} y={138} width="5" height="5" fill="#080410" opacity={0.5} />
                <rect x={sx} y={143} width="7" height="8" fill="#080410" opacity={0.4} />
              </g>
            )}
          </g>
        ))}
        {/* Drinks on counter */}
        <rect x="270" y="140" width="3" height="5" fill={p.neon1} opacity={0.25} />
        <rect x="300" y="141" width="4" height="4" fill={p.neon2} opacity={0.2} />
        <rect x="340" y="140" width="3" height="5" fill={p.neon1} opacity={0.22} />
        {/* Neon mood lighting */}
        <rect x="240" y="130" width="1" height="12" fill={p.neon1} opacity={0.15} />
        <rect x="399" y="130" width="1" height="12" fill={p.neon2} opacity={0.12} />
        {/* VIP booth */}
        <rect x="235" y="165" width="40" height="20" fill={p.building} opacity={0.5} />
        <rect x="237" y="167" width="36" height="2" fill={p.neon2} opacity={0.15} />
        <rect x="365" y="168" width="40" height="18" fill={p.building} opacity={0.5} />
        <rect x="367" y="170" width="36" height="2" fill={p.neon1} opacity={0.15} />
        <NeonSign x={272} y={96} w={96} h={10} text="LOUNGE" color={p.neon1} />
        {/* Smoke wisps */}
        <rect x="280" y="132" width="2" height="6" fill="#fff" opacity={0.025} />
        <rect x="350" y="130" width="2" height="8" fill="#fff" opacity={0.02} />
      </g>
    );
    case "exploration-bay": return (
      <g>
        {/* Star chart command room */}
        <rect x="220" y="90" width="200" height="102" fill={p.buildingDark} />
        <rect x="220" y="90" width="200" height="2" fill={p.neon1} opacity={0.3} />
        {/* Massive holographic star map */}
        <rect x="245" y="100" width="150" height="70" fill={p.neon1} opacity={0.03} />
        <rect x="245" y="100" width="150" height="70" fill="none" stroke={p.neon1} strokeWidth="1" />
        {/* Star clusters */}
        {[260,280,300,320,340,360,380].map((sx, i) => (
          <g key={`sc${i}`}>
            <rect x={sx} y={108 + (i * 11) % 50} width="3" height="3" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3 + (i % 3) * 0.1} />
            <rect x={sx + 8} y={115 + (i * 13) % 45} width="2" height="2" fill={i % 2 === 0 ? p.neon2 : p.neon1} opacity={0.2 + (i % 3) * 0.08} />
          </g>
        ))}
        {/* Route lines connecting stars */}
        <line x1="263" y1="120" x2="283" y2="130" stroke={p.neon1} strokeWidth="0.7" opacity={0.3} strokeDasharray="3 2" shapeRendering="auto" />
        <line x1="283" y1="130" x2="323" y2="118" stroke={p.neon1} strokeWidth="0.7" opacity={0.25} strokeDasharray="3 2" shapeRendering="auto" />
        <line x1="323" y1="118" x2="363" y2="132" stroke={p.neon2} strokeWidth="0.7" opacity={0.2} strokeDasharray="3 2" shapeRendering="auto" />
        <line x1="363" y1="132" x2="383" y2="115" stroke={p.neon1} strokeWidth="0.7" opacity={0.18} strokeDasharray="3 2" shapeRendering="auto" />
        {/* Planet markers */}
        <circle cx="265" cy="120" r="4" fill={p.neon1} opacity={0.15} shapeRendering="auto" />
        <circle cx="265" cy="120" r="4" fill="none" stroke={p.neon1} strokeWidth="0.5" shapeRendering="auto" />
        <circle cx="323" cy="118" r="5" fill={p.neon2} opacity={0.12} shapeRendering="auto" />
        <circle cx="323" cy="118" r="5" fill="none" stroke={p.neon2} strokeWidth="0.5" shapeRendering="auto" />
        <circle cx="383" cy="115" r="3" fill={p.neon1} opacity={0.18} shapeRendering="auto" />
        <circle cx="383" cy="115" r="3" fill="none" stroke={p.neon1} strokeWidth="0.5" shapeRendering="auto" />
        {/* Nebula region */}
        <ellipse cx="310" cy="140" rx="25" ry="12" fill={p.neon2} opacity={0.04} shapeRendering="auto" />
        {/* Console desk */}
        <rect x="250" y="175" width="140" height="10" fill={p.building} />
        <rect x="250" y="173" width="140" height="2" fill={p.neon1} opacity={0.2} />
        {/* Console screens */}
        <rect x="260" y="176" width="18" height="6" fill={p.neon1} opacity={0.06} />
        <rect x="260" y="176" width="18" height="6" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="290" y="176" width="18" height="6" fill={p.neon2} opacity={0.06} />
        <rect x="290" y="176" width="18" height="6" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="330" y="176" width="18" height="6" fill={p.neon1} opacity={0.06} />
        <rect x="330" y="176" width="18" height="6" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="360" y="176" width="18" height="6" fill={p.neon2} opacity={0.06} />
        <rect x="360" y="176" width="18" height="6" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        {/* Navigator silhouette */}
        <rect x="315" y="162" width="6" height="6" fill="#040a14" opacity={0.5} />
        <rect x="314" y="168" width="8" height="8" fill="#040a14" opacity={0.4} />
        <NeonSign x={268} y={92} w={104} h={10} text="DEEP SPACE" color={p.neon1} />
        {/* Scanning sweep line */}
        <line x1="250" y1="135" x2="390" y2="135" stroke={p.neon1} strokeWidth="0.5" opacity={0.1} shapeRendering="auto" />
      </g>
    );
    case "info-broker": return (
      <g>
        {/* Dark surveillance room */}
        <rect x="230" y="95" width="180" height="97" fill={p.buildingDark} />
        {/* Wall of monitors — 3x4 grid */}
        {[0,1,2,3].map((col) => (
          [0,1,2].map((row) => {
            const mx = 245 + col * 38;
            const my = 102 + row * 24;
            const c = (col + row) % 2 === 0 ? p.neon1 : p.neon2;
            return (
              <g key={`mon${col}-${row}`}>
                <rect x={mx} y={my} width="30" height="18" fill={c} opacity={0.04} />
                <rect x={mx} y={my} width="30" height="18" fill="none" stroke={c} strokeWidth="0.5" />
                <rect x={mx + 2} y={my + 3} width={20 - row * 3} height="2" fill={c} opacity={0.35 - row * 0.06} />
                <rect x={mx + 2} y={my + 8} width={16 - col * 2} height="2" fill={c} opacity={0.25 - row * 0.04} />
                <rect x={mx + 2} y={my + 13} width={22 - (col + row) * 2} height="2" fill={c} opacity={0.2} />
              </g>
            );
          })
        ))}
        {/* Broker figure — hooded */}
        <rect x="316" y="168" width="8" height="8" fill="#06040c" />
        <rect x="314" y="176" width="12" height="14" fill="#06040c" />
        <path d="M312 168 L320 160 L328 168" fill="#06040c" />
        <rect x="318" y="171" width="3" height="2" fill={p.neon1} opacity={0.6} />
        {/* Holographic data streams */}
        {[250,270,290,350,370,390].map((dx, i) => (
          <g key={`ds${i}`}>
            <rect x={dx} y={170 + (i % 3) * 2} width="1" height={6 + i * 2} fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.15} />
          </g>
        ))}
        {/* Encrypted symbols */}
        <text x="250" y="98" fill={p.neon1} fontSize="4" fontFamily="monospace" opacity={0.2} shapeRendering="auto">01101001</text>
        <text x="350" y="98" fill={p.neon2} fontSize="4" fontFamily="monospace" opacity={0.15} shapeRendering="auto">DECRYPT</text>
        <NeonSign x={270} y={92} w={100} h={10} text="INFO BROKER" color={p.neon1} />
      </g>
    );
    case "smugglers-den": return (
      <g>
        {/* Hidden underground bay */}
        <rect x="220" y="100" width="200" height="92" fill={p.buildingDark} />
        {/* Low ceiling with hanging dim lights */}
        <rect x="220" y="100" width="200" height="4" fill={p.building} />
        {[240,280,320,360,400].map((lx, i) => (
          <g key={`hl${i}`}>
            <rect x={lx} y={104} width="1" height={4 + i % 3 * 2} fill="#fff" opacity={0.08} />
            <rect x={lx - 1} y={104 + 4 + i % 3 * 2} width="3" height="3" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.2} />
          </g>
        ))}
        {/* Cargo stacks — irregular */}
        <rect x="230" y="140" width="24" height="22" fill={p.building} />
        <rect x="230" y="140" width="24" height="22" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.4} />
        <rect x="232" y="142" width="5" height="5" fill={p.neon1} opacity={0.2} />
        <rect x="230" y="128" width="20" height="12" fill={p.building} />
        <rect x="230" y="128" width="20" height="12" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.35} />
        <rect x="260" y="145" width="18" height="17" fill={p.building} />
        <rect x="260" y="145" width="18" height="17" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="260" y="136" width="14" height="9" fill={p.building} />
        <rect x="260" y="136" width="14" height="9" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.3} />
        <rect x="300" y="138" width="26" height="24" fill={p.building} />
        <rect x="300" y="138" width="26" height="24" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.4} />
        <rect x="304" y="142" width="6" height="6" fill={p.neon2} opacity={0.2} />
        <rect x="300" y="126" width="22" height="12" fill={p.building} />
        <rect x="300" y="126" width="22" height="12" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.35} />
        <rect x="340" y="142" width="20" height="20" fill={p.building} />
        <rect x="340" y="142" width="20" height="20" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="370" y="148" width="16" height="14" fill={p.building} />
        <rect x="370" y="148" width="16" height="14" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.35} />
        <rect x="393" y="145" width="20" height="17" fill={p.building} />
        <rect x="393" y="145" width="20" height="17" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.3} />
        {/* Smuggler figure */}
        <rect x="282" y="158" width="6" height="6" fill="#060410" opacity={0.5} />
        <rect x="281" y="164" width="8" height="12" fill="#060410" opacity={0.4} />
        <rect x="283" y="161" width="3" height="1" fill={p.neon2} opacity={0.4} />
        {/* Suspicious glowing crate (open) */}
        <rect x="350" y="162" width="20" height="14" fill={p.building} />
        <rect x="350" y="162" width="20" height="14" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.5} />
        <rect x="352" y="164" width="16" height="10" fill={p.neon1} opacity={0.06} />
        <rect x="354" y="166" width="4" height="4" fill={p.neon1} opacity={0.3} />
        <rect x="362" y="166" width="4" height="4" fill={p.neon2} opacity={0.25} />
        {/* Secret door */}
        <rect x="395" y="115" width="18" height="30" fill={p.building} opacity={0.5} />
        <rect x="395" y="115" width="18" height="30" fill="none" stroke={p.neon2} strokeWidth="0.5" strokeDasharray="2 2" />
        <NeonSign x={275} y={108} w={90} h={10} text="SMUGGLER" color={p.neon1} />
      </g>
    );
    case "mining-rig": return (
      <g>
        {/* Massive drill rig */}
        <rect x="255" y="80" width="130" height="112" fill={p.buildingDark} />
        {/* Drill tower */}
        <rect x="305" y="40" width="30" height="40" fill={p.building} />
        <rect x="315" y="20" width="10" height="20" fill={p.building} />
        <rect x="318" y="12" width="4" height="8" fill={p.neon1} opacity={0.6} />
        {/* Drill bit */}
        <polygon points="316,16 320,4 324,16" fill={p.neon1} opacity={0.3} />
        {/* Support beams — cross-braced */}
        <line x1="260" y1="80" x2="305" y2="50" stroke={p.building} strokeWidth="2" shapeRendering="auto" />
        <line x1="380" y1="80" x2="335" y2="50" stroke={p.building} strokeWidth="2" shapeRendering="auto" />
        <line x1="280" y1="80" x2="320" y2="55" stroke={p.building} strokeWidth="1" opacity={0.5} shapeRendering="auto" />
        <line x1="360" y1="80" x2="320" y2="55" stroke={p.building} strokeWidth="1" opacity={0.5} shapeRendering="auto" />
        {/* Conveyor belts */}
        <rect x="255" y="165" width="130" height="6" fill={p.building} />
        {[260,278,296,314,332,350,368].map((cx, i) => (
          <rect key={`mc${i}`} x={cx} y={165} width="10" height="6" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.1} />
        ))}
        {/* Ore chunks on conveyor */}
        <rect x="270" y="158" width="8" height="7" fill={p.neon2} opacity={0.25} />
        <rect x="305" y="156" width="10" height="9" fill={p.neon1} opacity={0.2} />
        <rect x="345" y="158" width="7" height="7" fill={p.neon2} opacity={0.22} />
        {/* Processing machines */}
        <rect x="260" y="115" width="30" height="30" fill={p.building} />
        <rect x="260" y="115" width="30" height="30" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.4} />
        <circle cx="275" cy="130" r="8" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        <rect x="350" y="112" width="30" height="33" fill={p.building} />
        <rect x="350" y="112" width="30" height="33" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <circle cx="365" cy="128" r="8" fill="none" stroke={p.neon2} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        {/* Workers */}
        {[265,340,390].map((wx, i) => (
          <g key={`mw${i}`}>
            <rect x={wx} y={150} width="5" height="5" fill="#0a0804" opacity={0.5} />
            <rect x={wx - 1} y={155} width="7" height="10" fill="#0a0804" opacity={0.4} />
          </g>
        ))}
        {/* Depth indicator */}
        <rect x="250" y="88" width="4" height="80" fill={p.neon1} opacity={0.08} />
        {[92,108,124,140,156].map((dy, i) => (
          <rect key={`di${i}`} x={248} y={dy} width="8" height="1" fill={p.neon1} opacity={0.15} />
        ))}
        <NeonSign x={275} y={80} w={90} h={10} text="MINE" color={p.neon1} />
      </g>
    );
    case "outpost": return (
      <g>
        {/* Remote outpost building */}
        <rect x="270" y="110" width="100" height="82" fill={p.buildingDark} />
        <rect x="270" y="110" width="100" height="2" fill={p.neon1} opacity={0.25} />
        {/* Communications tower */}
        <rect x="312" y="50" width="16" height="60" fill={p.building} />
        <rect x="304" y="50" width="32" height="4" fill={p.building} />
        <rect x="308" y="60" width="24" height="3" fill={p.building} />
        <rect x="312" y="70" width="16" height="3" fill={p.building} />
        <rect x="318" y="42" width="4" height="8" fill={p.neon1} opacity={0.6} />
        {/* Blinking light */}
        <rect x="319" y="44" width="2" height="2" fill={p.neon1} opacity={0.8} />
        {/* Signal waves */}
        <circle cx="320" cy="46" r="10" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.12} strokeDasharray="2 2" shapeRendering="auto" />
        <circle cx="320" cy="46" r="18" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.08} strokeDasharray="2 3" shapeRendering="auto" />
        <circle cx="320" cy="46" r="26" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.05} strokeDasharray="3 3" shapeRendering="auto" />
        {/* Windows */}
        <Windows x={280} y={118} cols={6} rows={5} size={4} gap={6} c1={p.neon1} c2={p.neon2} />
        {/* Barricades / defenses */}
        <rect x="235" y="170" width="35" height="12" fill={p.building} />
        <rect x="235" y="168" width="35" height="2" fill={p.neon1} opacity={0.2} />
        <rect x="242" y="165" width="4" height="3" fill={p.neon1} opacity={0.15} />
        <rect x="370" y="172" width="35" height="10" fill={p.building} />
        <rect x="370" y="170" width="35" height="2" fill={p.neon2} opacity={0.2} />
        <rect x="390" y="167" width="4" height="3" fill={p.neon2} opacity={0.15} />
        {/* Guard towers */}
        <rect x="240" y="135" width="16" height="33" fill={p.building} opacity={0.5} />
        <rect x="240" y="135" width="16" height="2" fill={p.neon1} opacity={0.2} />
        <rect x="384" y="138" width="16" height="30" fill={p.building} opacity={0.5} />
        <rect x="384" y="138" width="16" height="2" fill={p.neon2} opacity={0.2} />
        <Searchlight x={248} y={135} angle={15} color={p.neon1} length={50} />
        <Searchlight x={392} y={138} angle={-12} color={p.neon2} length={50} />
        <NeonSign x={280} y={104} w={80} h={10} text="OUTPOST" color={p.neon1} />
        {/* Fence */}
        {[250,260,380,390,400].map((fx, i) => (
          <rect key={`fn${i}`} x={fx} y={175} width="1" height="10" fill={p.neon1} opacity={0.1} />
        ))}
      </g>
    );
    case "refinery": return (
      <g>
        {/* Industrial refinery complex */}
        <rect x="220" y="90" width="200" height="102" fill={p.buildingDark} />
        {/* Distillation towers */}
        <rect x="235" y="55" width="18" height="35" fill={p.building} />
        <rect x="240" y="48" width="8" height="7" fill={p.building} />
        <rect x="242" y="42" width="4" height="6" fill={p.neon1} opacity={0.4} />
        <rect x="265" y="62" width="14" height="28" fill={p.building} />
        <rect x="269" y="56" width="6" height="6" fill={p.building} />
        <rect x="400" y="52" width="16" height="38" fill={p.building} />
        <rect x="404" y="45" width="8" height="7" fill={p.building} />
        <rect x="406" y="40" width="4" height="5" fill={p.neon1} opacity={0.35} />
        {/* Complex pipe network */}
        <rect x="252" y="75" width="158" height="3" fill={p.building} opacity={0.6} />
        <rect x="235" y="95" width="180" height="3" fill={p.building} opacity={0.5} />
        <rect x="240" y="112" width="170" height="3" fill={p.building} opacity={0.45} />
        {/* Vertical pipe connections */}
        {[255,290,320,355,390].map((px, i) => (
          <rect key={`vp${i}`} x={px} y={75 + (i % 2) * 8} width="3" height={20 + i * 3} fill={p.building} opacity={0.4} />
        ))}
        {/* Pipe joints — glowing */}
        {[258,293,358,393].map((jx, i) => (
          <g key={`pj${i}`}>
            <rect x={jx} y={93 + (i % 2) * 18} width="6" height="6" fill={p.building} />
            <rect x={jx} y={93 + (i % 2) * 18} width="6" height="6" fill="none" stroke={i % 2 === 0 ? p.neon1 : p.neon2} strokeWidth="0.5" opacity={0.4} />
          </g>
        ))}
        {/* Furnace with flame */}
        <rect x="300" y="130" width="40" height="30" fill={p.building} />
        <rect x="300" y="130" width="40" height="30" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.5} />
        <rect x="308" y="138" width="24" height="16" fill={p.neon1} opacity={0.12} />
        <rect x="314" y="140" width="12" height="10" fill={p.neon1} opacity={0.2} />
        <rect x="318" y="136" width="4" height="6" fill={p.neon2} opacity={0.3} />
        {/* Flame flickers */}
        <rect x="316" y="132" width="3" height="4" fill={p.neon1} opacity={0.15} />
        <rect x="322" y="130" width="2" height="4" fill={p.neon2} opacity={0.1} />
        {/* Storage tanks */}
        <rect x="230" y="135" width="25" height="30" fill={p.building} opacity={0.5} />
        <ellipse cx="242" cy="135" rx="12" ry="4" fill={p.building} opacity={0.6} shapeRendering="auto" />
        <rect x="385" y="130" width="25" height="35" fill={p.building} opacity={0.5} />
        <ellipse cx="397" cy="130" rx="12" ry="4" fill={p.building} opacity={0.6} shapeRendering="auto" />
        {/* Steam vents */}
        {[248,345,395].map((vx, i) => (
          <rect key={`sv${i}`} x={vx} y={80 - i * 5} width="3" height={8 + i * 2} fill="#fff" opacity={0.03 + i * 0.005} />
        ))}
        <NeonSign x={270} y={88} w={100} h={10} text="REFINERY" color={p.neon1} />
      </g>
    );
    case "salvage-yard": return (
      <g>
        {/* Scrap landscape */}
        <polygon points="200,192 215,150 235,162 255,140 275,158 295,142 320,160 345,138 365,155 385,145 405,165 425,148 440,192" fill={p.buildingDark} />
        {/* Wrecked ship hulls */}
        <polygon points="260,130 305,110 350,130 345,150 265,150" fill={p.building} opacity={0.6} />
        <rect x="285" y="118" width="24" height="4" fill={p.neon1} opacity={0.15} />
        <rect x="275" y="125" width="8" height="3" fill={p.neon1} opacity={0.1} />
        {/* Ship damage */}
        <line x1="270" y1="125" x2="290" y2="142" stroke={p.neon2} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        <line x1="330" y1="122" x2="310" y2="140" stroke={p.neon2} strokeWidth="0.5" opacity={0.2} shapeRendering="auto" />
        {/* Second wreck (smaller) */}
        <polygon points="375,148 395,135 415,148 412,158 378,158" fill={p.building} opacity={0.4} />
        <rect x="388" y="140" width="10" height="3" fill={p.neon2} opacity={0.1} />
        {/* Crane — large */}
        <rect x="430" y="80" width="8" height="112" fill={p.building} />
        <rect x="380" y="80" width="60" height="5" fill={p.building} />
        <rect x="395" y="85" width="4" height="4" fill={p.neon1} opacity={0.3} />
        <line x1="398" y1="85" x2="398" y2="130" stroke={p.neon1} strokeWidth="0.7" opacity={0.3} shapeRendering="auto" />
        <rect x="394" y="130" width="8" height="5" fill={p.neon1} opacity={0.2} />
        {/* Scrap piles detail */}
        {[210,225,240,260,280,310,340,360,385,410].map((sx, i) => (
          <g key={`sd${i}`}>
            <rect x={sx} y={165 + (i % 3) * 5} width={8 + i % 4 * 3} height={6 + i % 3 * 2} fill={p.building} opacity={0.25 + i * 0.02} />
            {i % 3 === 0 && <rect x={sx + 2} y={167 + (i % 3) * 5} width="3" height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.15} />}
          </g>
        ))}
        {/* Sparking wires */}
        <rect x="285" y="148" width="2" height="2" fill={p.neon1} opacity={0.4} />
        <rect x="330" y="152" width="2" height="2" fill={p.neon2} opacity={0.3} />
        {/* Workers with cutting tools */}
        <rect x="300" y="152" width="5" height="5" fill="#0a0a04" opacity={0.5} />
        <rect x="299" y="157" width="7" height="10" fill="#0a0a04" opacity={0.4} />
        <rect x="306" y="155" width="6" height="2" fill={p.neon1} opacity={0.3} />
        <NeonSign x={260} y={105} w={90} h={10} text="SALVAGE" color={p.neon2} />
      </g>
    );
    case "pawn-shop": return (
      <g>
        {/* Street-level pawn shop */}
        <rect x="250" y="105" width="140" height="87" fill={p.buildingDark} />
        <rect x="250" y="105" width="140" height="2" fill={p.neon1} opacity={0.3} />
        {/* Large storefront windows */}
        <rect x="258" y="130" width="50" height="35" fill={p.neon1} opacity={0.05} />
        <rect x="258" y="130" width="50" height="35" fill="none" stroke={p.neon1} strokeWidth="1" />
        <rect x="332" y="130" width="50" height="35" fill={p.neon2} opacity={0.05} />
        <rect x="332" y="130" width="50" height="35" fill="none" stroke={p.neon2} strokeWidth="1" />
        {/* Items in left window */}
        <rect x="264" y="140" width="8" height="14" fill={p.neon1} opacity={0.2} />
        <rect x="276" y="144" width="10" height="10" fill={p.neon2} opacity={0.18} />
        <rect x="290" y="142" width="6" height="12" fill={p.neon1} opacity={0.15} />
        <rect x="264" y="156" width="12" height="6" fill={p.neon2} opacity={0.12} />
        {/* Items in right window */}
        <rect x="338" y="138" width="12" height="8" fill={p.neon1} opacity={0.2} />
        <rect x="354" y="142" width="8" height="12" fill={p.neon2} opacity={0.18} />
        <rect x="366" y="140" width="10" height="8" fill={p.neon1} opacity={0.15} />
        <rect x="340" y="152" width="14" height="8" fill={p.neon2} opacity={0.12} />
        {/* Center door */}
        <rect x="310" y="140" width="20" height="32" fill={p.building} />
        <rect x="310" y="140" width="20" height="2" fill={p.neon1} opacity={0.25} />
        <rect x="326" y="152" width="3" height="3" fill={p.neon2} opacity={0.3} />
        {/* Massive neon sign */}
        <NeonSign x={262} y={107} w={116} h={14} text="PAWN SHOP" color={p.neon1} glow={0.16} />
        {/* Smaller signs */}
        <NeonSign x={258} y={122} w={40} h={8} text="BUY" color={p.neon2} />
        <NeonSign x={342} y={122} w={40} h={8} text="SELL" color={p.neon1} />
        {/* Awning */}
        <polygon points="248,130 250,124 390,124 392,130" fill={p.building} opacity={0.4} />
        {/* Hanging items outside */}
        <rect x="248" y="132" width="1" height="6" fill="#fff" opacity={0.06} />
        <rect x="246" y="138" width="5" height="5" fill={p.neon2} opacity={0.1} />
        <rect x="392" y="132" width="1" height="5" fill="#fff" opacity={0.06} />
        <rect x="390" y="137" width="5" height="5" fill={p.neon1} opacity={0.1} />
        {/* Customer */}
        <rect x="305" y="168" width="5" height="5" fill="#0a0804" opacity={0.5} />
        <rect x="304" y="173" width="7" height="10" fill="#0a0804" opacity={0.4} />
      </g>
    );
    case "tattoo-parlor": return (
      <g>
        {/* Neon-drenched parlor */}
        <rect x="250" y="100" width="140" height="92" fill={p.buildingDark} />
        <rect x="250" y="100" width="140" height="2" fill={p.neon1} opacity={0.4} />
        {/* Giant neon tattoo sign */}
        <NeonSign x={255} y={85} w={130} h={16} text="TATTOO INK" color={p.neon1} glow={0.2} />
        {/* Neon art outlines on building facade */}
        <path d="M258 108 Q268 102 278 108 Q288 114 298 108" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.25} shapeRendering="auto" />
        <path d="M342 108 Q352 102 362 108 Q372 114 382 108" fill="none" stroke={p.neon2} strokeWidth="1" opacity={0.2} shapeRendering="auto" />
        {/* Windows showing interior */}
        <rect x="260" y="120" width="30" height="22" fill={p.neon1} opacity={0.05} />
        <rect x="260" y="120" width="30" height="22" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="350" y="120" width="30" height="22" fill={p.neon2} opacity={0.05} />
        <rect x="350" y="120" width="30" height="22" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        {/* Tattoo chair visible */}
        <rect x="300" y="142" width="28" height="8" fill={p.building} />
        <rect x="328" y="135" width="6" height="15" fill={p.building} />
        <rect x="298" y="150" width="4" height="10" fill={p.building} />
        <rect x="326" y="150" width="4" height="10" fill={p.building} />
        {/* Ink gun / machine */}
        <rect x="270" y="138" width="4" height="18" fill={p.neon2} opacity={0.35} />
        <rect x="268" y="136" width="8" height="4" fill={p.neon2} opacity={0.25} />
        <line x1="274" y1="142" x2="290" y2="148" stroke={p.neon2} strokeWidth="0.7" opacity={0.3} shapeRendering="auto" />
        {/* Flash art samples on walls */}
        {[262,275,288,352,365,378].map((ax, i) => (
          <g key={`fa${i}`}>
            <rect x={ax} y={122 + (i % 2) * 8} width="8" height="8" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.06} />
            <rect x={ax} y={122 + (i % 2) * 8} width="8" height="8" fill="none" stroke={i % 2 === 0 ? p.neon1 : p.neon2} strokeWidth="0.5" />
          </g>
        ))}
        {/* Neon border strips */}
        <rect x="250" y="100" width="1" height="92" fill={p.neon1} opacity={0.15} />
        <rect x="389" y="100" width="1" height="92" fill={p.neon2} opacity={0.12} />
        {/* Door */}
        <rect x="310" y="155" width="18" height="28" fill={p.building} />
        <rect x="310" y="155" width="18" height="2" fill={p.neon1} opacity={0.2} />
        {/* Customer getting tattooed */}
        <rect x="302" y="135" width="5" height="5" fill="#0a0418" opacity={0.5} />
        <rect x="301" y="140" width="7" height="4" fill="#0a0418" opacity={0.4} />
        <NeonSign x={292} y={166} w={54} h={9} text="OPEN" color={p.neon2} />
      </g>
    );
    case "university": return (
      <g>
        {/* Grand university campus */}
        <rect x="220" y="95" width="200" height="97" fill={p.buildingDark} />
        {/* Central dome */}
        <path d="M280 95 L320 62 L360 95" fill={p.building} stroke={p.neon1} strokeWidth="1" opacity={0.5} />
        <circle cx="320" cy="76" r="8" fill={p.neon1} opacity={0.1} shapeRendering="auto" />
        <circle cx="320" cy="76" r="8" fill="none" stroke={p.neon1} strokeWidth="1" shapeRendering="auto" />
        <rect x="318" y="55" width="4" height="7" fill={p.neon1} opacity={0.4} />
        {/* Wings */}
        <rect x="192" y="115" width="28" height="77" fill={p.buildingDark} />
        <rect x="420" y="115" width="28" height="77" fill={p.buildingDark} />
        {/* Columns — classical */}
        {[240,260,280,360,380,400].map((cx, i) => (
          <g key={`uc${i}`}>
            <rect x={cx} y={95} width="6" height="97" fill={p.building} opacity={0.3} />
            <rect x={cx - 1} y={95} width="8" height="3" fill={p.building} opacity={0.4} />
            <rect x={cx - 1} y={189} width="8" height="3" fill={p.building} opacity={0.4} />
          </g>
        ))}
        {/* Knowledge displays */}
        <rect x="290" y="105" width="60" height="35" fill={p.neon1} opacity={0.04} />
        <rect x="290" y="105" width="60" height="35" fill="none" stroke={p.neon1} strokeWidth="1" />
        {[110,118,126,134].map((ly, i) => (
          <rect key={`kd${i}`} x={294} y={ly} width={50 - i * 6} height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3 - i * 0.04} />
        ))}
        {/* Library shelves */}
        {[0,1,2].map((row) => (
          <g key={`ls${row}`}>
            <rect x={230} y={148 + row * 12} width="80" height="2" fill={p.building} />
            {[232,242,252,262,272,282,292].map((bx, i) => (
              <rect key={`bk${row}-${i}`} x={bx} y={148 + row * 12 - 6 - (i % 3) * 2} width="4" height={6 + (i % 3) * 2} fill={i % 3 === 0 ? p.neon1 : i % 3 === 1 ? p.neon2 : p.neon1} opacity={0.1 + (i % 4) * 0.03} />
            ))}
          </g>
        ))}
        {/* Students */}
        {[250,270,365,385].map((sx, i) => (
          <g key={`su${i}`}>
            <rect x={sx} y={175} width="5" height="5" fill="#040810" opacity={0.4} />
            <rect x={sx - 1} y={180} width="7" height="8" fill="#040810" opacity={0.35} />
          </g>
        ))}
        <NeonSign x={275} y={85} w={90} h={10} text="UNIVERSITY" color={p.neon1} />
        {/* Floating holographic symbol */}
        <text x="320" y="152" fill={p.neon1} fontSize="8" fontFamily="monospace" opacity={0.15} shapeRendering="auto">Ω</text>
      </g>
    );
    case "bank": return (
      <g>
        {/* Fortified bank building */}
        <rect x="245" y="90" width="150" height="102" fill={p.buildingDark} />
        <rect x="245" y="90" width="150" height="3" fill={p.neon1} opacity={0.35} />
        {/* Imposing columns */}
        {[255,285,345,375].map((cx, i) => (
          <g key={`bc${i}`}>
            <rect x={cx} y={93} width="8" height="99" fill={p.building} opacity={0.35} />
            <rect x={cx - 1} y={93} width="10" height="4" fill={p.building} opacity={0.4} />
          </g>
        ))}
        {/* Giant vault door */}
        <circle cx="320" cy="148" r="28" fill={p.building} shapeRendering="auto" />
        <circle cx="320" cy="148" r="28" fill="none" stroke={p.neon1} strokeWidth="2" opacity={0.5} shapeRendering="auto" />
        <circle cx="320" cy="148" r="20" fill="none" stroke={p.neon1} strokeWidth="1" strokeDasharray="5 3" opacity={0.25} shapeRendering="auto" />
        <circle cx="320" cy="148" r="10" fill={p.neon1} opacity={0.1} shapeRendering="auto" />
        <circle cx="320" cy="148" r="10" fill="none" stroke={p.neon1} strokeWidth="1.5" shapeRendering="auto" />
        <circle cx="320" cy="148" r="4" fill={p.neon1} opacity={0.2} shapeRendering="auto" />
        {/* Handle spokes */}
        <rect x="335" y="143" width="18" height="3" fill={p.neon2} opacity={0.35} />
        <rect x="319" y="125" width="3" height="18" fill={p.neon2} opacity={0.25} />
        {/* Gold / credit stacks through windows */}
        <rect x="252" y="115" width="22" height="18" fill={p.neon2} opacity={0.06} />
        <rect x="252" y="115" width="22" height="18" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="256" y="122" width="14" height="4" fill={p.neon2} opacity={0.2} />
        <rect x="258" y="118" width="10" height="4" fill={p.neon2} opacity={0.15} />
        <rect x="366" y="115" width="22" height="18" fill={p.neon2} opacity={0.06} />
        <rect x="366" y="115" width="22" height="18" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="370" y="120" width="14" height="4" fill={p.neon2} opacity={0.18} />
        <rect x="372" y="126" width="10" height="4" fill={p.neon2} opacity={0.12} />
        {/* Security cameras */}
        <rect x="248" y="95" width="6" height="4" fill={p.building} />
        <rect x="250" y="99" width="2" height="4" fill={p.neon1} opacity={0.3} />
        <rect x="386" y="95" width="6" height="4" fill={p.building} />
        <rect x="388" y="99" width="2" height="4" fill={p.neon1} opacity={0.3} />
        {/* Laser grid */}
        <line x1="250" y1="135" x2="390" y2="135" stroke={p.neon1} strokeWidth="0.5" opacity={0.06} shapeRendering="auto" />
        <line x1="250" y1="160" x2="390" y2="160" stroke={p.neon1} strokeWidth="0.5" opacity={0.06} shapeRendering="auto" />
        <NeonSign x={268} y={92} w={104} h={12} text="BANK" color={p.neon1} glow={0.14} />
        {/* Armored guards */}
        {[248,385].map((gx, i) => (
          <g key={`bg${i}`}>
            <rect x={gx} y={168} width="6" height="6" fill="#060c10" opacity={0.5} />
            <rect x={gx - 1} y={174} width="8" height="12" fill="#060c10" opacity={0.4} />
          </g>
        ))}
      </g>
    );
    case "battle": return (
      <g>
        {/* War arena */}
        <rect x="210" y="90" width="220" height="102" fill={p.buildingDark} />
        <rect x="210" y="90" width="220" height="3" fill={p.neon1} opacity={0.4} />
        {/* Mecha 1 — large left */}
        <rect x="255" y="115" width="18" height="18" fill="#0c0410" />
        <rect x="249" y="107" width="30" height="8" fill="#0c0410" />
        <rect x="259" y="97" width="10" height="10" fill="#0c0410" />
        <rect x="249" y="133" width="8" height="20" fill="#0c0410" />
        <rect x="271" y="133" width="8" height="20" fill="#0c0410" />
        <rect x="240" y="118" width="9" height="4" fill={p.neon1} opacity={0.5} />
        <rect x="279" y="115" width="12" height="3" fill={p.neon1} opacity={0.3} />
        <rect x="261" y="100" width="3" height="2" fill={p.neon1} opacity={0.8} />
        <rect x="265" y="100" width="3" height="2" fill={p.neon1} opacity={0.7} />
        {/* Mecha 2 — large right */}
        <rect x="365" y="112" width="18" height="20" fill="#0c0410" />
        <rect x="359" y="104" width="30" height="8" fill="#0c0410" />
        <rect x="369" y="94" width="10" height="10" fill="#0c0410" />
        <rect x="359" y="132" width="8" height="22" fill="#0c0410" />
        <rect x="381" y="132" width="8" height="22" fill="#0c0410" />
        <rect x="389" y="115" width="9" height="4" fill={p.neon2} opacity={0.5} />
        <rect x="347" y="112" width="12" height="3" fill={p.neon2} opacity={0.3} />
        <rect x="371" y="97" width="3" height="2" fill={p.neon2} opacity={0.8} />
        <rect x="375" y="97" width="3" height="2" fill={p.neon2} opacity={0.7} />
        {/* Explosion between them */}
        <rect x="316" y="115" width="8" height="8" fill={p.neon1} opacity={0.4} />
        <rect x="310" y="108" width="6" height="6" fill={p.neon2} opacity={0.3} />
        <rect x="324" y="110" width="5" height="5" fill={p.neon1} opacity={0.25} />
        <rect x="312" y="122" width="5" height="5" fill={p.neon2} opacity={0.2} />
        <rect x="326" y="120" width="4" height="4" fill={p.neon1} opacity={0.2} />
        <rect x="308" y="118" width="3" height="3" fill={p.neon2} opacity={0.15} />
        {/* Laser beams */}
        <line x1="291" y1="118" x2="316" y2="118" stroke={p.neon1} strokeWidth="1.5" opacity={0.2} shapeRendering="auto" />
        <line x1="347" y1="115" x2="325" y2="118" stroke={p.neon2} strokeWidth="1.5" opacity={0.2} shapeRendering="auto" />
        {/* Arena crowd */}
        {[215,225,235,400,410,420].map((cx, i) => (
          <g key={`ac${i}`}>
            <rect x={cx} y={140 + (i % 3) * 10} width="5" height="5" fill="#0c0410" opacity={0.4 - i * 0.03} />
            <rect x={cx - 1} y={145 + (i % 3) * 10} width="7" height="8" fill="#0c0410" opacity={0.35 - i * 0.02} />
          </g>
        ))}
        {/* Scoreboard */}
        <rect x="290" y="92" width="60" height="14" fill={p.neon1} opacity={0.04} />
        <rect x="290" y="92" width="60" height="14" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <text x="320" y="101" textAnchor="middle" fill={p.neon1} fontSize="5" fontFamily="monospace" opacity={0.4} shapeRendering="auto">12 — 8</text>
        <NeonSign x={265} y={88} w={110} h={10} text="ARENA" color={p.neon1} glow={0.16} />
        {/* Debris */}
        {[300,315,328,340].map((dx, i) => (
          <rect key={`db${i}`} x={dx} y={155 + (i % 3) * 5} width={3 + i % 2 * 2} height={2 + i % 2} fill={p.building} opacity={0.2} />
        ))}
      </g>
    );
    case "gym": return (
      <g>
        {/* Training facility */}
        <rect x="230" y="95" width="180" height="97" fill={p.buildingDark} />
        <rect x="230" y="95" width="180" height="2" fill={p.neon1} opacity={0.35} />
        {/* Heavy weight rack — left */}
        <rect x="242" y="105" width="4" height="60" fill={p.building} />
        <rect x="250" y="105" width="4" height="60" fill={p.building} />
        {[115,130,145].map((wy, i) => (
          <g key={`wr${i}`}>
            <rect x={236} y={wy} width="24" height="3" fill={p.building} />
            <rect x={234} y={wy - 1} width="8" height="5" fill={p.neon1} opacity={0.2 + i * 0.05} />
            <rect x={254} y={wy - 1} width="8" height="5" fill={p.neon1} opacity={0.2 + i * 0.05} />
          </g>
        ))}
        {/* Mecha training pod — center */}
        <rect x="290" y="108" width="60" height="55" fill={p.building} />
        <rect x="290" y="108" width="60" height="55" fill="none" stroke={p.neon1} strokeWidth="1" opacity={0.4} />
        <rect x="300" y="118" width="40" height="35" fill={p.neon1} opacity={0.04} />
        {/* Mecha silhouette in pod */}
        <rect x="314" y="122" width="12" height="12" fill={p.neon1} opacity={0.08} />
        <rect x="312" y="134" width="16" height="14" fill={p.neon1} opacity={0.06} />
        <rect x="316" y="124" width="3" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="321" y="124" width="3" height="2" fill={p.neon1} opacity={0.25} />
        {/* Status displays on pod */}
        <rect x="292" y="110" width="16" height="6" fill={p.neon1} opacity={0.06} />
        <rect x="292" y="110" width="16" height="6" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="332" y="110" width="16" height="6" fill={p.neon2} opacity={0.06} />
        <rect x="332" y="110" width="16" height="6" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        {/* Punching bags */}
        <rect x="370" y="110" width="2" height="8" fill={p.building} />
        <rect x="364" y="118" width="14" height="28" fill={p.building} />
        <rect x="364" y="118" width="14" height="28" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.5} />
        <rect x="368" y="124" width="6" height="6" fill={p.neon2} opacity={0.12} />
        <rect x="385" y="112" width="2" height="6" fill={p.building} />
        <rect x="380" y="118" width="12" height="24" fill={p.building} />
        <rect x="380" y="118" width="12" height="24" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        {/* Bench press */}
        <rect x="260" y="168" width="30" height="4" fill={p.building} />
        <rect x="256" y="164" width="6" height="12" fill={p.neon2} opacity={0.15} />
        <rect x="286" y="164" width="6" height="12" fill={p.neon2} opacity={0.15} />
        <rect x="260" y="166" width="30" height="2" fill={p.building} />
        {/* Fighter training */}
        <rect x="330" y="160" width="6" height="6" fill="#0c0804" opacity={0.5} />
        <rect x="329" y="166" width="8" height="10" fill="#0c0804" opacity={0.4} />
        <rect x="355" y="158" width="6" height="6" fill="#0c0804" opacity={0.5} />
        <rect x="354" y="164" width="8" height="12" fill="#0c0804" opacity={0.4} />
        <NeonSign x={268} y={95} w={104} h={10} text="GYM" color={p.neon1} />
        {/* Energy drink vending machine */}
        <rect x="396" y="150" width="12" height="24" fill={p.building} />
        <rect x="396" y="150" width="12" height="24" fill="none" stroke={p.neon2} strokeWidth="0.5" opacity={0.4} />
        <rect x="398" y="152" width="8" height="4" fill={p.neon2} opacity={0.12} />
        <rect x="398" y="160" width="8" height="4" fill={p.neon1} opacity={0.1} />
      </g>
    );
    case "heroes": return (
      <g>
        {/* Hero deployment barracks */}
        <rect x="225" y="90" width="190" height="102" fill={p.buildingDark} />
        <rect x="225" y="90" width="190" height="2" fill={p.neon1} opacity={0.35} />
        {/* Cryo/deployment pods — detailed */}
        {[0,1,2,3,4].map((i) => {
          const px = 240 + i * 34;
          const c = i % 2 === 0 ? p.neon1 : p.neon2;
          const active = i < 3;
          return (
            <g key={`hp${i}`}>
              <rect x={px} y={100} width={26} height={52} fill={p.building} />
              <rect x={px} y={100} width={26} height={52} fill="none" stroke={c} strokeWidth={active ? 1 : 0.5} opacity={active ? 0.5 : 0.25} />
              <rect x={px + 3} y={108} width={20} height={32} fill={c} opacity={active ? 0.06 : 0.02} />
              {active && (
                <>
                  <rect x={px + 8} y={114} width={8} height={8} fill={c} opacity={0.1} />
                  <rect x={px + 6} y={122} width={12} height={14} fill={c} opacity={0.08} />
                </>
              )}
              <rect x={px + 10} y={102} width={6} height="3" fill={c} opacity={active ? 0.6 : 0.15} />
              <rect x={px} y={150} width={26} height="4" fill={p.building} opacity={0.5} />
            </g>
          );
        })}
        {/* Hero stats display */}
        <rect x="232" y="160" width="60" height="22" fill={p.neon1} opacity={0.04} />
        <rect x="232" y="160" width="60" height="22" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="236" y="164" width="40" height="2" fill={p.neon1} opacity={0.3} />
        <rect x="236" y="170" width="30" height="2" fill={p.neon2} opacity={0.2} />
        <rect x="236" y="176" width="45" height="2" fill={p.neon1} opacity={0.25} />
        {/* Equipment rack */}
        <rect x="350" y="158" width="50" height="26" fill={p.building} opacity={0.4} />
        <rect x="354" y="162" width="8" height="16" fill={p.neon1} opacity={0.12} />
        <rect x="366" y="162" width="6" height="16" fill={p.neon2} opacity={0.1} />
        <rect x="376" y="162" width="10" height="16" fill={p.neon1} opacity={0.08} />
        <rect x="390" y="162" width="6" height="16" fill={p.neon2} opacity={0.1} />
        <NeonSign x={270} y={88} w={100} h={10} text="HERO BAY" color={p.neon1} />
      </g>
    );
    case "house": return (
      <g>
        {/* Personal quarters */}
        <rect x="250" y="100" width="140" height="92" fill={p.buildingDark} />
        <rect x="250" y="100" width="140" height="2" fill={p.neon1} opacity={0.25} />
        {/* Command desk */}
        <rect x="265" y="155" width="110" height="8" fill={p.building} />
        <rect x="265" y="153" width="110" height="2" fill={p.neon1} opacity={0.2} />
        {/* Holographic portrait */}
        <rect x="295" y="108" width="36" height="32" fill={p.neon1} opacity={0.04} />
        <rect x="295" y="108" width="36" height="32" fill="none" stroke={p.neon1} strokeWidth="1" />
        <rect x="305" y="114" width="16" height="16" fill={p.neon1} opacity={0.08} />
        <rect x="309" y="116" width="8" height="8" fill={p.neon1} opacity={0.15} />
        <rect x="307" y="126" width="12" height="8" fill={p.neon1} opacity={0.1} />
        {/* Medals / achievements */}
        {[258,270,282].map((mx, i) => (
          <g key={`md${i}`}>
            <rect x={mx} y={112} width="8" height="8" fill={i % 2 === 0 ? p.neon2 : p.neon1} opacity={0.1} />
            <rect x={mx} y={112} width="8" height="8" fill="none" stroke={i % 2 === 0 ? p.neon2 : p.neon1} strokeWidth="0.5" />
          </g>
        ))}
        {/* Personal screens */}
        <rect x="270" y="157" width="20" height="12" fill={p.neon1} opacity={0.04} />
        <rect x="270" y="157" width="20" height="12" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="274" y="161" width="12" height="2" fill={p.neon1} opacity={0.25} />
        <rect x="350" y="157" width="20" height="12" fill={p.neon2} opacity={0.04} />
        <rect x="350" y="157" width="20" height="12" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="354" y="161" width="12" height="2" fill={p.neon2} opacity={0.2} />
        {/* Bookshelf */}
        <rect x="342" y="108" width="40" height="3" fill={p.building} />
        <rect x="342" y="120" width="40" height="3" fill={p.building} />
        <rect x="342" y="132" width="40" height="3" fill={p.building} />
        {[344,352,360,368,374].map((bx, i) => (
          <rect key={`bk${i}`} x={bx} y={108 - 4 - (i % 2) * 2} width="4" height={4 + (i % 2) * 2} fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.1} />
        ))}
        {[344,354,364,374].map((bx, i) => (
          <rect key={`bk2${i}`} x={bx} y={120 - 3 - (i % 2) * 2} width="5" height={3 + (i % 2) * 2} fill={i % 2 === 0 ? p.neon2 : p.neon1} opacity={0.08} />
        ))}
        {/* Weapon rack */}
        <rect x="255" y="130" width="4" height="20" fill={p.building} />
        <rect x="252" y="134" width="10" height="2" fill={p.neon1} opacity={0.15} />
        <rect x="252" y="142" width="10" height="2" fill={p.neon2} opacity={0.12} />
        {/* Chair */}
        <rect x="305" y="168" width="16" height="6" fill={p.building} opacity={0.5} />
        <rect x="320" y="162" width="4" height="12" fill={p.building} opacity={0.4} />
        <NeonSign x={278} y={98} w={84} h={10} text="QUARTERS" color={p.neon1} />
      </g>
    );
    case "inventory": return (
      <g>
        {/* Gear locker room */}
        <rect x="240" y="95" width="160" height="97" fill={p.buildingDark} />
        <rect x="240" y="95" width="160" height="2" fill={p.neon1} opacity={0.3} />
        {/* Tall weapon racks — left */}
        <rect x="248" y="102" width="4" height="65" fill={p.building} />
        <rect x="256" y="102" width="4" height="65" fill={p.building} />
        {[110,122,134,146,158].map((wy, i) => (
          <g key={`wr${i}`}>
            <rect x={245} y={wy} width="18" height="2" fill={p.building} />
            <rect x={247} y={wy - 4} width={12 - i} height={4} fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.12 + i * 0.02} />
          </g>
        ))}
        {/* Large shelving units */}
        {[0,1,2].map((row) => (
          <g key={`sh${row}`}>
            <rect x={272} y={108 + row * 20} width="120" height="3" fill={p.building} />
            {[0,1,2,3,4,5].map((col) => {
              const ix = 276 + col * 19;
              const iy = 108 + row * 20 - 8 - (col % 3) * 3;
              return (
                <rect key={`it${row}-${col}`} x={ix} y={iy} width={8 + col % 2 * 4} height={8 + (col % 3) * 3} fill={(row + col) % 2 === 0 ? p.neon1 : p.neon2} opacity={0.1 + (col % 3) * 0.05} />
              );
            })}
          </g>
        ))}
        {/* Armor stand */}
        <rect x="355" y="110" width="12" height="12" fill={p.building} opacity={0.5} />
        <rect x="353" y="122" width="16" height="18" fill={p.building} opacity={0.4} />
        <rect x="357" y="112" width="4" height="4" fill={p.neon1} opacity={0.15} />
        <rect x="363" y="112" width="4" height="4" fill={p.neon2} opacity={0.12} />
        {/* Scanner hologram */}
        <rect x="310" y="172" width="30" height="16" fill={p.neon1} opacity={0.03} />
        <rect x="310" y="172" width="30" height="16" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        <rect x="314" y="176" width="22" height="2" fill={p.neon1} opacity={0.25} />
        <rect x="314" y="182" width="16" height="2" fill={p.neon2} opacity={0.18} />
        <NeonSign x={272} y={95} w={96} h={10} text="GEAR" color={p.neon1} />
      </g>
    );
    case "lobby": return (
      <g>
        {/* Command centre */}
        <rect x="215" y="85" width="210" height="107" fill={p.buildingDark} />
        <rect x="215" y="85" width="210" height="2" fill={p.neon1} opacity={0.35} />
        {/* Massive central screen */}
        <rect x="255" y="95" width="130" height="60" fill={p.neon1} opacity={0.03} />
        <rect x="255" y="95" width="130" height="60" fill="none" stroke={p.neon1} strokeWidth="1" />
        {[102,110,118,126,134,142,148].map((ly, i) => (
          <rect key={`cs${i}`} x={260} y={ly} width={100 - (i % 3) * 15} height="2" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.3 - i * 0.025} />
        ))}
        {/* Side screens */}
        <rect x="222" y="100" width="28" height="24" fill={p.neon2} opacity={0.03} />
        <rect x="222" y="100" width="28" height="24" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="226" y="106" width="20" height="2" fill={p.neon2} opacity={0.25} />
        <rect x="226" y="112" width="14" height="2" fill={p.neon2} opacity={0.18} />
        <rect x="390" y="100" width="28" height="24" fill={p.neon2} opacity={0.03} />
        <rect x="390" y="100" width="28" height="24" fill="none" stroke={p.neon2} strokeWidth="0.5" />
        <rect x="394" y="106" width="20" height="2" fill={p.neon2} opacity={0.25} />
        <rect x="394" y="112" width="14" height="2" fill={p.neon2} opacity={0.18} />
        {/* Console desk — curved */}
        <rect x="245" y="165" width="150" height="10" fill={p.building} />
        <rect x="245" y="163" width="150" height="2" fill={p.neon1} opacity={0.2} />
        {/* Operator stations */}
        {[255,285,315,345,375].map((ox, i) => (
          <g key={`op${i}`}>
            <rect x={ox} y={168} width="16" height="5" fill={i % 2 === 0 ? p.neon1 : p.neon2} opacity={0.04} />
            <rect x={ox} y={168} width="16" height="5" fill="none" stroke={i % 2 === 0 ? p.neon1 : p.neon2} strokeWidth="0.5" />
          </g>
        ))}
        {/* Seated operators */}
        {[260,320,380].map((sx, i) => (
          <g key={`so${i}`}>
            <rect x={sx} y={155} width="5" height="5" fill="#060e18" opacity={0.4} />
            <rect x={sx - 1} y={160} width="7" height="6" fill="#060e18" opacity={0.35} />
          </g>
        ))}
        <NeonSign x={278} y={87} w={84} h={10} text="COMMAND" color={p.neon1} />
      </g>
    );
    case "chat": return (
      <g>
        {/* Communications hub */}
        <rect x="240" y="95" width="160" height="97" fill={p.buildingDark} />
        <rect x="240" y="95" width="160" height="2" fill={p.neon1} opacity={0.3} />
        {/* Antenna arrays on roof */}
        <rect x="290" y="60" width="4" height="35" fill={p.building} />
        <rect x="346" y="65" width="4" height="30" fill={p.building} />
        {/* Satellite dishes */}
        <SatDish x={275} y={55} color={p.neon1} />
        <SatDish x={340} y={60} color={p.neon2} />
        <Antenna x={310} y={52} color={p.neon1} />
        {/* Signal waves */}
        <circle cx="292" cy="62" r="12" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.15} strokeDasharray="2 2" shapeRendering="auto" />
        <circle cx="292" cy="62" r="20" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.1} strokeDasharray="2 3" shapeRendering="auto" />
        <circle cx="292" cy="62" r="28" fill="none" stroke={p.neon1} strokeWidth="0.5" opacity={0.06} strokeDasharray="3 3" shapeRendering="auto" />
        {/* Radio/comm panels */}
        {[0,1,2].map((row) => (
          [0,1].map((col) => {
            const px = 252 + col * 72;
            const py = 108 + row * 22;
            const c = (row + col) % 2 === 0 ? p.neon1 : p.neon2;
            return (
              <g key={`cp${row}-${col}`}>
                <rect x={px} y={py} width="55" height="16" fill={c} opacity={0.04} />
                <rect x={px} y={py} width="55" height="16" fill="none" stroke={c} strokeWidth="0.5" />
                <rect x={px + 4} y={py + 4} width={35 - row * 5} height="2" fill={c} opacity={0.3 - row * 0.05} />
                <rect x={px + 4} y={py + 9} width={25 - col * 5} height="2" fill={c} opacity={0.2 - row * 0.03} />
              </g>
            );
          })
        ))}
        {/* Waveform display */}
        <rect x="268" y="175" width="104" height="12" fill={p.neon1} opacity={0.03} />
        <rect x="268" y="175" width="104" height="12" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        {[272,280,288,296,304,312,320,328,336,344,352,360].map((wx, i) => (
          <rect key={`wf${i}`} x={wx} y={180 - (i % 4) * 2} width="3" height={2 + (i % 4) * 2} fill={p.neon1} opacity={0.2 + (i % 3) * 0.05} />
        ))}
        <NeonSign x={272} y={95} w={96} h={10} text="COMMS" color={p.neon1} />
      </g>
    );
    case "boards": return (
      <g>
        {/* Mission board room */}
        <rect x="240" y="95" width="160" height="97" fill={p.buildingDark} />
        <rect x="240" y="95" width="160" height="2" fill={p.neon1} opacity={0.3} />
        {/* Large bulletin board */}
        <rect x="250" y="105" width="140" height="70" fill={p.building} opacity={0.3} />
        <rect x="250" y="105" width="140" height="70" fill="none" stroke={p.neon1} strokeWidth="0.5" />
        {/* Pinned notes — variety */}
        {[
          { x: 256, y: 110, w: 28, h: 18, c: "neon1" as const },
          { x: 290, y: 108, w: 32, h: 22, c: "neon2" as const },
          { x: 328, y: 110, w: 24, h: 20, c: "neon1" as const },
          { x: 358, y: 108, w: 22, h: 16, c: "neon2" as const },
          { x: 258, y: 134, w: 30, h: 16, c: "neon2" as const },
          { x: 294, y: 136, w: 26, h: 18, c: "neon1" as const },
          { x: 326, y: 134, w: 32, h: 16, c: "neon2" as const },
          { x: 362, y: 132, w: 20, h: 18, c: "neon1" as const },
          { x: 260, y: 156, w: 24, h: 14, c: "neon1" as const },
          { x: 290, y: 158, w: 28, h: 12, c: "neon2" as const },
          { x: 324, y: 156, w: 30, h: 14, c: "neon1" as const },
          { x: 360, y: 154, w: 22, h: 16, c: "neon2" as const },
        ].map((note, i) => {
          const c = note.c === "neon1" ? p.neon1 : p.neon2;
          return (
            <g key={`nt${i}`}>
              <rect x={note.x} y={note.y} width={note.w} height={note.h} fill={c} opacity={0.06} />
              <rect x={note.x} y={note.y} width={note.w} height={note.h} fill="none" stroke={c} strokeWidth="0.5" />
              <rect x={note.x + 3} y={note.y + 3} width={note.w - 8} height="2" fill={c} opacity={0.3} />
              {note.h > 14 && <rect x={note.x + 3} y={note.y + 8} width={note.w - 12} height="2" fill={c} opacity={0.2} />}
              <rect x={note.x + note.w / 2 - 1} y={note.y - 1} width="3" height="3" fill={c} opacity={0.5} />
            </g>
          );
        })}
        {/* Priority marker */}
        <rect x="290" y="108" width="3" height="3" fill={p.neon1} opacity={0.7} />
        <text x="297" y="106" fill={p.neon1} fontSize="4" fontFamily="monospace" opacity={0.35} shapeRendering="auto">!</text>
        <NeonSign x={272} y={95} w={96} h={10} text="BOARDS" color={p.neon1} />
        {/* Viewer */}
        <rect x="310" y="178" width="5" height="5" fill="#060610" opacity={0.4} />
        <rect x="309" y="183" width="7" height="6" fill="#060610" opacity={0.35} />
      </g>
    );
    case "primaris": return (
      <g>
        {/* Grand central hub — imposing */}
        <rect x="235" y="80" width="170" height="112" fill={p.buildingDark} />
        <rect x="235" y="80" width="170" height="3" fill={p.neon1} opacity={0.4} />
        {/* Central dome */}
        <path d="M275 80 L320 48 L365 80" fill={p.building} stroke={p.neon1} strokeWidth="1.5" opacity={0.5} />
        <circle cx="320" cy="62" r="10" fill={p.neon1} opacity={0.1} shapeRendering="auto" />
        <circle cx="320" cy="62" r="10" fill="none" stroke={p.neon1} strokeWidth="1" shapeRendering="auto" />
        <rect x="318" y="40" width="4" height="8" fill={p.neon1} opacity={0.5} />
        {/* Tower spires */}
        <rect x="240" y="55" width="12" height="25" fill={p.building} />
        <rect x="244" y="48" width="4" height="7" fill={p.building} />
        <rect x="245" y="44" width="2" height="4" fill={p.neon1} opacity={0.5} />
        <rect x="388" y="58" width="12" height="22" fill={p.building} />
        <rect x="392" y="52" width="4" height="6" fill={p.building} />
        <rect x="393" y="48" width="2" height="4" fill={p.neon2} opacity={0.5} />
        {/* Holographic district map */}
        <rect x="275" y="96" width="90" height="50" fill={p.neon1} opacity={0.03} />
        <rect x="275" y="96" width="90" height="50" fill="none" stroke={p.neon1} strokeWidth="1" />
        {/* District blocks on map */}
        {[280,302,324,346].map((dx, i) => (
          [0,1].map((row) => (
            <g key={`dm${i}-${row}`}>
              <rect x={dx} y={102 + row * 22} width="16" height="16" fill={(i + row) % 2 === 0 ? p.neon1 : p.neon2} opacity={0.08 + (i % 2) * 0.04} />
              <rect x={dx} y={102 + row * 22} width="16" height="16" fill="none" stroke={(i + row) % 2 === 0 ? p.neon1 : p.neon2} strokeWidth="0.3" />
            </g>
          ))
        ))}
        {/* Pathways between */}
        <rect x="296" y="108" width="6" height="4" fill={p.neon1} opacity={0.1} />
        <rect x="340" y="108" width="6" height="4" fill={p.neon2} opacity={0.08} />
        <rect x="296" y="130" width="6" height="4" fill={p.neon2} opacity={0.08} />
        {/* People walking */}
        {[248,270,365,388].map((px, i) => (
          <g key={`pw${i}`}>
            <rect x={px} y={170} width="4" height="4" fill="#060e18" opacity={0.4} />
            <rect x={px - 1} y={174} width="6" height="8" fill="#060e18" opacity={0.35} />
          </g>
        ))}
        {/* District signs on sides */}
        <NeonSign x={210} y={130} w={22} h={20} text="N" color={p.neon1} />
        <NeonSign x={410} y={130} w={22} h={20} text="S" color={p.neon2} />
        <NeonSign x={270} y={78} w={100} h={10} text="PRIMARIS" color={p.neon1} />
        {/* Connecting bridge beams */}
        <rect x="208" y="155" width="27" height="3" fill={p.building} opacity={0.4} />
        <rect x="405" y="152" width="27" height="3" fill={p.building} opacity={0.4} />
      </g>
    );
    default: return null;
  }
}

/* ── Main Component ──────────────────────────────────── */
export function PixelBanner({ scene, title, subtitle, accentColor, children }: PixelBannerProps) {
  const p = PALETTES[scene] ?? PALETTES["station"];
  const borderColor = accentColor ?? p.accent;
  const variant = scene.length;

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl" style={{ borderWidth: 1, borderStyle: "solid", borderColor: `${borderColor}40` }}>
        <svg viewBox="0 0 640 220" className="w-full h-auto block" shapeRendering="crispEdges">
          <defs>
            <linearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.sky1}/>
              <stop offset="30%" stopColor={p.sky2}/>
              <stop offset="65%" stopColor={p.sky3}/>
              <stop offset="100%" stopColor={p.sky2}/>
            </linearGradient>
            <linearGradient id={`glow-${scene}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.neon1} stopOpacity="0"/>
              <stop offset="100%" stopColor={p.neon1} stopOpacity="0.05"/>
            </linearGradient>
            <clipPath id={`sun-${scene}`}>
              <circle cx="320" cy="170" r="60"/>
            </clipPath>
          </defs>

          {/* Sky */}
          <rect width="640" height="220" fill={`url(#sky-${scene})`}/>

          {/* Stars */}
          <Stars p={p} />

          {/* Sun / horizon glow */}
          <g clipPath={`url(#sun-${scene})`}>
            {[0,1,2,3,4,5,6,7,8,9].map((i) => (
              <rect key={`sr${i}`} x="260" y={110 + i * 7} width="120" height={6 - i * 0.4} fill={p.sun} opacity={0.7 - i * 0.065} />
            ))}
          </g>

          {/* Atmosphere */}
          <Atmosphere p={p} />

          {/* City glow from below */}
          <rect width="640" height="220" fill={`url(#glow-${scene})`}/>

          {/* Far city */}
          <FarCity p={p} />

          {/* Mid city */}
          <MidCity p={p} />

          {/* Scene-specific focal elements */}
          <SceneDetails scene={scene} p={p} />

          {/* Ground */}
          <Ground p={p} />
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
