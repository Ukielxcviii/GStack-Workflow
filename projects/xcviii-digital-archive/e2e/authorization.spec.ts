import { expect, test } from "@playwright/test";

import { signIn, uniqueCode } from "./fixtures";

/**
 * PRD §19 "Flow three: Authorization" — sign out, attempt an admin route,
 * confirm redirection to login, attempt an unauthorized mutation, confirm
 * rejection.
 *
 * The "unauthorized mutation" is a direct anonymous REST call to Supabase
 * (not a UI form submission) — requireAdmin() already redirects a signed-out
 * visitor away from every admin page before any form is reachable, so the
 * real thing left to prove is the RLS backstop underneath it (per AGENTS.md:
 * "RLS's is_admin() is the backstop under both").
 */
test("signed-out visitors are redirected from admin routes and blocked from writing data", async ({
  page,
  request,
}) => {
  await signIn(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("/admin/login");

  await page.goto("/admin/pieces");
  await expect(page).toHaveURL(/\/admin\/login/);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const response = await request.post(`${supabaseUrl}/rest/v1/collections`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    data: {
      name: "Unauthorized Insert Attempt",
      slug: `unauthorized-${uniqueCode().toLowerCase()}`,
      collection_code: uniqueCode(),
    },
  });

  expect(response.ok()).toBe(false);
});
