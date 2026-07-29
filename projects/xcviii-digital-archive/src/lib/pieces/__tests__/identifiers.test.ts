import { describe, expect, it } from "vitest";

import {
  buildPieceId,
  buildSlug,
  nextCandidate,
  padEdition,
} from "@/lib/pieces/identifiers";

describe("padEdition", () => {
  it("pads to three digits", () => {
    expect(padEdition(1)).toBe("001");
    expect(padEdition(25)).toBe("025");
    expect(padEdition(999)).toBe("999");
  });

  it("does not truncate editions beyond three digits", () => {
    expect(padEdition(1000)).toBe("1000");
  });
});

describe("buildPieceId", () => {
  it("matches the PRD's seed-data example", () => {
    expect(
      buildPieceId({ collectionCode: "FL", editionNumber: 1, year: 2026 }),
    ).toBe("XCVIII-FL-2026-001");
  });

  it("uppercases the collection code", () => {
    expect(
      buildPieceId({ collectionCode: "ph", editionNumber: 12, year: 2026 }),
    ).toBe("XCVIII-PH-2026-012");
  });
});

describe("buildSlug", () => {
  it("matches the PRD's seed-data example", () => {
    expect(buildSlug({ collectionSlug: "first-light", editionNumber: 1 })).toBe(
      "first-light-001",
    );
  });

  it("handles multi-word collection slugs", () => {
    expect(
      buildSlug({ collectionSlug: "midnight-bloom", editionNumber: 12 }),
    ).toBe("midnight-bloom-012");
  });
});

describe("nextCandidate", () => {
  it("appends -2 on the first collision", () => {
    expect(nextCandidate("first-light-001")).toBe("first-light-001-2");
  });

  it("increments an existing retry suffix", () => {
    expect(nextCandidate("first-light-001-2")).toBe("first-light-001-3");
    expect(nextCandidate("first-light-001-9")).toBe("first-light-001-10");
  });

  it("does not mistake a padded edition number for a retry suffix", () => {
    // "-001" is the identifier's own edition number, not a retry counter —
    // bumping it would silently point at a different edition.
    expect(nextCandidate("XCVIII-FL-2026-001")).toBe("XCVIII-FL-2026-001-2");
  });

  it("converges rather than repeating a candidate", () => {
    let candidate = "probe-001";
    const seen = new Set([candidate]);
    for (let i = 0; i < 5; i++) {
      candidate = nextCandidate(candidate);
      expect(seen.has(candidate)).toBe(false);
      seen.add(candidate);
    }
  });
});
