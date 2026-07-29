import { expect, test } from "@playwright/test";

import { signIn, uniqueCode } from "./fixtures";

/**
 * PRD §19 "Flow one: Create and publish" — sign in, create a collection,
 * create a piece, publish it, open the public URL, confirm the correct
 * information appears.
 */
test("admin creates a collection and piece, publishes it, and the public page shows it", async ({
  page,
}) => {
  await signIn(page);

  const code = uniqueCode();
  const collectionSlug = code.toLowerCase();
  const collectionName = `E2E Create Collection ${code}`;

  await page.goto("/admin/collections/new");
  await page.getByLabel("Name").fill(collectionName);
  await page.getByLabel("Slug").fill(collectionSlug);
  await page.getByLabel("Collection code").fill(code);
  await page.getByRole("button", { name: "Create collection" }).click();
  await page.waitForURL("/admin/collections");
  await expect(page.getByText(collectionName)).toBeVisible();

  const pieceName = `E2E Create Piece ${code}`;

  await page.goto("/admin/pieces/new");
  await page.getByLabel("Name").fill(pieceName);
  await page.getByLabel("Collection").selectOption({ label: collectionName });
  await page.getByLabel("Edition number").fill("1");
  await page.getByLabel("Edition total").fill("10");
  await page.getByRole("button", { name: "Create piece" }).click();
  await page.waitForURL("/admin/pieces");

  const row = page.locator("tr", { hasText: pieceName });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(row.getByText("published")).toBeVisible();

  // Piece IDs/slugs are generated deterministically from the collection
  // slug + edition number (src/lib/pieces/identifiers.ts) — no admin-supplied
  // override was given, so this is the exact slug createPiece() assigned.
  const publicSlug = `${collectionSlug}-001`;
  await page.goto(`/pieces/${publicSlug}`);

  await expect(page.getByRole("heading", { name: pieceName })).toBeVisible();
  await expect(page.getByText("Piece 1 of 10")).toBeVisible();
});
