# XCVIII Studio Digital Archive

Web app giving every physical XCVIII Studio hat a unique digital record via an
NFC-tagged public page. Admin creates collections + hat ("piece") records; each
piece gets a permanent public URL written to its NFC tag; scanning the tag opens
the record; editing the record updates the page without ever rewriting the tag.

Full spec: [docs/PRD.md](docs/PRD.md).

**Status:** Phases 1-2 (project setup, database + RLS). Schema and security
policies are live; no auth/login flow or real content yet — routes below still
render placeholder content.

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

| Variable                        | Where to find it                                                    |
| ------------------------------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Project Settings → API → Project URL           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → `anon` `public` key   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase dashboard → Project Settings → API → `service_role` secret |

The first two are validated at startup by [`src/lib/env.ts`](src/lib/env.ts) — the
app throws a clear error immediately if either is missing or malformed, rather
than failing later with an opaque Supabase client error.

`SUPABASE_SERVICE_ROLE_KEY` is **test-only** — used solely by the RLS test suite
to seed/tear down fixtures (bypassing RLS on purpose, to set up data anon can't
insert itself). It is never read by `src/lib/env.ts` and never reaches the app
runtime or the browser. The app itself has no service-role key: admin mutations
run under the authenticated user's own Supabase client so Row Level Security is
always enforced (defense-in-depth, not a bypass) — see the design doc's DAL
pattern.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, go to Project Settings → API and copy the Project URL and the
   `anon` `public` key into `.env.local`.
3. Run the migrations in `supabase/migrations/` against your project (see
   "Database migrations" below) to create the schema and RLS policies.

## Database migrations

Schema, constraints, and RLS policies live in `supabase/migrations/`, applied via
the Supabase CLI directly against the linked hosted project (no local
Postgres/Docker needed):

```bash
supabase link --project-ref <your-project-ref>   # one-time, prompts for DB password
supabase db push                                   # applies any new migrations
supabase migration list                            # confirm local/remote match
```

Add a new migration with `supabase migration new <name>`, then `supabase db push`
again.

## Seed data

Supabase Auth owns identities — this app never creates a login for you directly.
To get a dev admin:

1. Supabase dashboard → Authentication → Users → Add user (email + password of
   your choosing, check "Auto Confirm User").
2. Add a migration that promotes that email to admin, e.g.:
   ```sql
   insert into public.profiles (id, role)
   select id, 'admin' from auth.users where email = 'you@example.com'
   on conflict (id) do update set role = 'admin';
   ```
3. `supabase db push`.

PRD §21's sample collection ("First Light") + piece ("Pearl Halo — Navy") are
seeded once the admin CRUD UI exists (Phase 4/5), not at the schema stage.

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

```bash
npm run test    # Vitest — currently just the anon/public RLS integration suite
```

Tests run against the real linked dev Supabase project (not a mock), using
`SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (test-only, never used by the app
itself) to seed/tear down fixture rows around each run. Admin-authenticated RLS
tests land in Phase 3, once there's a login flow to sign in with. Playwright E2E
is added once the UI is stable (Phase 10).

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
