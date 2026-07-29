import { describe, expect, it } from "vitest";

import { detectDeviceCategory } from "@/lib/scans/device";

describe("detectDeviceCategory", () => {
  it("returns null when no user agent is present", () => {
    expect(detectDeviceCategory(null)).toBeNull();
  });

  it("detects mobile", () => {
    expect(
      detectDeviceCategory(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
    ).toBe("mobile");
    expect(
      detectDeviceCategory(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile",
      ),
    ).toBe("mobile");
  });

  it("detects tablet", () => {
    expect(
      detectDeviceCategory(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      ),
    ).toBe("tablet");
  });

  it("falls back to desktop", () => {
    expect(
      detectDeviceCategory(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      ),
    ).toBe("desktop");
  });
});
