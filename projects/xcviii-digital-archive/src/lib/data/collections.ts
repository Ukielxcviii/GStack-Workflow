import "server-only";

import { requireAdmin } from "@/lib/dal";

export async function getCollections() {
  const { supabase } = await requireAdmin();

  // Single query with an embedded count (not N+1 per-collection queries) —
  // same "one aggregate query" principle as the Phase 8 scan-count decision.
  const { data, error } = await supabase
    .from("collections")
    .select("*, pieces(count)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map(({ pieces, ...collection }) => ({
    ...collection,
    pieceCount: pieces?.[0]?.count ?? 0,
  }));
}

export async function getCollectionById(id: string) {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();

  return data;
}
