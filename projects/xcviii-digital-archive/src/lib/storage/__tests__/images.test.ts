import { describe, expect, it } from "vitest";

import { buildImagePath, extractImagePath } from "@/lib/storage/images";

describe("buildImagePath", () => {
  it("prefixes with the given folder and extension", () => {
    const path = buildImagePath({ prefix: "pieces", extension: "jpg" });
    expect(path).toMatch(/^pieces\/[0-9a-f-]{36}\.jpg$/);
  });

  it("produces a different path on every call", () => {
    const a = buildImagePath({ prefix: "collections", extension: "png" });
    const b = buildImagePath({ prefix: "collections", extension: "png" });
    expect(a).not.toBe(b);
  });
});

describe("extractImagePath", () => {
  it("recovers the object path from a public bucket URL", () => {
    const url =
      "https://abcxyz.supabase.co/storage/v1/object/public/images/pieces/123e4567-e89b-12d3-a456-426614174000.jpg";
    expect(extractImagePath(url)).toBe(
      "pieces/123e4567-e89b-12d3-a456-426614174000.jpg",
    );
  });

  it("returns null for a URL that isn't from the images bucket", () => {
    expect(extractImagePath("https://example.com/hat.jpg")).toBeNull();
    expect(
      extractImagePath(
        "https://abcxyz.supabase.co/storage/v1/object/public/other-bucket/pieces/1.jpg",
      ),
    ).toBeNull();
  });
});
