# XCVIII Studio Digital Archive

Web app giving every physical XCVIII Studio hat a unique digital record via an
NFC-tagged public page. Admin creates collections + hat ("piece") records; each
piece gets a permanent public URL written to its NFC tag; scanning the tag opens
the record; editing the record updates the page without ever rewriting the tag.

Full spec: [docs/PRD.md](docs/PRD.md). Read it before making architectural decisions —
it defines the DB schema, RLS policy split (public vs admin), out-of-scope list, and
MVP acceptance criteria (§18) that count as "done."

## Stack

- Next.js (App Router) + TypeScript (strict mode, no `any`)
- Tailwind CSS (structural styling only — no visual polish this phase)
- Supabase: Postgres + Supabase Auth + Row Level Security
- Zod for validation (client + server), React Hook Form for forms
- Vercel (app) + Supabase (DB/auth) for deployment
- Vitest + React Testing Library (unit/component), Playwright (critical E2E flows)

No separate Express server unless it becomes necessary (PRD §6).

## Commands

```bash
npm install
npm run dev            # start dev server
npm run build            # production build
npm run lint             # ESLint
npm run typecheck         # tsc --noEmit
npm run format            # Prettier — write
npm run format:check       # Prettier — check only
npm run test              # Vitest
```

`npm run test` covers anon/public + admin-authenticated RLS (`src/lib/supabase/
__tests__/`, `src/lib/data/__tests__/`), the login/collection/piece/scan Zod
schemas (`src/lib/validation/__tests__/`), piece ID/slug generation
(`src/lib/pieces/__tests__/`), and scan helpers (`src/lib/scans/__tests__/`),
run against the real linked dev project.
`npm run test:e2e` (Playwright — the full signed-in browser flow) waits for a
stable UI (Phase 10).

## Auth pattern (Phase 3)

