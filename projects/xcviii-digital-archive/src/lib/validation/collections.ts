import { z } from "zod";

// Matches the DB constraints in
// supabase/migrations/20260728225716_initial_schema.sql.
export const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    ),
  collection_code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Collection code must be letters and numbers only"),
  short_description: z.string().trim().optional().or(z.literal("")),
  story: z.string().trim().optional().or(z.literal("")),
  release_date: z.string().trim().optional().or(z.literal("")),
  // cover_image_url is no longer a text field — it's derived from
  // cover_image_file/remove_cover_image in src/lib/actions/collections.ts
  // (Phase 9, PRD §14).
  planned_piece_total: z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce.number().int().nonnegative("Must be zero or greater").optional(),
  ),
  internal_notes: z.string().trim().optional().or(z.literal("")),
});

export type CollectionInput = z.infer<typeof collectionSchema>;
