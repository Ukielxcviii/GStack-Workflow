import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Exercises the real DB aggregation behavior src/lib/data/scans.ts's
 * getPieceScanSummary/getScanTotals/getRecentScans rely on (count queries
 * with date cutoffs, ordering) — not those functions themselves, since they
 * call requireAdmin(), which needs a real Next.js request context Vitest
 * doesn't have (same rationale as pieces.integration.test.ts). Uses the
 * service-role client directly: this file tests query correctness, not
 * authorization (that's rls.public.test.ts's job).
 */

const TEST_MARKER = "scans-integration-test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const clientOptions = { realtime: { transport: WebSocket as never } };
const admin = createSupabaseClient<Database>(
  url,
  serviceRoleKey,
  clientOptions,
);

let collectionId: string;
let pieceAId: string;
let pieceBId: string;

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function cleanupFixtures() {
  const { data: collections } = await admin
    .from("collections")
    .select("id")
    .like("collection_code", `${TEST_MARKER}%`);

  const collectionIds = (collections ?? []).map((c) => c.id as string);
  if (collectionIds.length > 0) {
    const { data: pieces } = await admin
      .from("pieces")
      .select("id")
      .in("collection_id", collectionIds);
    const pieceIds = (pieces ?? []).map((p) => p.id as string);
    if (pieceIds.length > 0) {
      await admin.from("scan_events").delete().in("piece_id", pieceIds);
    }
    await admin.from("pieces").delete().in("collection_id", collectionIds);
    await admin.from("collections").delete().in("id", collectionIds);
  }
}

beforeAll(async () => {
  await cleanupFixtures();

  const { data: collection, error: collectionError } = await admin
    .from("collections")
    .insert({
      name: "Scans Integration Test Collection",
      slug: `${TEST_MARKER}-collection`,
      collection_code: `${TEST_MARKER}-c`,
    })
    .select("id")
    .single();
  if (collectionError) throw collectionError;
  collectionId = collection.id;

  const { data: pieceA, error: pieceAError } = await admin
    .from("pieces")
    .insert({
      piece_id: `${TEST_MARKER}-a`,
      name: "Scans Integration Test Piece A",
      slug: `${TEST_MARKER}-a`,
      collection_id: collectionId,
      product_tier: "other",
      edition_number: 1,
      edition_total: 10,
    })
    .select("id")
    .single();
  if (pieceAError) throw pieceAError;
  pieceAId = pieceA.id;

  const { data: pieceB, error: pieceBError } = await admin
    .from("pieces")
    .insert({
      piece_id: `${TEST_MARKER}-b`,
      name: "Scans Integration Test Piece B",
      slug: `${TEST_MARKER}-b`,
      collection_id: collectionId,
      product_tier: "other",
      edition_number: 2,
      edition_total: 10,
    })
    .select("id")
    .single();
  if (pieceBError) throw pieceBError;
  pieceBId = pieceB.id;

  // Piece A: one scan now, one 10 days ago, one 40 days ago.
  const { error: setupErrorA } = await admin.from("scan_events").insert([
    { piece_id: pieceAId, scanned_at: daysAgoIso(0) },
    { piece_id: pieceAId, scanned_at: daysAgoIso(10) },
    { piece_id: pieceAId, scanned_at: daysAgoIso(40) },
  ]);
  expect(setupErrorA).toBeNull();

  // Piece B: one scan 5 days ago.
  const { error: setupErrorB } = await admin
    .from("scan_events")
    .insert([{ piece_id: pieceBId, scanned_at: daysAgoIso(5) }]);
  expect(setupErrorB).toBeNull();
});

afterAll(async () => {
  await cleanupFixtures();
});

describe("scan summary aggregation", () => {
  it("counts total, 7-day, and 30-day windows correctly for a single piece", async () => {
    const [total, last7Days, last30Days] = await Promise.all([
      admin
        .from("scan_events")
        .select("*", { count: "exact", head: true })
        .eq("piece_id", pieceAId),
      admin
        .from("scan_events")
        .select("*", { count: "exact", head: true })
        .eq("piece_id", pieceAId)
        .gte("scanned_at", daysAgoIso(7)),
      admin
        .from("scan_events")
        .select("*", { count: "exact", head: true })
        .eq("piece_id", pieceAId)
        .gte("scanned_at", daysAgoIso(30)),
    ]);

    expect(total.count).toBe(3);
    expect(last7Days.count).toBe(1);
    expect(last30Days.count).toBe(2);
  });

  it("finds the most recent scan for a piece", async () => {
    const { data } = await admin
      .from("scan_events")
      .select("scanned_at")
      .eq("piece_id", pieceAId)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(data?.scanned_at).toBeTruthy();
    const mostRecent = new Date(data!.scanned_at).getTime();
    const now = Date.now();
    expect(now - mostRecent).toBeLessThan(60_000);
  });

  it("aggregates totals across all pieces, not just one", async () => {
    const { count: totalAcrossBoth } = await admin
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .in("piece_id", [pieceAId, pieceBId]);

    expect(totalAcrossBoth).toBe(4);

    const { count: last30DaysAcrossBoth } = await admin
      .from("scan_events")
      .select("*", { count: "exact", head: true })
      .in("piece_id", [pieceAId, pieceBId])
      .gte("scanned_at", daysAgoIso(30));

    expect(last30DaysAcrossBoth).toBe(3);
  });

  it("returns recent scans newest-first, respecting a limit", async () => {
    const { data } = await admin
      .from("scan_events")
      .select("scanned_at, piece_id")
      .in("piece_id", [pieceAId, pieceBId])
      .order("scanned_at", { ascending: false })
      .limit(2);

    expect(data).toHaveLength(2);
    const [first, second] = data!;
    expect(new Date(first.scanned_at).getTime()).toBeGreaterThanOrEqual(
      new Date(second.scanned_at).getTime(),
    );
  });
});
