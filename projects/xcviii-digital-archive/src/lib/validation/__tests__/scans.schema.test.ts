import { describe, expect, it } from "vitest";

import { scanRequestSchema } from "@/lib/validation/scans";

describe("scanRequestSchema", () => {
  it("accepts a valid slug", () => {
    const result = scanRequestSchema.safeParse({ slug: "pearl-halo-001" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty slug", () => {
    const result = scanRequestSchema.safeParse({ slug: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing slug", () => {
    const result = scanRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only slug", () => {
    const result = scanRequestSchema.safeParse({ slug: "   " });
    expect(result.success).toBe(false);
  });

  it("accepts an optional referrer", () => {
    const result = scanRequestSchema.safeParse({
      slug: "pearl-halo-001",
      referrer: "https://instagram.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a missing referrer", () => {
    const result = scanRequestSchema.safeParse({ slug: "pearl-halo-001" });
    expect(result.success).toBe(true);
  });

  it("rejects an excessively long referrer", () => {
    const result = scanRequestSchema.safeParse({
      slug: "pearl-halo-001",
      referrer: "a".repeat(2049),
    });
    expect(result.success).toBe(false);
  });
});
