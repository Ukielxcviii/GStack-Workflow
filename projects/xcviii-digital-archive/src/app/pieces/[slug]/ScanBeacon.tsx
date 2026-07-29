"use client";

import { useEffect } from "react";

/** Fire-and-forget: never blocks or affects the page's own render. */
export function ScanBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    // document.referrer is where the visitor navigated from before this page
    // load — the request's own Referer header would just be this same page's
    // URL, since the fetch originates from it.
    fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, referrer: document.referrer || undefined }),
    }).catch(() => {});
  }, [slug]);

  return null;
}
