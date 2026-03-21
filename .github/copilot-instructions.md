# Bureau 21 — Copilot Instructions

## Project Overview
Bureau 21 is a browser-first sci-fi MMORPG built with Next.js 14+, Supabase, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 14+ with App Router and TypeScript
- **Styling**: Tailwind CSS (mobile-first, 375px base)
- **Database + Auth + Realtime**: Supabase (PostgreSQL)
- **Hosting**: Vercel (free tier)

## Code Standards
- All pages are Server Components by default; use `'use client'` only when needed
- Always use the `@/` path alias for imports
- Use `createClient()` from `@/lib/supabase/server` in Server Components
- Use `createClient()` from `@/lib/supabase/client` in Client Components
- Minimum 48px touch targets on all interactive elements
- Mobile-first design with Tailwind CSS

## UI Design System
- Background: `bg-slate-900` (#0f172a)
- Cards: `bg-slate-800` (#1e293b)
- Primary: `text-amber-500` (#f59e0b)
- Secondary: `text-cyan-500` (#06b6d4)
- Danger: `text-red-500`, Success: `text-emerald-500`
- Text Primary: `text-slate-100`, Secondary: `text-slate-400`

## Game Constants
All game constants are in `src/lib/constants.ts`. Do not hardcode values.

## Database
Never query the database in client components directly for sensitive data. Use API routes for mutations.

## File Structure
Follow the structure defined in the project — all pages in `src/app/`, all components in `src/components/`, all utilities in `src/lib/`.
