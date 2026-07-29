# XCVIII Studio Digital Archive

Web app giving every physical XCVIII Studio hat a unique digital record via an
NFC-tagged public page. Admin creates collections + hat ("piece") records; each
piece gets a permanent public URL written to its NFC tag; scanning the tag opens
the record; editing the record updates the page without ever rewriting the tag.

Full spec: [docs/PRD.md](docs/PRD.md).

**Status:** Phases 1-10, all complete — project setup, database + RLS,
authentication, collection and piece management, public archive, NFC workflow,
scan tracking, images, and testing/deployment. Admins can create, edit,
publish/unpublish, and archive both collections and pieces, with generated
permanent piece IDs/slugs and search/filtering. `/pieces/[slug]` and
`/collections/[slug]` are real, unauthenticated public pages backed by RLS. The
admin piece detail page shows the piece's permanent public URL with a copy
button — that's the exact string to write to its NFC tag. Every visit to a
published piece's public page records a scan event; admins see totals and
recent activity on the dashboard, the piece detail screen, and `/admin/scans`.
Admins can upload a piece's main image and a collection's cover image
(Supabase Storage); both render on the public pages. A Playwright E2E suite
covers PRD §19's four required flows, and the app is deployed to Vercel (see
"Deployment" below). The only thing left is a manual, physical step no web
app can do on its own: writing a piece's URL to a real NFC tag and testing it
on a phone (see the checklist under "Deployment").

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

After any schema change, regenerate the typed client so `src/lib/supabase/
database.types.ts` matches reality:

```bash
supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

Both `createClient()` factories (`src/lib/supabase/client.ts` and `server.ts`)
are typed with this file — a stale one shows up as type errors on `.from(...)`
calls, not silent bugs.

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

PRD §21's sample collection ("First Light") + piece ("Pearl Halo — Navy") can now
be entered through the admin UI (`/admin/collections/new`, `/admin/pieces/new`)
rather than a migration, now that both exist (Phases 4-5).

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
npm run test       # Vitest — RLS integration suite + schema unit tests
npm run test:e2e   # Playwright — PRD §19's 4 required E2E flows
```

Both run against the real linked dev Supabase project (not a mock), using
`SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (test-only, never used by the app
itself) to seed/tear down fixture rows and throwaway admin users around each run
— no real credentials needed, nothing persists.

`test:e2e` (Phase 10) needs Playwright's browsers installed once per machine:
`npx playwright install chromium webkit`. `e2e/global-setup.ts` creates one
throwaway admin and writes its credentials to `e2e/.auth/admin.json`
(gitignored); every spec signs in through the real login form with them.
`e2e/global-teardown.ts` deletes it again, along with any `collection_code`
starting with `E2E` and — importantly — any `scan_events` recorded against
their pieces first: unlike the Vitest fixtures, these specs actually visit
public piece pages, which fires `ScanBeacon` for real, so pieces must be
cleaned up in `scan_events` → `pieces` → `collections` order or the delete
hits `scan_events_piece_id_fkey`. (This exact ordering bug also explains why
an earlier Phase 9 manual-verification piece was found still lingering in the
database well after being reported cleaned up — its cleanup script deleted in
the wrong order, hit the same FK constraint, and never checked the delete
call's error. Lesson: any fixture cleanup for a _published_ piece must delete
`scan_events` first and must check delete errors, not just log and move on.)

## Production readiness (Phase 10, PRD §10/§20)

Production reuses the same Supabase project as development — this is a
solo/v1 project with one real administrator, so a separate production
project would just be more accounts and migrations to keep in sync for no
real isolation benefit. Confirmed against every migration in
`supabase/migrations/` (also re-proven by `npm run test`'s RLS suite,
including the Phase 9 storage-bucket tests, run directly against this
project):

- Public (anon) reads: published collections, published-or-
  previously-published pieces only (see "Known limitations" below for why
  that's broader than "published, not archived"), and the `images` storage
  bucket's public URL. No policy grants anon SELECT on `profiles` or
  unrestricted SELECT on `scan_events` — the only public access to
  `scan_events` is `INSERT`.
- Public (anon) writes: `INSERT` only on `scan_events` (via `/api/scan`, and
  only for currently-published pieces — enforced in the route handler, not
  just RLS), and none anywhere else. Confirmed live: an anonymous `INSERT`
  against `collections` is rejected (see the `test:e2e` "Authorization"
  spec, which exercises this against the real REST API, not RLS in
  isolation).
- Internal-only fields (`internal_notes`, NFC fields, raw database `id`s) are
  never selected by the public data-access layer (`src/lib/data/public.ts`)
  in the first place — not filtered out after the fact.
- Every other table/bucket operation requires `public.is_admin()`, which
  checks `profiles.role = 'admin'` for the authenticated user — this is the
  actual authorization boundary (`requireAdmin()`'s redirect is a UX nicety
  on top of it, per `AGENTS.md`'s DAL pattern note).
- The service-role key is never read outside test files
  (`src/lib/env.ts` only validates the two `NEXT_PUBLIC_*` vars) and is
  never set in Vercel — see the env var table above.

## Deployment

Deployed to Vercel from `projects/xcviii-digital-archive/` (this
subdirectory is the Vercel project root — no monorepo "Root Directory"
dashboard setting needed, since `vercel` commands are run from inside it,
not the monorepo root). Production env vars are the same two
`NEXT_PUBLIC_*` values from the table above, pointed at the same Supabase
project used in development (see "Production readiness" above) —
`SUPABASE_SERVICE_ROLE_KEY` is deliberately never added to Vercel.

```bash
cd projects/xcviii-digital-archive
npx vercel login      # one-time; opens a browser to authenticate
npx vercel link       # creates/links the Vercel project to this directory
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel --prod
```

Production URL: https://xcviii-digital-archive.vercel.app (Vercel project
`ukiel100-6646s-projects/xcviii-digital-archive`). Verified live: admin login,
creating/publishing a piece and collection, their public pages, an invalid
slug's not-found page, and `/privacy` all work correctly against production.

### Physical NFC checklist (manual, post-deploy)

The web app doesn't write to NFC hardware itself (PRD §15) — after deploying:

1. Open a published piece's admin detail page, copy its permanent public URL.
2. Write that URL to a physical NFC tag with an external NFC-writing app.
3. Tap the tag with both an iPhone and an Android phone and confirm each
   opens the correct public piece page.
4. Only then sew the tag into the physical hat label (PRD §15's "test before
   sewing permanently").
5. Update the piece's NFC status (`Programmed` → `Tested`) and last-tested
   date on the same admin page.

## NFC programming instructions

Write only the piece's permanent public URL to the tag — nothing else. Find it
on the piece's admin detail page (`/admin/pieces/[id]`), under "NFC": it's
shown as plain text with a Copy URL button next to it. The URL is derived from
whatever origin serves the request (see `src/lib/site.ts`) plus the piece's
slug — currently `https://xcviii-digital-archive.vercel.app/pieces/<slug>`
(see "Deployment" above; a custom domain would change only the origin, not
this mechanism). Editing a piece's data never requires reprogramming the tag — the slug is
permanent once published (PRD §8.5). Record the NFC status (`Not assigned` →
`Ready to program` → `Programmed` → `Tested` → `Replaced`) and last-tested date
on the same admin page as each physical tag is programmed and tested.

