import { z } from "zod";

// Unlike every other file in src/lib/validation/, this validates an API
// request body (POST /api/scan), not a table row.
export const scanRequestSchema = z.object({
  slug: z.string().trim().min(1),
  // document.referrer, sent by the client — see ScanBeacon.tsx. Client-
  // reported like any analytics beacon's referrer; only ever stored and
  // displayed as opaque text, never used in a security decision.
  referrer: z.string().trim().max(2048).optional(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;
