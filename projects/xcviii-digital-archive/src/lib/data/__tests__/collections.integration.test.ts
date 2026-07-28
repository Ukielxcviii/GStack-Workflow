import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";

import type { Database } from "@/lib/supabase/database.types";

/**
 * These exercise the real DB/RLS behavior the collections Server Actions
 * (src/lib/actions/collections.ts) depend on. The actions themselves aren't
 * called directly — they use requireAdmin() (next/headers cookies()) and
 * revalidatePath(), both of which need a real Next.js request context that
 * doesn't exist under Vitest — same constraint noted in Phase 3's
 * rls.admin.test.ts. The manual browser verification covers the actions
 * themselves end-to-end.
 */

const TEST_MARKER = "collections-integration-test";

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
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError) throw createError;
  throwawayUserId = created.user.id;

  await admin.from("profiles").insert({ id: throwawayUserId, role: "admin" });

  asAdmin = createSupabaseClient<Database>(url, anonKey, clientOptions);
  const { error: signInError } = await asAdmin.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;
});

afterAll(async () => {
  await cleanupFixtures();
  if (throwawayUserId) {
    await admin.auth.admin.deleteUser(throwawayUserId);
  }
});

describe("creating collections", () => {
  it("succeeds with a unique slug and code", async () => {
    const { error } = await asAdmin.from("collections").insert({
      name: "Integration Test Collection",
      slug: `${TEST_MARKER}-unique`,
      collection_code: `${TEST_MARKER}-uniq`,
    });
    expect(error).toBeNull();
  });

  it("rejects a duplicate slug with a 23505 unique violation, not a crash", async () => {
    await asAdmin.from("collections").insert({
      name: "First",
      slug: `${TEST_MARKER}-dup-slug`,
      collection_code: `${TEST_MARKER}-dupa`,
    });

    const { error } = await asAdmin.from("collections").insert({
      name: "Second",
      slug: `${TEST_MARKER}-dup-slug`,
      collection_code: `${TEST_MARKER}-dupb`,
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });

  it("rejects a duplicate collection_code with a 23505 unique violation", async () => {
    await asAdmin.from("collections").insert({
      name: "First",
      slug: `${TEST_MARKER}-code-a`,
      collection_code: `${TEST_MARKER}-dupcode`,
    });

    const { error } = await asAdmin.from("collections").insert({
      name: "Second",
      slug: `${TEST_MARKER}-code-b`,
      collection_code: `${TEST_MARKER}-dupcode`,
    });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("23505");
  });
});

describe("archive-with-active-pieces warning (PRD §8.2)", () => {
  it("reports a non-zero active piece count for a collection with an attached piece", async () => {
    const { data: collection } = await asAdmin
      .from("collections")
      .insert({
        name: "Has Pieces",
        slug: `${TEST_MARKER}-has-pieces`,
        collection_code: `${TEST_MARKER}-pcs`,
      })
      .select("id")
      .single();

    await asAdmin.from("pieces").insert({
      piece_id: `${TEST_MARKER}-piece`,
      name: "Attached Piece",
      slug: `${TEST_MARKER}-piece-slug`,
      collection_id: collection!.id,
      product_tier: "other",
      edition_number: 1,
      edition_total: 1,
    });

    // Same query archiveCollection() runs before allowing an unconfirmed
    // archive.
    const { count } = await asAdmin
      .from("pieces")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collection!.id)
      .neq("piece_status", "archived");

    expect(count).toBe(1);
  });

  it("reports zero active pieces for a collection with none attached", async () => {
    const { data: collection } = await asAdmin
      .from("collections")
      .insert({
        name: "No Pieces",
        slug: `${TEST_MARKER}-no-pieces`,
        collection_code: `${TEST_MARKER}-none`,
      })
      .select("id")
      .single();

    const { count } = await asAdmin
      .from("pieces")
      .select("id", { count: "exact", head: true })
      .eq("collection_id", collection!.id)
      .neq("piece_status", "archived");

    expect(count).toBe(0);
  });

  it("allows archiving once the status update is issued", async () => {
    const { data: collection } = await asAdmin
      .from("collections")
      .insert({
        name: "To Archive",
        slug: `${TEST_MARKER}-to-archive`,
        collection_code: `${TEST_MARKER}-arch`,
      })
      .select("id")
      .single();

    const { error } = await asAdmin
      .from("collections")
      .update({ status: "archived" })
      .eq("id", collection!.id);

    expect(error).toBeNull();
  });
});
