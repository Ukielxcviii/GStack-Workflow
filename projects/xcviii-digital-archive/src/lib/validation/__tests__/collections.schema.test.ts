import { describe, expect, it } from "vitest";

import { collectionSchema } from "@/lib/validation/collections";

const validInput = {
  name: "First Light",
  slug: "first-light",
  collection_code: "fl",
  short_description: "The first official collection.",
};

describe("collectionSchema", () => {
  it("accepts valid input and normalizes casing", () => {
    const result = collectionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collection_code).toBe("FL");
      expect(result.data.slug).toBe("first-light");
    }
  });

  it("rejects a missing name", () => {
    const result = collectionSchema.safeParse({ ...validInput, name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid slug format", () => {
    const result = collectionSchema.safeParse({
      ...validInput,
      slug: "First Light!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a collection code with symbols", () => {
    const result = collectionSchema.safeParse({
      ...validInput,
      collection_code: "F-L",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative planned_piece_total", () => {
    const result = collectionSchema.safeParse({
      ...validInput,
      planned_piece_total: -1,
    });
    expect(result.success).toBe(false);
  });

  it("treats an empty planned_piece_total as unset", () => {
    const result = collectionSchema.safeParse({
      ...validInput,
      planned_piece_total: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.planned_piece_total).toBeUndefined();
    }
  });
});
