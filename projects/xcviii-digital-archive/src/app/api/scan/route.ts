import { buildAnonymousIdentifier } from "@/lib/scans/anonymousIdentifier";
import { detectDeviceCategory } from "@/lib/scans/device";
import { createClient } from "@/lib/supabase/server";
import { scanRequestSchema } from "@/lib/validation/scans";

/**
 * PRD §8.10 "Create secure scan endpoint." Always responds 204 regardless of
 * outcome (bad body, unknown/unpublished slug, DB error) — never signals slug
 * existence or leaks failure details via status code (§8.12). Errors are
 * logged server-side only. The public piece page must still load if this
 * fails (§16), which is true by construction: this route is never awaited by
 * page rendering (see ScanBeacon.tsx).
 */
export async function POST(request: Request) {
  const noContent = () => new Response(null, { status: 204 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return noContent();
  }

  const parsed = scanRequestSchema.safeParse(body);
  if (!parsed.success) {
    return noContent();
  }

  try {
    const supabase = await createClient();

    // Published-only, same as the public page itself — a scan against a
    // slug that isn't currently published (even one Phase 6's RLS carve-out
    // still lets the public page render as "unavailable") isn't "a visit to
    // the public piece page" in §8.10's sense.
    const { data: piece } = await supabase
      .from("pieces")
      .select("id")
      .eq("slug", parsed.data.slug)
      .eq("publication_status", "published")
      .maybeSingle();

    if (!piece) {
      return noContent();
    }

    const referrer = parsed.data.referrer ?? null;
    const userAgent = request.headers.get("user-agent");
    const countryCode = request.headers.get("x-vercel-ip-country");
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const date = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("scan_events").insert({
      piece_id: piece.id,
      referrer,
      user_agent: userAgent,
      device_category: detectDeviceCategory(userAgent),
      country_code: countryCode,
      anonymous_identifier: buildAnonymousIdentifier({
        ip,
        userAgent,
        pieceId: piece.id,
        date,
      }),
    });

    if (error) {
      console.error("Failed to record scan event:", error.message);
    }
  } catch (error) {
    console.error("Failed to record scan event:", error);
  }

  return noContent();
}
