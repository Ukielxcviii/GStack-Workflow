import { expect, test } from "@playwright/test";

import { signIn, uniqueCode } from "./fixtures";

/**
 * PRD §19 "Flow two: Update without changing NFC URL" — open an existing
 * published piece, change its public description, save, reload the same
 * public URL, confirm the updated description appears and the URL/slug is
 * unchanged (PRD §8.5's slug-freeze-after-publication rule).
 */
test("editing a published piece's description keeps its public URL stable", async ({
  page,
}) => {
  await signIn(page);

  const code = uniqueCode();
  const collectionSlug = code.toLowerCase();
  const collectionName = `E2E Update Collection ${code}`;
  const pieceName = `E2E Update Piece ${code}`;

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
  await page.getByLabel("Edition total").fill("5");
  await page.getByRole("button", { name: "Create piece" }).click();
  await page.waitForURL("/admin/pieces");

  const row = page.locator("tr", { hasText: pieceName });
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(row.getByText("published")).toBeVisible();

  const publicSlug = `${collectionSlug}-001`;

  await row.getByRole("link", { name: pieceName }).click();
  await page.getByRole("link", { name: "Edit" }).click();
  await page.waitForURL(/\/admin\/pieces\/.+\/edit/);

  const updatedDescription = `Updated description ${code}`;
  await page.getByLabel("Public description").fill(updatedDescription);
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/admin\/pieces\/[^/]+$/);

  await page.goto(`/pieces/${publicSlug}`);
  await expect(page).toHaveURL(new RegExp(`/pieces/${publicSlug}$`));
  await expect(page.getByText(updatedDescription)).toBeVisible();
});
