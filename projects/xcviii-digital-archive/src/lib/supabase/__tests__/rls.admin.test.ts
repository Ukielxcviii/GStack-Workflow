import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";

import type { Database } from "@/lib/supabase/database.types";

/**
 * Phase 3: the admin-authenticated RLS behavior deferred from Phase 2's plan,
 * now that a real sign-in path (supabase.auth.signInWithPassword) exists.
 *
 * Uses a throwaway admin user created via the service-role client — not your
 * real seeded admin account — so no real credentials are needed and nothing
 * persists after the run.
 */

const TEST_MARKER = "rls-admin-test-fixture";

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
let throwawayEmail: string;
let throwawayPassword: string;
let draftCollectionId: string;
let draftPieceId: string;

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

  throwawayEmail = `${TEST_MARKER}-${crypto.randomUUID()}@example.com`;
  throwawayPassword = crypto.randomUUID();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: throwawayEmail,
      password: throwawayPassword,
      email_confirm: true,
    });
  if (createError) throw createError;
  throwawayUserId = created.user.id;

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: throwawayUserId, role: "admin" });
  if (profileError) throw profileError;

  const { data: collection, error: collectionError } = await admin
    .from("collections")
    .insert({
      name: "RLS Admin Test Draft Collection",
      slug: `${TEST_MARKER}-collection`,
      collection_code: `${TEST_MARKER}-code`,
      status: "draft",
    })
    .select("id")
    .single();
  if (collectionError) throw collectionError;
  draftCollectionId = collection.id;

  const { data: piece, error: pieceError } = await admin
    .from("pieces")
    .insert({
      piece_id: `${TEST_MARKER}-piece`,
      name: "RLS Admin Test Draft Piece",
      slug: `${TEST_MARKER}-piece-slug`,
      collection_id: draftCollectionId,
      product_tier: "other",
      edition_number: 1,
      edition_total: 1,
      publication_status: "draft",
    })
    .select("id")
    .single();
  if (pieceError) throw pieceError;
  draftPieceId = piece.id;
});

afterAll(async () => {
  await cleanupFixtures();
  if (throwawayUserId) {
    await admin.auth.admin.deleteUser(throwawayUserId);
  }
});

describe("wrong credentials", () => {
  it("signInWithPassword rejects an unknown email/password combo", async () => {
    const anon = createSupabaseClient<Database>(url, anonKey, clientOptions);
    const { error } = await anon.auth.signInWithPassword({
      email: `nobody-${crypto.randomUUID()}@example.com`,
      password: "definitely-wrong",
    });
    expect(error).not.toBeNull();
  });
});

describe("authenticated admin RLS", () => {
  it("can sign in and read a draft collection", async () => {
    const asAdmin = createSupabaseClient<Database>(url, anonKey, clientOptions);
    const { error: signInError } = await asAdmin.auth.signInWithPassword({
      email: throwawayEmail,
      password: throwawayPassword,
    });
    expect(signInError).toBeNull();

    const { data } = await asAdmin
      .from("collections")
      .select("id")
      .eq("id", draftCollectionId);
    expect(data).toHaveLength(1);
  });

  it("can read a draft piece", async () => {
    const asAdmin = createSupabaseClient<Database>(url, anonKey, clientOptions);
    await asAdmin.auth.signInWithPassword({
      email: throwawayEmail,
      password: throwawayPassword,
    });

    const { data } = await asAdmin
      .from("pieces")
      .select("id")
      .eq("id", draftPieceId);
    expect(data).toHaveLength(1);
  });

  it("can insert a new collection", async () => {
    const asAdmin = createSupabaseClient<Database>(url, anonKey, clientOptions);
    await asAdmin.auth.signInWithPassword({
      email: throwawayEmail,
      password: throwawayPassword,
    });

    const { error } = await asAdmin.from("collections").insert({
      name: "RLS Admin Test Insert Collection",
      slug: `${TEST_MARKER}-insert-collection`,
      collection_code: `${TEST_MARKER}-insert`,
    });
    expect(error).toBeNull();
  });

  it("can update the draft collection", async () => {
    const asAdmin = createSupabaseClient<Database>(url, anonKey, clientOptions);
    await asAdmin.auth.signInWithPassword({
      email: throwawayEmail,
      password: throwawayPassword,
    });

    const { error } = await asAdmin
      .from("collections")
      .update({ short_description: "updated by admin RLS test" })
      .eq("id", draftCollectionId);
    expect(error).toBeNull();
  });
});
