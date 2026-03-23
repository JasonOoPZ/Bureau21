import { getStarterCharacter } from "@/lib/starter-characters";

interface StarterCharacterPortraitProps {
  slug?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: { width: 88, height: 112 },
  md: { width: 124, height: 156 },
  lg: { width: 176, height: 224 },
  xl: { width: 260, height: 328 },
} as const;

export function StarterCharacterPortrait({ slug, size = "md" }: StarterCharacterPortraitProps) {
  const character = getStarterCharacter(slug);
  const dims = sizeMap[size];

  const s = character.palette.shell;
  const g = character.palette.glow;
  const c = character.palette.core;
  const e = character.palette.eye;
  const id = character.slug;

  // Derive a short code label from slug (e.g. "ember-754" → "754", "void-monk" → "VMK")
  const parts = character.slug.split("-");
  const label = parts[parts.length - 1].length <= 4
    ? parts[parts.length - 1].toUpperCase()
    : (parts.map((p) => p[0]).join("").toUpperCase()).slice(0, 4);

  return (
    <svg
      viewBox="0 0 180 220"
      width={dims.width}
      height={dims.height}
      aria-label={character.name}
      role="img"
    >
      <defs>
        {/* Background atmosphere */}
        <radialGradient id={`bg-${id}`} cx="50%" cy="38%" r="58%">
          <stop offset="0%" stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {/* Body armor shading */}
        <linearGradient id={`body-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={s} stopOpacity="1" />
          <stop offset="60%" stopColor={s} stopOpacity="0.85" />
          <stop offset="100%" stopColor="#000" stopOpacity="1" />
        </linearGradient>
        {/* Visor fill */}
        <linearGradient id={`visor-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={e} stopOpacity="0.18" />
          <stop offset="50%" stopColor={e} stopOpacity="0.06" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.8" />
        </linearGradient>
        {/* Reactor core */}
        <radialGradient id={`core-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="35%" stopColor={c} stopOpacity="1" />
          <stop offset="100%" stopColor={g} stopOpacity="0.3" />
        </radialGradient>
        {/* Strong glow */}
        <filter id={`glow-${id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Soft glow for details */}
        <filter id={`sg-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── Background glow ── */}
      <rect x="0" y="0" width="180" height="220" fill={`url(#bg-${id})`} />

      {/* ── LEGS ── */}
      {/* Left leg */}
      <path d="M72 160 Q66 170 65 186 Q64 198 67 208 L80 210 L84 206 Q85 192 84 176 Q83 162 82 158Z" fill={`url(#body-${id})`} />
      {/* Left knee guard */}
      <ellipse cx="72" cy="182" rx="9" ry="6" fill={s} />
      <ellipse cx="72" cy="182" rx="9" ry="6" fill="none" stroke={g} strokeWidth="0.9" opacity="0.7" />
      {/* Right leg */}
      <path d="M108 160 Q114 170 115 186 Q116 198 113 208 L100 210 L96 206 Q95 192 96 176 Q97 162 98 158Z" fill={`url(#body-${id})`} />
      {/* Right knee guard */}
      <ellipse cx="108" cy="182" rx="9" ry="6" fill={s} />
      <ellipse cx="108" cy="182" rx="9" ry="6" fill="none" stroke={g} strokeWidth="0.9" opacity="0.7" />

      {/* ── ARMS ── */}
      {/* Left arm upper */}
      <path d="M46 88 Q36 96 32 114 Q29 130 32 148 Q35 160 42 163 L50 160 Q53 148 52 132 Q51 116 54 104 Q56 96 64 90Z" fill={`url(#body-${id})`} />
      {/* Left elbow guard */}
      <ellipse cx="40" cy="140" rx="9" ry="7" fill={s} />
      <ellipse cx="40" cy="140" rx="9" ry="7" fill="none" stroke={g} strokeWidth="1" opacity="0.65" />
      {/* Left forearm */}
      <path d="M32 148 Q29 158 31 168 Q33 176 40 178 L50 175 Q55 168 52 158 Q50 150 50 146Z" fill={`url(#body-${id})`} />
      {/* Left arm glow line */}
      <path d="M38 110 L36 124 L38 138" stroke={g} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* Right arm upper */}
      <path d="M134 88 Q144 96 148 114 Q151 130 148 148 Q145 160 138 163 L130 160 Q127 148 128 132 Q129 116 126 104 Q124 96 116 90Z" fill={`url(#body-${id})`} />
      {/* Right elbow guard */}
      <ellipse cx="140" cy="140" rx="9" ry="7" fill={s} />
      <ellipse cx="140" cy="140" rx="9" ry="7" fill="none" stroke={g} strokeWidth="1" opacity="0.65" />
      {/* Right forearm */}
      <path d="M148 148 Q151 158 149 168 Q147 176 140 178 L130 175 Q125 168 128 158 Q130 150 130 146Z" fill={`url(#body-${id})`} />
      {/* Right arm glow line */}
      <path d="M142 110 L144 124 L142 138" stroke={g} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5" />

      {/* ── SHOULDER PADS (drawn over arm tops) ── */}
      {/* Left shoulder */}
      <path d="M36 84 Q30 78 34 70 Q40 62 54 62 Q66 62 70 72 L68 86 Q60 92 52 93 Q42 92 36 84Z" fill={`url(#body-${id})`} />
      <path d="M36 84 Q30 78 34 70 Q40 62 54 62 Q66 62 70 72" fill="none" stroke={g} strokeWidth="1.2" opacity="0.7" />
      <path d="M40 82 Q46 77 56 77 Q63 77 67 82" fill="none" stroke={g} strokeWidth="0.7" opacity="0.35" />

      {/* Right shoulder */}
      <path d="M144 84 Q150 78 146 70 Q140 62 126 62 Q114 62 110 72 L112 86 Q120 92 128 93 Q138 92 144 84Z" fill={`url(#body-${id})`} />
      <path d="M144 84 Q150 78 146 70 Q140 62 126 62 Q114 62 110 72" fill="none" stroke={g} strokeWidth="1.2" opacity="0.7" />
      <path d="M140 82 Q134 77 124 77 Q117 77 113 82" fill="none" stroke={g} strokeWidth="0.7" opacity="0.35" />

      {/* ── TORSO / CHEST ── */}
      <path d="M66 80 Q60 92 60 112 Q60 132 66 148 L74 156 L90 159 L106 156 L114 148 Q120 132 120 112 Q120 92 114 80 Q104 74 90 74 Q76 74 66 80Z" fill={`url(#body-${id})`} />
      {/* Chest highlight bevel */}
      <path d="M66 80 Q62 96 63 114 Q64 128 68 140" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.08" />
      {/* Chest panel lines */}
      <path d="M73 90 L73 142" stroke={g} strokeWidth="0.6" opacity="0.25" />
      <path d="M107 90 L107 142" stroke={g} strokeWidth="0.6" opacity="0.25" />
      <path d="M66 102 L114 102" stroke={g} strokeWidth="0.6" opacity="0.25" />
      <path d="M67 124 L113 124" stroke={g} strokeWidth="0.6" opacity="0.25" />
      {/* Chest outline */}
      <path d="M66 80 Q60 92 60 112 Q60 132 66 148 L74 156 L90 159 L106 156 L114 148 Q120 132 120 112 Q120 92 114 80" fill="none" stroke={g} strokeWidth="1" opacity="0.45" />
      {/* Collar ridge */}
      <path d="M70 78 Q78 72 90 71 Q102 72 110 78" fill="none" stroke={g} strokeWidth="1.2" opacity="0.55" />

      {/* Circuit veins on chest */}
      <g stroke={g} strokeWidth="1" strokeLinecap="round" fill="none" filter={`url(#sg-${id})`} opacity="0.65">
        <path d="M80 93 L76 89 L71 89" />
        <path d="M100 93 L104 89 L109 89" />
        <path d="M83 106 L78 102" />
        <path d="M97 106 L102 102" />
        <path d="M80 130 L74 134 L71 130" />
        <path d="M100 130 L106 134 L109 130" />
      </g>

      {/* ── REACTOR CORE ── */}
      <circle cx="90" cy="114" r="15" fill="#02040d" />
      <circle cx="90" cy="114" r="12" fill={`url(#core-${id})`} filter={`url(#glow-${id})`} />
      <circle cx="90" cy="114" r="7" fill={c} />
      <circle cx="90" cy="114" r="3.5" fill="#fff" opacity="0.9" />
      {/* Core outer ring */}
      <circle cx="90" cy="114" r="15" fill="none" stroke={g} strokeWidth="1.4" opacity="0.9" />
      {/* Core tick marks */}
      <g stroke={g} strokeWidth="1" opacity="0.6">
        <line x1="90" y1="97" x2="90" y2="101" />
        <line x1="90" y1="127" x2="90" y2="131" />
        <line x1="73" y1="114" x2="77" y2="114" />
        <line x1="103" y1="114" x2="107" y2="114" />
      </g>

      {/* ── WAIST / PELVIS ── */}
      <path d="M67 150 Q62 156 64 165 L90 169 L116 165 Q118 156 113 150 L90 154 Z" fill={`url(#body-${id})`} />
      <path d="M67 150 Q62 156 64 165" fill="none" stroke={g} strokeWidth="0.8" opacity="0.4" />
      <path d="M113 150 Q118 156 116 165" fill="none" stroke={g} strokeWidth="0.8" opacity="0.4" />
      {/* Belt line */}
      <path d="M67 162 L113 162" stroke={g} strokeWidth="1" opacity="0.45" />
      {/* Belt buckle */}
      <rect x="83" y="157" width="14" height="9" rx="2" fill={c} opacity="0.85" />
      <rect x="83" y="157" width="14" height="9" rx="2" fill="none" stroke={g} strokeWidth="0.8" opacity="0.9" />

      {/* ── NECK ── */}
      <rect x="82" y="63" width="16" height="11" rx="2" fill={s} />
      <rect x="82" y="63" width="16" height="11" rx="2" fill="none" stroke={g} strokeWidth="0.7" opacity="0.5" />

      {/* ── HELMET ── */}
      {/* Main dome */}
      <path d="M90 11 C71 11 57 24 57 43 C57 57 63 66 71 69 L90 72 L109 69 C117 66 123 57 123 43 C123 24 109 11 90 11 Z" fill={`url(#body-${id})`} />
      {/* Helmet top crest */}
      <path d="M84 11 L80 5 L90 1 L100 5 L96 11" fill={g} opacity="0.55" filter={`url(#sg-${id})`} />
      {/* Side panels */}
      <path d="M57 43 C57 32 62 23 70 18 C63 20 57 30 57 43Z" fill="#fff" opacity="0.05" />
      {/* Helmet outline */}
      <path d="M90 11 C71 11 57 24 57 43 C57 57 63 66 71 69 L90 72 L109 69 C117 66 123 57 123 43 C123 24 109 11 90 11 Z" fill="none" stroke={g} strokeWidth="1" opacity="0.55" />

      {/* ── VISOR ── */}
      <path d="M67 40 C67 32 77 27 90 27 C103 27 113 32 113 40 C113 54 103 63 90 63 C77 63 67 54 67 40 Z" fill="#030610" />
      <path d="M67 40 C67 32 77 27 90 27 C103 27 113 32 113 40 C113 54 103 63 90 63 C77 63 67 54 67 40 Z" fill={`url(#visor-${id})`} />
      {/* Visor glare */}
      <path d="M70 35 Q78 30 90 30 Q100 30 108 34 Q100 29 90 29 Q78 29 70 35Z" fill="#fff" opacity="0.08" />
      {/* Visor outline */}
      <path d="M67 40 C67 32 77 27 90 27 C103 27 113 32 113 40 C113 54 103 63 90 63 C77 63 67 54 67 40 Z" fill="none" stroke={g} strokeWidth="1" opacity="0.6" />

      {/* ── EYES (inside visor) ── */}
      <ellipse cx="79" cy="44" rx="10" ry="8" fill={e} opacity="0.85" filter={`url(#sg-${id})`} />
      <ellipse cx="101" cy="44" rx="10" ry="8" fill={e} opacity="0.85" filter={`url(#sg-${id})`} />
      {/* Pupil center */}
      <ellipse cx="79" cy="44" rx="4" ry="4" fill="#fff" opacity="0.55" />
      <ellipse cx="101" cy="44" rx="4" ry="4" fill="#fff" opacity="0.55" />
      {/* Eye brow ridge */}
      <path d="M69 38 L89 36" stroke={g} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />
      <path d="M91 36 L111 38" stroke={g} strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />

      {/* ── ID LABEL ── */}
      <rect x="67" y="206" width="46" height="13" rx="3" fill="#030610" stroke={g} strokeWidth="0.8" opacity="0.9" />
      <text x="90" y="216" textAnchor="middle" fontSize="7.5" fill={g} fontFamily="monospace" letterSpacing="1.5" opacity="0.95">
        {label}
      </text>
    </svg>
  );
}
