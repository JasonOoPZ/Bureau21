# Hydroponics Bay — System Documentation

## Overview
Hydroponics Bay is Bureau 21's flagship idle/active economy mini-game. Players grow, harvest, and sell crops across multiple properties with a real-time market, staff management, tech tree, equipment upgrades, and random events.

## Architecture

### Data Flow
1. **Server**: `GET /api/game/hydroponics` loads state from `HydroponicsData.gameState` (JSON blob), processes offline progress, returns state + credits
2. **Client**: `HydroponicsOrchestrator` manages all UI state, saves via `POST /api/game/hydroponics` on actions + auto-save every 30s
3. **Engine**: `src/lib/hydroponics/engine.ts` contains all pure game logic — no React, no side effects

### File Structure
```
src/lib/hydroponics/
  config.ts        — All balance constants (properties, crops, quality, staff, events, tech, equipment, market)
  types.ts         — TypeScript interfaces for game state
  engine.ts        — Pure game logic functions

src/components/game/hydroponics/
  orchestrator.tsx  — Main client component, state management, all handlers
  property-selector.tsx — Horizontal scrollable property cards
  plot-grid.tsx     — Grid of plant/harvest plot cards with live countdowns
  market-panel.tsx  — Prices, sparklines, sell controls per crop × quality
  staff-panel.tsx   — Hire/fire/assign staff to properties
  tech-tree-panel.tsx — Research tree organized by branch
  equipment-panel.tsx — Per-property equipment upgrades (3 levels each)
  inventory-strip.tsx — Collapsible inventory summary bar
  activity-log.tsx  — Last 20 events/harvests/sales log
  welcome-back-modal.tsx — Offline progress summary on return

src/app/station/hydroponics/page.tsx — Server page (auth + layout shell)
src/app/api/game/hydroponics/route.ts — GET (load+offline) / POST (save+credits)
prisma/schema.prisma — HydroponicsData model (pilotId, gameState JSON)
```

## Key Game Systems

### Properties (15 tiers)
- Each has plot count, indoor/outdoor/mixed type, growth & quality bonuses
- Unlock by owning a property at the required tier
- Costs range from 0 (starter) to 35M credits

### Crops (7 types)
- Marijuana → Ayahuasca, unlocking at higher property tiers
- Each has base growth time, yield, price, volatility, and plot type preference

### Quality Tiers (5 levels)
- Schwag (0.7× price) → Legendary (5× price)
- Rolled at plant time based on quality bonuses from property, staff, tech, equipment

### Market
- Prices tick every 15 minutes via bounded random walk with mean-reversion
- Each crop has independent volatility
- 20-tick price history for sparklines

### Staff (4 roles)
- Gardener: auto-replants after harvest
- Harvester: auto-harvests ready plots
- Botanist: boosts quality tier rolls
- Security: reduces random event risk
- Unlock at Tier 3 property, max staff = 2× highest tier

### Tech Tree (20 nodes, 4 branches)
- Agronomy: growth speed + yield
- Genetics: quality bonuses
- Logistics: offline cap, auto-sell, storage
- Security: event risk reduction, wage discount

### Equipment (5 types, 3 levels each)
- Per-property upgrades: irrigation, grow lights, soil, cameras, automation
- Cost scales with property tier

### Random Events
- 35% base chance per 30-minute check per property
- 4 negative (drought, pest, power surge, inspection)
- 4 positive (bumper crop 3×, wild strain legendary, black market 3× sell, friendly weather)
- Indoor/outdoor restrictions apply

### Offline Progress
- 24h base cap (extendable via tech)
- Auto-harvests completed crops, auto-replants if gardener assigned
- Wages deducted, highest-paid fired first if broke
- Market caught up (capped at 200 ticks)

## Tuning Balance Numbers

All balance constants live in `src/lib/hydroponics/config.ts`. Change any value and the game rebalances:

- **Property costs/bonuses**: `PROPERTIES` array
- **Crop timing/pricing**: `CROPS` array  
- **Quality distribution**: `QUALITY_TIERS` baseChance values (must sum to 100)
- **Event frequency**: `EVENT_BASE_CHANCE` (0.35 = 35%)
- **Market volatility**: Per-crop `volatility` field + `MARKET_WALK_STRENGTH`
- **Staff wages**: `STAFF_ROLES` baseWagePerHour
- **Tech costs**: Each node's `rpCost`
- **Equipment costs**: `baseCost` × level × (1 + tier × 0.3)

## Database Schema

```prisma
model HydroponicsData {
  id        String   @id @default(cuid())
  pilotId   String   @unique
  gameState Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  pilot     PilotState @relation(fields: [pilotId], references: [id])
}
```

The entire game state is stored as a single JSON blob. This avoids complex relational queries for a mini-game that's effectively single-player per pilot.