## Image uploads

PRD §14. One public Supabase Storage bucket, `images`, holds both piece main
images (`pieces/<uuid>.<ext>`) and collection cover images
(`collections/<uuid>.<ext>`) — created by
`supabase/migrations/20260729023804_image_storage.sql`, with the admin-only
write policies completed by `20260729025621_image_storage_admin_select.sql`
(see that migration's comment for why the SELECT policy is required, not
optional — admins' own `list()`/`remove()` calls need it even though public
reads bypass RLS entirely via the bucket's public URL endpoint).

- Allowed formats: JPEG, PNG, WebP. Max size: 5 MB. Enforced both at the
  bucket level (`file_size_limit`/`allowed_mime_types` on the bucket itself)
  and in the app (`src/lib/validation/images.ts`), so a rejected upload
  surfaces as a normal field error rather than a raw storage-API failure.
- The piece/collection forms take a file upload (`main_image_file`/
  `cover_image_file`) instead of a raw URL, plus a "remove current image"
  checkbox once an image exists. `src/lib/storage/images.ts`'s
  `resolveImageUpdate()` — shared by both create/update Server Actions —
  uploads the new file (if any), and only deletes the image it replaces
  _after_ the piece/collection row's own DB write has succeeded, so a failed
  mutation never orphans the still-referenced image.
- A create that uploads a file but then fails all `MAX_IDENTIFIER_ATTEMPTS`
  piece-ID/slug retries leaves that one upload orphaned in storage rather than
  rolling it back — accepted as a rare edge case, not worth the extra
  complexity for v1.
- Public pages (`/pieces/[slug]`, `/collections/[slug]`) render the image with
  a plain `<img>`, not `next/image` — deliberate, matching this phase's
  "structural only, no visual polish" scope. `next/image` would need
  `images.remotePatterns` configured for the Supabase storage host; revisit
  when the project moves into actual visual design.

## Known limitations

- Physical NFC hardware testing (writing a real tag, tapping it with an
  iPhone and Android phone) can't be done by an agent — see the "Physical NFC
  checklist" under "Deployment" for the one remaining manual step.
- Scan tracking has no active deduplication or rate-limiting — each page load
  records a scan event (PRD §8.10 explicitly doesn't require exact unique-user
  measurement). The stored `anonymous_identifier` (a daily-rotating hash, not
  a raw IP) exists so a future feature could dedupe against it, but nothing
  does yet. React StrictMode's dev-only double-effect means local development
  records two scan events per page load instead of one — harmless, doesn't
  happen in production.
- A scan's `referrer` reflects `document.referrer`, which browsers only set on
  a real cross-site navigation (an NFC tap, an external link click) — client-
  side navigation between pages within this app (e.g. `<Link>`) never sets it,
  so it's frequently null even for genuine visits. This matches PRD §8.10's
  "referrer, when available" wording.
- Once a piece has ever been published, its slug stays readable to the public
  even after being unpublished or archived — the RLS policy admits any piece
  where `publication_status = 'published' OR first_published_at is not null`.
  This is deliberate (a physical NFC tag may already point at that slug — see
  the §8.5 slug-freeze rule) — the public page then renders an "unavailable"
  message rather than the full record. A piece that has never been published
  has no tag pointing at it, so it correctly 404s instead.
- Piece ID year: the PRD's `XCVIII-[CODE]-[YEAR]-[NUMBER]` format doesn't specify
  which year — this app uses the year the record is _created_, not completion
  date or collection release date.
- Ordinary NFC tags confirm the tag was programmed with the correct URL but do not
  provide strong counterfeit protection (basic NFC URLs can be copied) — the public
  page is labeled a "Registered Piece" / "XCVIII Studio Record," not proof of
  physical authenticity.
