# XCVIII Studio Digital Archive

Web app giving every physical XCVIII Studio hat a unique digital record via an
NFC-tagged public page. Admin creates collections + hat ("piece") records; each
piece gets a permanent public URL written to its NFC tag; scanning the tag opens
the record; editing the record updates the page without ever rewriting the tag.

Full spec: [docs/PRD.md](docs/PRD.md).

**Status:** Phase 1 (project setup) only. No database, auth, or real data yet —
routes below render placeholder content.

## Technical stack

- Next.js (App Router) + TypeScript (strict mode)
- Tailwind CSS v4
- Supabase: Postgres + Supabase Auth + Row Level Security
- Zod for validation, React Hook Form for forms
- Vercel (app) + Supabase (DB/auth) for deployment
- Vitest + React Testing Library (unit/component), Playwright (E2E)

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

| Variable                        | Where to find it                                                  |
| ------------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Project Settings → API → Project URL         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → `anon` `public` key |

Validated at startup by [`src/lib/env.ts`](src/lib/env.ts) — the app throws a clear
error immediately if either is missing or malformed, rather than failing later with
an opaque Supabase client error.

There is no service-role key in this app. Admin mutations run under the
authenticated user's own Supabase client so Row Level Security is always enforced
(defense-in-depth, not a bypass) — see the design doc's DAL pattern.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, go to Project Settings → API and copy the Project URL and the
   `anon` `public` key into `.env.local`.
3. Database schema, RLS policies, and a seeded dev admin arrive in Phase 2 — nothing
   to set up on the database side yet.

## Database migrations

TODO — Phase 2 (Database and security) adds the schema, RLS policies, and migration
instructions here.

## Seed data

TODO — Phase 2 seeds a development admin; PRD §21 seed data (collection + pieces)
lands with Phase 4/5.

## Development commands

```bash
npm run dev            # start dev server
npm run build           # production build
npm run start            # run production build
npm run lint             # ESLint
npm run typecheck         # tsc --noEmit
npm run format            # Prettier — write
npm run format:check       # Prettier — check only
```

## Testing commands

TODO — Vitest/RTL unit tests are written per-phase starting Phase 2 (per the eng
review decision to not defer testing to Phase 10); Playwright E2E is added once the
UI is stable (Phase 10). `npm run test` / `npm run test:e2e` will be added then.

## Deployment

TODO — Phase 10. App deploys to Vercel; database/auth stay on Supabase. Production
env vars mirror the table above, pointed at the production Supabase project.

## NFC programming instructions

TODO — Phase 7 (NFC workflow). The tag stores only the piece's permanent public URL
(e.g. `https://xcviii.studio/pieces/pearl-halo-001`) — editing a piece's data never
requires reprogramming the tag.

## Known limitations

- Phase 1 only: no database, no auth, no real data. All routes above render static
  placeholder text.
- Ordinary NFC tags confirm the tag was programmed with the correct URL but do not
  provide strong counterfeit protection (basic NFC URLs can be copied) — the public
  page is labeled a "Registered Piece" / "XCVIII Studio Record," not proof of
  physical authenticity.
