/**
 * Permanent piece identifiers (PRD §8.4, §8.5). Pure functions so the format
 * rules are unit-testable without a database.
 *
 * Piece ID: XCVIII-{COLLECTION CODE}-{YEAR}-{NUMBER}  e.g. XCVIII-FL-2026-001
 * Slug:     {collection-slug}-{NUMBER}                e.g. first-light-001
 *
 * Both derive from the collection plus the edition number, matching the PRD's
 * seed data. YEAR is the year the record is created — the PRD doesn't specify
 * which year it means; see the README for that decision.
 */

const PIECE_ID_PREFIX = "XCVIII";

export function padEdition(editionNumber: number) {
  return String(editionNumber).padStart(3, "0");
}

export function buildPieceId({
  collectionCode,
  editionNumber,
  year,
}: {
  collectionCode: string;
  editionNumber: number;
  year: number;
}) {
  return [
    PIECE_ID_PREFIX,
    collectionCode.toUpperCase(),
    year,
    padEdition(editionNumber),
  ].join("-");
}

export function buildSlug({
  collectionSlug,
  editionNumber,
}: {
  collectionSlug: string;
  editionNumber: number;
}) {
  return `${collectionSlug.toLowerCase()}-${padEdition(editionNumber)}`;
}

/**
 * Next candidate after a unique-constraint collision. Appends `-2`, then
 * increments that suffix on subsequent collisions, so retries always converge
 * instead of re-proposing the same value.
 *
 * A collision is possible even though generation is deterministic: an admin may
 * hand-edit a slug before publication (§8.5) onto a value a later piece would
 * generate on its own.
 */
export function nextCandidate(candidate: string) {
  const match = candidate.match(/^(.*)-(\d+)$/);

  // No retry suffix yet — but don't mistake the identifier's own trailing
  // edition number (e.g. "first-light-001") for one. Those are zero-padded to
  // three digits; retry suffixes are not.
  if (!match || /^\d{3}$/.test(match[2])) {
    return `${candidate}-2`;
  }

  return `${match[1]}-${Number(match[2]) + 1}`;
}
