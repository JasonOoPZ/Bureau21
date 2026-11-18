# Bureau 21

Bureau 21 is a browser-first sci-fi MMORPG where players are Operators on a lawless space station. Train stats at the gym, battle rivals in PvP combat, pick alien herbs, mine ore, discover secret substance recipes, and compete on monthly leaderboards. Zero download, mobile-first, community-driven.

## Stack

- **Next.js 16** (App Router, `src/` layout) with **React 18** and TypeScript
- **Postgres on Neon** through **Prisma 6** and the `@prisma/adapter-neon` serverless driver
- **NextAuth v4** (JWT sessions) with email/password credentials and optional Google sign-in
- **Resend** for password reset emails
- **Tailwind CSS 3**
- **Vitest** for unit tests
- Deployed to **Vercel** from `main`

## Local setup

Requires Node 20 or newer and a Postgres database (a free Neon project works).

```bash
npm install            # also runs `prisma generate`
cp .env.example .env   # then fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma db push     # create the tables from prisma/schema.prisma
npm run dev            # http://localhost:3000
```

There is no migrations folder; the schema is applied with `prisma db push`.

## Environment variables

See [.env.example](.env.example) for the full annotated list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. URLs containing `neon` use the Neon serverless adapter. |
| `NEXTAUTH_URL` | yes | Public origin; also used to build password reset links. |
| `NEXTAUTH_SECRET` | yes | Signs the session JWT; read by `src/proxy.ts`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | no | Enables Google sign-in when both are set. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | no | Sends password reset emails. Without them, development logs the link to the console. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | `prisma generate`, then a production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | ESLint (flat config in `eslint.config.mjs`). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Run the Vitest unit tests once. |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, and tests on every push and pull request.

## Project layout

```text
prisma/schema.prisma   Database schema
src/app/               Routes (pages and API route handlers)
src/components/        UI components
src/lib/               Game logic, constants, and data tables
src/lib/__tests__/     Unit tests
src/auth.ts            NextAuth configuration
src/proxy.ts           Request proxy: www redirect and the /lobby and /admin sign-in gate
scripts/               Admin scripts: dry-run by default, --confirm to write (see scripts/_guard.ts); applied one-offs live in scripts/archive/
```

`src/proxy.ts` is what earlier Next.js versions called middleware. Next.js 16 renamed the file convention, and with a `src/` layout it must sit next to `app/`.
