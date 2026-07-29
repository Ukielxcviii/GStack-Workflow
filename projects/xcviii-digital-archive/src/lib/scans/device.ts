/** PRD §8.10 "device category, when reasonably detectable." Best-effort, not exhaustive. */
export function detectDeviceCategory(
  userAgent: string | null,
): "mobile" | "tablet" | "desktop" | null {
  if (!userAgent) return null;

  if (/ipad|tablet(?!.*mobile)/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile/i.test(userAgent)) return "mobile";
  return "desktop";
}
