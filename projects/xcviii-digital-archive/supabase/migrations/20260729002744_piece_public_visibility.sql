-- Phase 6: widen public piece visibility (PRD §8.6 not-found vs. unavailable).
--
-- Once a piece has ever been published, a physical NFC tag may already point
-- at its slug (same reasoning as the §8.5 slug freeze) — so anon must still
-- be able to read it after it's unpublished or archived, to render an
-- "unavailable" page instead of a bare not-found. A piece that has never been
-- published has no tag pointing at it, so it correctly stays invisible to
-- anon (not-found). Public-facing queries only ever select public-safe
-- columns, so this doesn't expose internal_notes or any other admin-only
-- field on a no-longer-published row.
drop policy "public reads published pieces" on public.pieces;

create policy "public reads published pieces"
  on public.pieces
  for select
  using (publication_status = 'published' or first_published_at is not null);
