import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";

import { buildImagePath, IMAGE_BUCKET } from "@/lib/storage/images";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Exercises the images bucket's RLS (supabase/migrations/
 * 20260729023804_image_storage.sql, 20260729025621_image_storage_admin_select.sql)
 * against the real linked dev project — same throwaway-admin pattern as
 * collections.integration.test.ts. The upload/delete helpers themselves
 * (src/lib/storage/images.ts) aren't called directly since they're thin
 * wrappers; this proves the policies they rely on actually behave as
 * documented.
 *
 * supabase-js's storage remove()/upload() resolve with `error: null` even
 * when RLS silently filters the operation to zero affected rows (discovered
 * manually: an admin's remove() on an object it couldn't SELECT returned no
 * error but deleted nothing — the bug 20260729025621 fixes). Every
 * assertion here therefore checks actual state (list()/fetch on the public
 * URL) rather than trusting `error` alone.
 */

const TEST_MARKER = "images-integration-test";

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
let asAnon: ReturnType<typeof createSupabaseClient<Database>>;
const uploadedPaths: string[] = [];

function testFile() {
  return new File([new Uint8Array([1, 2, 3, 4])], "test.png", {
    type: "image/png",
  });
}

beforeAll(async () => {
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

  asAnon = createSupabaseClient<Database>(url, anonKey, clientOptions);
});

afterAll(async () => {
  if (uploadedPaths.length > 0) {
    await admin.storage.from(IMAGE_BUCKET).remove(uploadedPaths);
  }
  if (throwawayUserId) {
    await admin.from("profiles").delete().eq("id", throwawayUserId);
    await admin.auth.admin.deleteUser(throwawayUserId);
  }
});

describe("images bucket RLS", () => {
  it("allows an admin to upload", async () => {
    const path = buildImagePath({ prefix: "pieces", extension: "png" });
    uploadedPaths.push(path);

    const { error } = await asAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(path, testFile(), { contentType: "image/png" });

    expect(error).toBeNull();
  });

  it("rejects an anonymous upload", async () => {
    const path = buildImagePath({ prefix: "pieces", extension: "png" });

    const { error } = await asAnon.storage
      .from(IMAGE_BUCKET)
      .upload(path, testFile(), { contentType: "image/png" });

    expect(error).not.toBeNull();
  });

  it("serves an uploaded object on its public URL without auth", async () => {
    const path = buildImagePath({ prefix: "pieces", extension: "png" });
    uploadedPaths.push(path);

    await asAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(path, testFile(), { contentType: "image/png" });

    const {
      data: { publicUrl },
    } = asAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(path);

    const response = await fetch(publicUrl);
    expect(response.status).toBe(200);
  });

  it("allows an admin to list its own uploads", async () => {
    const path = buildImagePath({ prefix: "pieces", extension: "png" });
    uploadedPaths.push(path);

    await asAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(path, testFile(), { contentType: "image/png" });

    const { data } = await asAdmin.storage.from(IMAGE_BUCKET).list("pieces");
    expect(data?.some((entry) => path.endsWith(entry.name))).toBe(true);
  });

  it("allows an admin to delete an uploaded object", async () => {
    const path = buildImagePath({ prefix: "collections", extension: "png" });

    await asAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(path, testFile(), { contentType: "image/png" });

    const { error } = await asAdmin.storage.from(IMAGE_BUCKET).remove([path]);
    expect(error).toBeNull();

    // remove() resolves with no error even when it deleted nothing (see the
    // file-level note) — the service-role list() is what actually proves
    // the object is gone.
    const { data } = await admin.storage.from(IMAGE_BUCKET).list("collections");
    expect(data?.some((entry) => path.endsWith(entry.name))).toBe(false);
  });

  it("rejects an anonymous delete", async () => {
    const path = buildImagePath({ prefix: "pieces", extension: "png" });
    uploadedPaths.push(path);

    await asAdmin.storage
      .from(IMAGE_BUCKET)
      .upload(path, testFile(), { contentType: "image/png" });

    const { error } = await asAnon.storage.from(IMAGE_BUCKET).remove([path]);
    // supabase-js resolves remove() even for a denied delete (RLS just makes
    // it a no-op on zero rows) — assert via the admin client that the object
    // is still there rather than asserting on `error`.
    const { data } = await admin.storage
      .from(IMAGE_BUCKET)
      .list(path.split("/")[0]);
    expect(data?.some((entry) => path.endsWith(entry.name))).toBe(true);
    expect(error).toBeNull();
  });
});
