import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";

import type { Database } from "@/lib/supabase/database.types";

// Node 20 has no native WebSocket; supabase-js always constructs a realtime
// client even though these tests never call .channel(). Polyfill via `ws` so
// client construction doesn't throw.

/**
 * Integration tests against the real linked dev Supabase project (Phase 2:
 * anon/public RLS only). Admin-authenticated RLS behavior is deferred to
 * Phase 3, once a login flow exists to sign in with — see the Phase 2 plan.
 *
 * Fixtures are seeded/torn down with the service-role client (bypasses RLS),
 * which is only ever constructed here in test setup — never in app code.
 */

const TEST_MARKER = "rls-test-fixture";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const clientOptions = { realtime: { transport: WebSocket as never } };
const admin = createSupabaseClient<Database>(
  url,
  serviceRoleKey,
  clientOptions,
);
const anon = createSupabaseClient<Database>(url, anonKey, clientOptions);

let publishedCollectionId: string;
let draftCollectionId: string;
let publishedPieceId: string;
let draftPieceId: string;

async function cleanupFixtures() {
  const { data: collections } = await admin
    .from("collections")
    .select("id")
    .like("collection_code", `${TEST_MARKER}%`);

  const collectionIds = (collections ?? []).map((c) => c.id as string);
  if (collectionIds.length === 0) return;

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

beforeAll(async () => {
  await cleanupFixtures();

  const { data: published, error: publishedError } = await admin
    .from("collections")
    .insert({
      name: "RLS Test Published Collection",
      slug: `${TEST_MARKER}-published-collection`,
      collection_code: `${TEST_MARKER}-pub`,
      status: "published",
    })
    .select("id")
    .single();
  if (publishedError) throw publishedError;
  publishedCollectionId = published.id;

  const { data: draft, error: draftError } = await admin
    .from("collections")
    .insert({
      name: "RLS Test Draft Collection",
      slug: `${TEST_MARKER}-draft-collection`,
      collection_code: `${TEST_MARKER}-draft`,
      status: "draft",
    })
    .select("id")
    .single();
  if (draftError) throw draftError;
  draftCollectionId = draft.id;

  const { data: publishedPiece, error: publishedPieceError } = await admin
    .from("pieces")
    .insert({
      piece_id: `${TEST_MARKER}-published`,
      name: "RLS Test Published Piece",
      slug: `${TEST_MARKER}-published-piece`,
      collection_id: publishedCollectionId,
      product_tier: "other",
      edition_number: 1,
      edition_total: 1,
      publication_status: "published",
    })
    .select("id")
    .single();
  if (publishedPieceError) throw publishedPieceError;
  publishedPieceId = publishedPiece.id;

  const { data: draftPiece, error: draftPieceError } = await admin
    .from("pieces")
    .insert({
      piece_id: `${TEST_MARKER}-draft`,
      name: "RLS Test Draft Piece",
      slug: `${TEST_MARKER}-draft-piece`,
      collection_id: publishedCollectionId,
      product_tier: "other",
      edition_number: 2,
      edition_total: 1,
      publication_status: "draft",
    })
    .select("id")
    .single();
  if (draftPieceError) throw draftPieceError;
  draftPieceId = draftPiece.id;
});

afterAll(async () => {
  await cleanupFixtures();
});

describe("collections RLS", () => {
  it("anon can read a published collection", async () => {
    const { data } = await anon
      .from("collections")
      .select("id")
      .eq("id", publishedCollectionId);
    expect(data).toHaveLength(1);
  });

  it("anon cannot read a draft collection", async () => {
    const { data } = await anon
      .from("collections")
      .select("id")
      .eq("id", draftCollectionId);
    expect(data).toHaveLength(0);
  });

  it("anon cannot insert a collection", async () => {
    const { error } = await anon.from("collections").insert({
      name: "Anon Attempt",
      slug: `${TEST_MARKER}-anon-insert`,
      collection_code: `${TEST_MARKER}-anon`,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });
});

describe("pieces RLS", () => {
  it("anon can read a published piece", async () => {
    const { data } = await anon
      .from("pieces")
      .select("id")
      .eq("id", publishedPieceId);
    expect(data).toHaveLength(1);
  });

  it("anon cannot read a draft piece", async () => {
    const { data } = await anon
      .from("pieces")
      .select("id")
      .eq("id", draftPieceId);
    expect(data).toHaveLength(0);
  });

  it("anon cannot insert a piece", async () => {
    const { error } = await anon.from("pieces").insert({
      piece_id: `${TEST_MARKER}-anon-insert`,
      name: "Anon Attempt",
      slug: `${TEST_MARKER}-anon-insert-piece`,
      collection_id: publishedCollectionId,
      product_tier: "other",
      edition_number: 99,
      edition_total: 1,
    });
    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });
});

describe("scan_events RLS", () => {
  it("anon can insert a scan event", async () => {
    const { error } = await anon.from("scan_events").insert({
      piece_id: publishedPieceId,
    });
    expect(error).toBeNull();
  });

  it("anon cannot read scan events", async () => {
    const { data } = await anon
      .from("scan_events")
      .select("id")
      .eq("piece_id", publishedPieceId);
    expect(data).toHaveLength(0);
  });
});
