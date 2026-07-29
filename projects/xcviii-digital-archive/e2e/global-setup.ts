import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { AUTH_FILE, cleanupFixtures, serviceRoleClient } from "./fixtures";

/**
 * Creates one throwaway admin for the whole E2E run (workers: 1 in
 * playwright.config.ts, so no cross-test races) and writes its credentials
 * to disk for specs to read and sign in through the real login form —
 * PRD §19's flows literally start with "Sign in," so specs drive the actual
 * login UI rather than injecting a session.
 */
export default async function globalSetup() {
  const admin = serviceRoleClient();
  await cleanupFixtures(admin);

  const email = `e2e-test-${crypto.randomUUID()}@example.com`;
  const password = crypto.randomUUID();

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError) throw createError;

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: created.user.id, role: "admin" });
  if (profileError) throw profileError;

  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  writeFileSync(
    AUTH_FILE,
    JSON.stringify({ userId: created.user.id, email, password }),
  );
}
