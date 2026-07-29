import { expect, test } from "@playwright/test";

import { signIn, uniqueCode } from "./fixtures";

/**
 * Mobile-viewport-only companion to create-and-publish.spec.ts (see
 * playwright.config.ts's "mobile-safari" project) — PRD §16 "public pages
 * must work on mobile first" / "test common phone screen sizes". Only the
 * public-page portion is device-specific; the admin creation flow itself is
 * already proven on desktop by create-and-publish.spec.ts.
 */
test("the public piece page renders without horizontal overflow on a phone viewport", async ({
  page,
}) => {
  await signIn(page);

  const code = uniqueCode();
  const collectionSlug = code.toLowerCase();
  const collectionName = `E2E Mobile Collection ${code}`;
  const pieceName = `E2E Mobile Piece ${code}`;

  await page.goto("/admin/collections/new");
  await page.getByLabel("Name").fill(collectionName);
  await page.getByLabel("Slug").fill(collectionSlug);
  await page.getByLabel("Collection code").fill(code);
  await page.getByRole("button", { name: "Create collection" }).click();
  await page.waitForURL("/admin/collections");

  await page.goto("/admin/pieces/new");
  await page.getByLabel("Name").fill(pieceName);
  await page.getByLabel("Collection").selectOption({ label: collectionName });
  await page.getByLabel("Edition number").fill("1");
  await page.getByLabel("Edition total").fill("3");
  await page.getByRole("button", { name: "Create piece" }).click();
  await page.waitForURL("/admin/pieces");

  const row = page.locator("tr", { hasText: pieceName });
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(row.getByText("published")).toBeVisible();

  await page.goto(`/pieces/${collectionSlug}-001`);
  await expect(page.getByRole("heading", { name: pieceName })).toBeVisible();

  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
