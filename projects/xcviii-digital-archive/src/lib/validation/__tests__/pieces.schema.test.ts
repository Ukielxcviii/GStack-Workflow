import { describe, expect, it } from "vitest";

import { pieceSchema } from "@/lib/validation/pieces";

// Every rule below is one of PRD §8.11's required validations.
const validInput = {
  name: "Pearl Halo — Navy",
  collection_id: "8f3d35b3-baf6-4ca6-844c-1109220377aa",
  product_tier: "pearl_halo",
  edition_number: 1,
  edition_total: 25,
  authenticity_status: "authentic",
  piece_status: "in_production",
  nfc_status: "not_assigned",
};

function parse(overrides: Record<string, unknown> = {}) {
  return pieceSchema.safeParse({ ...validInput, ...overrides });
}

describe("pieceSchema", () => {
  it("accepts valid input", () => {
    expect(parse().success).toBe(true);
  });

  it("requires a name", () => {
    expect(parse({ name: "   " }).success).toBe(false);
  });

  it("requires a collection", () => {
    expect(parse({ collection_id: "" }).success).toBe(false);
  });

  it("rejects a non-positive edition number", () => {
    expect(parse({ edition_number: 0 }).success).toBe(false);
    expect(parse({ edition_number: -1 }).success).toBe(false);
  });

  it("rejects a non-positive edition total", () => {
    expect(parse({ edition_total: 0 }).success).toBe(false);
  });

  it("rejects an edition number greater than the edition total", () => {
    const result = parse({ edition_number: 26, edition_total: 25 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["edition_number"]);
    }
  });

  it("accepts an edition number equal to the edition total", () => {
    expect(parse({ edition_number: 25, edition_total: 25 }).success).toBe(true);
  });

  it("rejects negative pearl, crystal, and build-time values", () => {
    expect(parse({ pearl_count: -1 }).success).toBe(false);
    expect(parse({ crystal_count: -1 }).success).toBe(false);
    expect(parse({ build_time_minutes: -1 }).success).toBe(false);
  });

  it("treats blank optional numbers as unset rather than zero", () => {
    const result = parse({ pearl_count: "", build_time_minutes: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pearl_count).toBeUndefined();
      expect(result.data.build_time_minutes).toBeUndefined();
    }
  });

  it("rejects invalid status values", () => {
    expect(parse({ product_tier: "sombrero" }).success).toBe(false);
    expect(parse({ authenticity_status: "probably" }).success).toBe(false);
    expect(parse({ piece_status: "lost" }).success).toBe(false);
    expect(parse({ nfc_status: "melted" }).success).toBe(false);
  });

  it("rejects a malformed slug but allows a blank one (auto-generated)", () => {
    expect(parse({ slug: "Not A Slug!" }).success).toBe(false);
    expect(parse({ slug: "" }).success).toBe(true);
  });
});