DAL, not middleware-only: every admin page/action calls `requireAdmin()`
(`src/lib/dal.ts`) first. `src/proxy.ts` (Next.js 16's renamed Middleware) only
does an optimistic redirect — never the real check, per the Next.js docs'
own warning that Proxy "should not be used as a full session management or
authorization solution." RLS's `is_admin()` is the backstop under both.

## Data-access pattern (Phase 4+)

Every table's admin CRUD follows the same shape, set by collections
(`src/lib/data/collections.ts`, `src/lib/actions/collections.ts`) and reused by
pieces (`src/lib/data/pieces.ts`, `src/lib/actions/pieces.ts`) — follow it for
scans (Phase 8) too, rather than inventing a new one:

- `src/lib/validation/<table>.ts` — Zod schema matching the DB constraints.
- `src/lib/data/<table>.ts` — read functions, each calling `requireAdmin()`
  first, plain async functions (not Server Actions).
- `src/lib/actions/<table>.ts` — `"use server"` mutations, each calling
  `requireAdmin()` first; unique-constraint violations (Postgres `23505`)
  surface as a field-level form error, not a crash. **Verify actual constraint
  names against the live DB** (e.g. via a throwaway insert) rather than
  guessing from the migration SQL — Phase 5 found Phase 4's guessed names were
  right, but only by checking.
- Supabase types come from `src/lib/supabase/database.types.ts` (regenerate
  after schema changes — see README's "Database migrations" section) — avoid
  manual type annotations/casts on query results; let the generated types flow
  through instead. Use `Database["public"]["Tables"]["<table>"]["Insert"]` /
  `["Update"]` for row-shaping helper functions, not a hand-written type.
- `"use server"` files may only export async functions — a Zod schema or other
  const needs its own module (see `src/lib/validation/pieces.ts` vs
  `src/lib/actions/pieces.ts`).
- A disabled `<input>` is omitted from `FormData` entirely (`.get()` returns
  `null`, not `""`) — normalize in the form-parsing helper, not the schema, or
  a legitimately-disabled optional field (e.g. a frozen slug) fails validation.
- Generated identifiers that might collide with a hand-edited value (e.g. a
  piece's slug, editable before publication) use generate → attempt insert →
  catch `23505` → retry with the next candidate, bounded — see
  `src/lib/pieces/identifiers.ts`'s `nextCandidate()` and its use in
  `createPiece()`.

## Public data-access pattern (Phase 6+)

`src/lib/data/public.ts` is intentionally different from every other file in
`src/lib/data/`: its functions do **not** call `requireAdmin()`. They run under
the plain `createClient()` client, so Row Level Security — not the DAL — decides
what's visible. Follow this shape for any future public route, not the admin
`requireAdmin()`-gated pattern above:

- Select only public-safe columns. Never `id` (PRD §8.6 "avoid exposing raw
  database IDs") or `internal_notes`/NFC fields.
- A missing row is an expected outcome (`.maybeSingle()`, not `.single()`),
  handled by the page calling `notFound()` — not an error to throw.
- **Embedding a child table does not re-narrow it beyond that child's own RLS
  policy.** `getPublicCollectionBySlug()` embeds `pieces(...)`, but once the
  pieces RLS policy also admits previously-published-then-unpublished/archived
  rows (see below), the embed will include those too — filter the array in
  application code afterward if the caller needs a stricter set than RLS
  allows. Don't reach for `!inner` + `.eq("child.column", ...)` to do this
  instead: it turns the join into an inner join, so a parent row with zero
  matching children (e.g. a freshly published collection with no published
  pieces yet) silently disappears from the result instead of returning with an
  empty list — confirmed against the live DB while building this, not assumed.
- **The pieces RLS policy is intentionally broader than "published only."**
  `supabase/migrations/20260729002744_piece_public_visibility.sql` admits
  `publication_status = 'published' OR first_published_at is not null`, so a
  physical NFC tag that already points at a since-unpublished-or-archived slug
  still resolves (PRD §8.6's "unavailable" state) instead of a bare not-found.
  The page itself still checks `publication_status` and must never render full
  piece data for a non-published row that RLS lets through.

## Permanent public URL (Phase 7+)

`src/lib/site.ts`'s `getSiteOrigin()`/`getPublicPieceUrl(slug)` derive the
site's origin from the incoming request's `host` and `x-forwarded-proto`
headers rather than a `NEXT_PUBLIC_SITE_URL` env var — there's no such var
(Phase 10 is the actual deploy phase), and reading it from the request is
correct in every environment without adding required config. Only callable
from a Server Component/Route Handler (needs `next/headers`). This is what the
admin piece detail page's NFC section shows and the Copy URL button copies —
the exact string an NFC tag should be programmed with.

## Scan tracking (Phase 8+)

`POST /api/scan` (`src/app/api/scan/route.ts`) is a route handler, not a
Server Action — it's called by `ScanBeacon.tsx`'s fire-and-forget client-side
`fetch()`, mounted only in the public piece page's _published_ branch. It
always responds `204` regardless of outcome and never trusts client-supplied
fields except `slug` and `referrer` (see below) — `device_category`,
`country_code`, and the `anonymous_identifier` hash are all derived
server-side from the request. A scan is silently skipped (not recorded, still
`204`) for any slug that isn't currently `publication_status = 'published'` —
matching the public page's own gate, not the wider RLS carve-out that lets
previously-published pieces render "unavailable."

**`referrer` is the one client-supplied field, and that's deliberate**: the
request's own `Referer` header would just be the piece page's own URL (the
fetch originates from it), which is useless. `ScanBeacon.tsx` sends
`document.referrer` instead — the actual page the visitor navigated from —
which the route handler stores as-is (capped at 2048 chars, never used in a
security decision, same trust model as any client-side analytics beacon).
Discovered by testing this in a real browser, not by inspection — a request
header approach silently produced the wrong data.

`src/lib/data/scans.ts` follows the admin `requireAdmin()`-gated pattern like
every other `src/lib/data/` file (unlike `public.ts`). Its aggregation logic
(count queries with date cutoffs) is proven correct in
`src/lib/data/__tests__/scans.integration.test.ts` against the real DB using
the service-role client directly — the functions themselves can't run in
Vitest (same `requireAdmin()`/`next/headers` limitation as Server Actions).

## Images (Phase 9+)

`main_image_url`/`cover_image_url` are no longer text fields in
`pieceSchema`/`collectionSchema` — the admin forms take a file input
(`main_image_file`/`cover_image_file`) plus a "remove current image"
checkbox instead of a hand-typed URL. `src/lib/storage/images.ts` is the one
new module this phase adds, and it deliberately doesn't follow the
`requireAdmin()`-gated `src/lib/data/` pattern: it takes an
already-constructed `SupabaseClient` as a parameter rather than building one
from `next/headers` itself, so it carries no `"server-only"` tag and its pure
path-building functions (`buildImagePath`, `extractImagePath`) are directly
unit-testable — same reasoning as `src/lib/pieces/identifiers.ts`.

`resolveImageUpdate()` is shared by all four of `createPiece`/`updatePiece`/
`createCollection`/`updateCollection` (`src/lib/actions/`): it validates and
uploads a new file eagerly (a live URL is needed immediately to store on the
row), but returns a `commit()` closure for deleting the image the change
replaces or clears — callers only invoke `commit()` after their own DB write
succeeds, so a failed mutation never deletes an image a still-valid row
points at. A create that exhausts `createPiece`'s piece-ID/slug retry loop
without ever succeeding leaves that one upload orphaned rather than rolling
it back — accepted as a rare-edge-case simplification, not fixed.

Storage lives in one public bucket, `images`
(`supabase/migrations/20260729023804_image_storage.sql`), holding both piece
and collection images under path prefixes (`pieces/<uuid>.<ext>` /
`collections/<uuid>.<ext>`) rather than two buckets, since both need
identical policies. **A public bucket's `public = true` flag only bypasses
RLS for the unauthenticated public-URL read path** — an authenticated
client's own `list()`/`remove()` calls (what `deleteImageByUrl()` uses) still
go through ordinary RLS on `storage.objects` and need their own SELECT
policy, or they silently see zero rows: `remove()` then resolves with
`error: null` having deleted nothing. Missed on the first pass
(`20260729023804`'s comment wrongly claimed no SELECT policy was needed at
all) and only caught by manual verification actually fetching the "deleted"
image's public URL afterward and finding it still served — the follow-up
migration `20260729025621_image_storage_admin_select.sql` adds it, and
`src/lib/storage/__tests__/images.integration.test.ts`'s delete assertions
now check real post-delete state (a `list()`/fetch) instead of trusting
`error === null`, which the anonymous-delete test already had to do for the
same reason. Same trap for any future test of a storage RLS policy.

Format/size validation (`src/lib/validation/images.ts`: JPEG/PNG/WebP, 5 MB
cap) is a plain function, not a Zod field — `parsePieceForm`/
`parseCollectionForm` build their schema input from string `FormData.get()`
values, and a `File` doesn't fit that shape. The same limits are set on the
bucket itself (`file_size_limit`/`allowed_mime_types`) as a second layer.

Public pages render the image with a plain `<img>`, not `next/image` —
matches this phase's "structural only" scope and avoids configuring
`images.remotePatterns` for the Supabase storage host; revisit once the
project moves into actual visual design (see README's "Image uploads"
section).

## Next.js version note

This project scaffolded on Next.js 16 / React 19, whose own generated `AGENTS.md`
warned: params and `cookies()` from `next/headers` are async (`Promise`-returning) —
confirmed against `node_modules/next/dist/docs`. If Next.js has been upgraded since
this was written, re-check `node_modules/next/dist/docs` for further breaking changes
before assuming App Router conventions from training data still hold.

## Project-specific rules (PRD §22)

- Build the MVP (PRD §18 acceptance criteria) before anything optional; nothing
  from the out-of-scope list (PRD §17) without explicit justification.
- No visual polish this phase — basic, clean components only.
- Every admin mutation must check authorization server-side; never trust hidden
  UI buttons alone.
- Never expose the Supabase service-role key to the client.
- Database constraints back up application-level validation (unique piece_id,
  unique slug, `collection_id + edition_number` uniqueness, etc. — PRD §9).
- The NFC tag stores only a URL. Editing a piece must never require reprogramming
  the tag (PRD §8.5, §16 Reliability).
- Ambiguous requirements: pick the simplest implementation that preserves future
  extensibility, and record the decision in the README.

## Suggested phase order

PRD §20 lays out 10 phases: project setup → DB + RLS → auth → collections →
pieces → public archive → NFC workflow → scan tracking → images → testing/deploy.
Follow that order; each phase should pass typecheck/lint/tests before the next starts.
Phases 1-9 are done; only testing/deploy (Phase 10) remains.
