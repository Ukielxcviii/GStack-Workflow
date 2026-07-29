import "server-only";

import { requireAdmin } from "@/lib/dal";

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** PRD §8.10's exact four fields, shown on the admin piece detail screen. */
export async function getPieceScanSummary(pieceId: string) {
  const { supabase } = await requireAdmin();

  const [total, last7Days, last30Days, mostRecent] = await Promise.all([
    supabase
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .eq("piece_id", pieceId),
    supabase
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .eq("piece_id", pieceId)
      .gte("scanned_at", daysAgoIso(7)),
    supabase
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .eq("piece_id", pieceId)
      .gte("scanned_at", daysAgoIso(30)),
    supabase
      .from("scan_events")
      .select("scanned_at")
      .eq("piece_id", pieceId)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    total: total.count ?? 0,
    last7Days: last7Days.count ?? 0,
    last30Days: last30Days.count ?? 0,
    mostRecentScanAt: mostRecent.data?.scanned_at ?? null,
  };
}

/** PRD §12 dashboard home. */
export async function getScanTotals() {
  const { supabase } = await requireAdmin();

  const [total, last30Days] = await Promise.all([
    supabase.from("scan_events").select("*", { count: "exact", head: true }),
    supabase
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .gte("scanned_at", daysAgoIso(30)),
  ]);

  return {
    total: total.count ?? 0,
    last30Days: last30Days.count ?? 0,
  };
}

/** PRD §11's getRecentScans, backing the admin scan-activity screen. */
export async function getRecentScans(limit = 20) {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("scan_events")
    .select("scanned_at, referrer, device_category, pieces(name, slug)")
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}
