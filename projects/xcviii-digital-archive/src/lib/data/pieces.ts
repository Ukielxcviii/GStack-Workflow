import "server-only";

import { requireAdmin } from "@/lib/dal";

export type PieceFilters = {
  /** Matches piece name or piece ID (PRD §8.8). */
  query?: string;
  collectionId?: string;
  publicationStatus?: string;
  pieceStatus?: string;
};

/**
 * PRD §8.8. Single options object so pagination can be added as a parameter
 * later without reshaping call sites, per the PRD's guidance.
 */
export async function getPieces(filters: PieceFilters = {}) {
  const { supabase } = await requireAdmin();

  // The embedded scan_events(count) is one aggregate for the whole list, not a
  // per-row query — the locked engineering decision for the "Total scans"
  // column. It reads 0 for every piece until Phase 8 records scans.
  let request = supabase
    .from("pieces")
    .select("*, collections(name, slug, collection_code), scan_events(count)")
    .order("created_at", { ascending: false });

  if (filters.query) {
    const escaped = filters.query.replace(/[%,()]/g, " ").trim();
    if (escaped) {
      request = request.or(
        `name.ilike.%${escaped}%,piece_id.ilike.%${escaped}%`,
      );
    }
  }
  if (filters.collectionId) {
    request = request.eq("collection_id", filters.collectionId);
  }
  if (filters.publicationStatus) {
    request = request.eq("publication_status", filters.publicationStatus);
  }
  if (filters.pieceStatus) {
    request = request.eq("piece_status", filters.pieceStatus);
  }

  const { data, error } = await request;
  if (error) throw error;

  return (data ?? []).map(({ scan_events, ...piece }) => ({
    ...piece,
    scanCount: scan_events?.[0]?.count ?? 0,
  }));
}

export async function getPieceById(id: string) {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("pieces")
    .select("*, collections(name, slug, collection_code)")
    .eq("id", id)
    .single();

  return data;
}

/** Counts for the dashboard home (PRD §12). */
export async function getPieceCounts() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("pieces")
    .select("publication_status");
  if (error) throw error;

  const rows = data ?? [];
  return {
    total: rows.length,
    published: rows.filter((p) => p.publication_status === "published").length,
    draft: rows.filter((p) => p.publication_status === "draft").length,
  };
}
