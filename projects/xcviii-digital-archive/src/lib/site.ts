import "server-only";

import { headers } from "next/headers";

/**
 * No NEXT_PUBLIC_SITE_URL env var exists (Phase 10 is the actual deploy
 * phase) — deriving the origin from the incoming request is correct in every
 * environment without a new required config value.
 */
export async function getSiteOrigin() {
  const headerList = await headers();
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("host");
  return `${protocol}://${host}`;
}

export async function getPublicPieceUrl(slug: string) {
  const origin = await getSiteOrigin();
  return `${origin}/pieces/${slug}`;
}
