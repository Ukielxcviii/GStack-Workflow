import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Exercises the real DB constraints the pieces Server Actions
 * (src/lib/actions/pieces.ts) depend on for retry/error classification —
 * same rationale as collections.integration.test.ts: requireAdmin() and
 * revalidatePath() need a real Next.js request context Vitest doesn't have,
 * so the actions themselves are covered by manual browser verification.
 */

const TEST_MARKER = "pieces-integration-test";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const clientOptions = { realtime: { transport: WebSocket as never } };
const admin = createSupabaseClient<Database>(
  url,
  serviceRoleKey,
  clientOptions,
);

let throwawayUserId: string;
let asAdmin: ReturnType<typeof createSupabaseClient<Database>>;
let collectionId: string;

async function cleanupFixtures() {
  const { data: collections } = await admin
    .from("collections")
    .select("id")
    .like("collection_code", `${TEST_MARKER}%`);

  const collectionIds = (collections ?? []).map((c) => c.id as string);
  if (collectionIds.length > 0) {
    await admin.from("pieces").delete().in("collection_id", collectionIds);
    await admin.from("collections").delete().in("id", collectionIds);
  }
}

beforeAll(async () => {
  await cleanupFixtures();

  const email = `${TEST_MARKER}-${crypto.randomUUID()}@example.com`;
  const password = crypto.randomUUID();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createError) throw createError;
  throwawayUserId = created.user.id;

  await admin.from("profiles").insert({ id: throwawayUserId, role: "admin" });

  asAdmin = createSupabaseClient<Database>(url, anonKey, clientOptions);
  const { error: signInError } = await asAdmin.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const { data: collection, error: collectionError } = await admin
    .from("collections")
    .insert({
      name: "Pieces Integration Test Collection",
      slug: `${TEST_MARKER}-collection`,
      collection_code: `${TEST_MARKER}-c`,
    })
    .select("id")
    .single();
  if (collectionError) throw collectionError;
  collectionId = collection.id;
});

afterAll(async () => {
  await cleanupFixtures();
  if (throwawayUserId) {
    await admin.auth.admin.deleteUser(throwawayUserId);
  }
});

function piece(overrides: Record<string, unknown> = {}) {
  return {
    piece_id: `${TEST_MARKER}-${crypto.randomUUID()}`,
    name: "Integration Test Piece",
    slug: `${TEST_MARKER}-${crypto.randomUUID()}`,
    collection_id: collectionId,
    product_tier: "other",
    edition_number: 1,
    // High enough to comfortably fit every edition_number this file uses
    // across its distinct, non-overlapping test fixtures (see the note above).
    edition_total: 1000,
    ...overrides,
  };
}

describe("creating pieces", () => {
  it("succeeds with a valid, unique piece", async () => {
    const { error } = await asAdmin.from("pieces").insert(piece());
    expect(error).toBeNull();
  });

  it("rejects a duplicate piece_id with the constraint name the retry logic matches", async () => {
    const pieceId = `${TEST_MARKER}-dup-id`;
    // Distinct, non-overlapping edition numbers per test in this describe
    // block — otherwise a (collection_id, edition_number) collision between
    // tests silently fails the setup insert and masks what's actually
    // being tested.
    const { error: setupError } = await asAdmin
      .from("pieces")
      .insert(piece({ piece_id: pieceId, edition_number: 11 }));
    expect(setupError).toBeNull();

    const { error } = await asAdmin
      .from("pieces")
      .insert(piece({ piece_id: pieceId, edition_number: 12 }));

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
    expect(error?.message).toContain("pieces_piece_id_key");
  });

  it("rejects a duplicate slug with the constraint name the retry logic matches", async () => {
    const slug = `${TEST_MARKER}-dup-slug`;
    const { error: setupError } = await asAdmin
      .from("pieces")
      .insert(piece({ slug, edition_number: 21 }));
    expect(setupError).toBeNull();

    const { error } = await asAdmin
      .from("pieces")
      .insert(piece({ slug, edition_number: 22 }));

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
    expect(error?.message).toContain("pieces_slug_key");
  });

  it("rejects a duplicate (collection_id, edition_number) with its own constraint name", async () => {
    const { error: setupError } = await asAdmin
      .from("pieces")
      .insert(piece({ edition_number: 31 }));
    expect(setupError).toBeNull();

    const { error } = await asAdmin
      .from("pieces")
      .insert(piece({ edition_number: 31 }));

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
    expect(error?.message).toContain("pieces_collection_id_edition_number_key");
  });
});

describe("edition_number <= edition_total (PRD §8.11, DB backstop)", () => {
  it("rejects at the database level, not just in Zod", async () => {
    const { error } = await asAdmin.from("pieces").insert(
      piece({
        edition_number: 99,
        edition_total: 10,
        piece_id: `${TEST_MARKER}-over`,
      }),
    );

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23514");
    expect(error?.message).toContain("pieces_edition_number_within_total");
  });

  it("accepts edition_number equal to edition_total", async () => {
    const { error } = await asAdmin.from("pieces").insert(
      piece({
        edition_number: 10,
        edition_total: 10,
        piece_id: `${TEST_MARKER}-equal`,
      }),
    );

    expect(error).toBeNull();
  });
});
