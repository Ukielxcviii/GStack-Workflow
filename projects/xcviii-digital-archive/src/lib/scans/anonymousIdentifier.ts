import { createHash } from "crypto";

/**
 * A privacy-safe, daily-rotating hash "for basic duplicate reduction" (PRD
 * §8.10) — never the raw IP itself. Lightweight, non-adversarial-strength:
 * appropriate for a v1 skeleton, not a hardened anti-spoofing system.
 */
export function buildAnonymousIdentifier({
  ip,
  userAgent,
  pieceId,
  date,
}: {
  ip: string | null;
  userAgent: string | null;
  pieceId: string;
  /** UTC date string, e.g. "2026-07-29" — rotates the hash daily. */
  date: string;
}): string {
  const hash = createHash("sha256");
  hash.update(`${ip ?? ""}|${userAgent ?? ""}|${pieceId}|${date}`);
  return hash.digest("hex").slice(0, 16);
}
