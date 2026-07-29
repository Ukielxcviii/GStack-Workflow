import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import WebSocket from "ws";

import type { Page } from "@playwright/test";

import type { Database } from "../src/lib/supabase/database.types";

// Loaded here (not just in global-setup/teardown) so spec files that import
// this module for env-derived values (e.g. the anon key, for a direct RLS
// check) also have it, regardless of worker-process env inheritance.
config({ path: ".env.local" });

/**
 * Shared by global-setup.ts and global-teardown.ts. Same throwaway-admin/
 * service-role pattern as the Vitest integration tests
 * (src/lib/data/__tests__/collections.integration.test.ts) — real DB, no
 * mocks, nothing persists.
 */

export const TEST_MARKER = "E2E";
export const AUTH_FILE = `${__dirname}/.auth/admin.json`;

export function serviceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, serviceRoleKey, {
    realtime: { transport: WebSocket as never },
  });
}

/**
 * collection_code must be uppercase letters/digits only (collectionSchema).
 * Delete order matters: scan_events -> pieces -> collections, since unlike
 * the Vitest integration tests' fixtures, these pieces get *real* scan
 * events recorded against them (the specs actually visit their public pages,
 * firing ScanBeacon) — deleting pieces first hits the
 * scan_events_piece_id_fkey FK constraint.
 */
export async function cleanupFixtures(
  admin: ReturnType<typeof serviceRoleClient>,
) {
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

/**
 * Signs in through the real login form using the admin credentials
 * global-setup.ts wrote to disk — PRD §19's flows start with "Sign in," so
 * specs exercise the actual login UI rather than injecting a session.
 */
export async function signIn(page: Page) {
  const { email, password } = JSON.parse(readFileSync(AUTH_FILE, "utf8")) as {
    email: string;
    password: string;
  };

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("/admin");
}

/** Unique per call so parallel/rerun test data never collides. */
export function uniqueCode() {
  return `${TEST_MARKER}${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
}
