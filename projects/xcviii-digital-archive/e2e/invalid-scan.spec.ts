import { expect, test } from "@playwright/test";

/**
 * PRD §19 "Flow four: Invalid scan" — open a nonexistent public slug,
 * confirm a proper not-found page appears, confirm the application does
 * not crash.
 */
test("an unknown public piece slug shows a not-found page, not a crash", async ({
  page,
}) => {
  const response = await page.goto("/pieces/does-not-exist-e2e-test-slug");

  // The PRD requirement is a proper not-found UI and no crash, not a
  // specific status code — this dev server returns 200 with the not-found
  // page's own content rather than a 404 response.
  expect(response?.status()).toBeLessThan(500);
  await expect(
    page.getByRole("heading", { name: "Piece not found" }),
  ).toBeVisible();
});
