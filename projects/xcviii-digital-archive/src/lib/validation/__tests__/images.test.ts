import { describe, expect, it } from "vitest";

import { MAX_IMAGE_BYTES, validateImageFile } from "@/lib/validation/images";

function makeFile({ type, size }: { type: string; size: number }): File {
  return new File([new Uint8Array(size)], "test-image", { type });
}

describe("validateImageFile", () => {
  it("accepts an allowed type under the size cap", () => {
    const result = validateImageFile(
      makeFile({ type: "image/png", size: 1024 }),
    );
    expect(result).toEqual({ success: true, extension: "png" });
  });

  it("maps each allowed type to its extension", () => {
    expect(
      validateImageFile(makeFile({ type: "image/jpeg", size: 1024 })),
    ).toEqual({ success: true, extension: "jpg" });
    expect(
      validateImageFile(makeFile({ type: "image/webp", size: 1024 })),
    ).toEqual({ success: true, extension: "webp" });
  });

  it("rejects a disallowed type", () => {
    const result = validateImageFile(
      makeFile({ type: "image/gif", size: 1024 }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a file over the size cap", () => {
    const result = validateImageFile(
      makeFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts a file exactly at the size cap", () => {
    const result = validateImageFile(
      makeFile({ type: "image/png", size: MAX_IMAGE_BYTES }),
    );
    expect(result.success).toBe(true);
  });
});
