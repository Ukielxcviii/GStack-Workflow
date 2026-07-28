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
```

`npm run test` (Vitest) and `npm run test:e2e` (Playwright) will be added starting
Phase 2, once there's a data layer to test.

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
