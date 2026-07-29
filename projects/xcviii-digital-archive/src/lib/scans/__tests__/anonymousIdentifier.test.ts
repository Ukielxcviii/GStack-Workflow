import { describe, expect, it } from "vitest";

import { buildAnonymousIdentifier } from "@/lib/scans/anonymousIdentifier";

const base = {
  ip: "203.0.113.1",
  userAgent: "test-agent",
  pieceId: "piece-1",
  date: "2026-07-29",
};

describe("buildAnonymousIdentifier", () => {
  it("is deterministic for the same inputs", () => {
    expect(buildAnonymousIdentifier(base)).toBe(buildAnonymousIdentifier(base));
  });

  it("changes when the date changes", () => {
    expect(buildAnonymousIdentifier(base)).not.toBe(
      buildAnonymousIdentifier({ ...base, date: "2026-07-30" }),
    );
  });

  it("changes when the ip changes", () => {
    expect(buildAnonymousIdentifier(base)).not.toBe(
      buildAnonymousIdentifier({ ...base, ip: "203.0.113.2" }),
    );
  });

  it("changes when the user agent changes", () => {
    expect(buildAnonymousIdentifier(base)).not.toBe(
      buildAnonymousIdentifier({ ...base, userAgent: "other-agent" }),
    );
  });

  it("changes when the piece id changes", () => {
    expect(buildAnonymousIdentifier(base)).not.toBe(
      buildAnonymousIdentifier({ ...base, pieceId: "piece-2" }),
    );
  });

  it("handles a null ip and user agent without throwing", () => {
    expect(() =>
      buildAnonymousIdentifier({ ...base, ip: null, userAgent: null }),
    ).not.toThrow();
  });

  it("returns a 16-character hex string", () => {
    expect(buildAnonymousIdentifier(base)).toMatch(/^[0-9a-f]{16}$/);
  });
});
