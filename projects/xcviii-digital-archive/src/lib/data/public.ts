import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Unlike every other file in src/lib/data/, these do NOT call requireAdmin() —
 * they run under the plain anon/authenticated client so RLS decides what's
 * visible (see the Phase 6 plan and the "public reads published pieces"
 * policy widened in supabase/migrations/20260729002744_piece_public_visibility.sql).
 * Only public-safe columns are ever selected: no `id`, no `internal_notes`,
 * no NFC fields (PRD §8.6 "avoid exposing internal notes / raw database IDs").
 */

const PIECE_PUBLIC_COLUMNS = `
  name,
  piece_id,
  edition_number,
  edition_total,
  authenticity_status,
  product_tier,
  team,
  hat_size,
  materials,
  craft_technique,
  build_time_minutes,
  completion_date,
  public_description,
  care_instructions,
  main_image_url,
  publication_status,
  piece_status,
  collections ( name )
`;

export async function getPublicPieceBySlug(slug: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pieces")
    .select(PIECE_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

const COLLECTION_PUBLIC_COLUMNS = `
  name,
  slug,
  story,
  release_date,
  cover_image_url,
  pieces ( name, slug, piece_id, edition_number, edition_total, main_image_url, publication_status )
`;

export async function getPublicCollectionBySlug(slug: string) {
  const supabase = await createClient();

  // The embedded pieces(...) applies the pieces table's own RLS, but that
  // policy now also admits previously-published pieces that are no longer
  // published (Phase 6's "unavailable" state) — so `publication_status` is
  // selected and filtered here in application code rather than relying on
  // the embed alone. (An `!inner` join would filter this correctly but also
  // drops the collection itself when it has zero published pieces yet,
  // wrongly 404ing a legitimately published, still-empty collection.)
  const { data } = await supabase
    .from("collections")
    .select(COLLECTION_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;

  const { pieces, ...collection } = data;
  return {
    ...collection,
    pieces: pieces.filter((piece) => piece.publication_status === "published"),
  };
}
