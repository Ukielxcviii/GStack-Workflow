import { z } from "zod";

// Enum values from PRD §8.3 and §8.9; they mirror the CHECK constraints in
// supabase/migrations/20260728225716_initial_schema.sql.
export const PRODUCT_TIERS = [
  "pearl_halo",
  "rhinestone_halo",
  "constellation",
  "other",
] as const;

export const AUTHENTICITY_STATUSES = [
  "authentic",
  "pending_verification",
  "revoked",
] as const;

export const PUBLICATION_STATUSES = ["draft", "published", "archived"] as const;

export const PIECE_STATUSES = [
  "in_production",
  "available",
  "collected",
  "reserved",
  "archived",
] as const;

export const NFC_STATUSES = [
  "not_assigned",
  "ready_to_program",
  "programmed",
  "tested",
  "replaced",
] as const;

/** Blank form inputs arrive as "" — treat those as "not provided". */
const optionalText = z.string().trim().optional().or(z.literal(""));

const optionalNonNegativeInt = (label: string) =>
  z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.coerce
      .number()
      .int()
      .nonnegative(`${label} cannot be negative`)
      .optional(),
  );

export const pieceSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    collection_id: z.uuid("Select a collection"),
    product_tier: z.enum(PRODUCT_TIERS),
    edition_number: z.coerce
      .number()
      .int()
      .positive("Edition number must be greater than zero"),
    edition_total: z.coerce
      .number()
      .int()
      .positive("Edition total must be greater than zero"),

    // Auto-generated on create; editable only before first publication (§8.5),
    // which the update action enforces.
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Slug must be lowercase letters, numbers, and hyphens only",
      )
      .optional()
      .or(z.literal("")),

    base_hat_brand: optionalText,
    base_hat_model: optionalText,
    team: optionalText,
    hat_size: optionalText,
    primary_color: optionalText,
    materials: optionalText,
    craft_technique: optionalText,

    pearl_count: optionalNonNegativeInt("Pearl count"),
    crystal_count: optionalNonNegativeInt("Crystal count"),
    build_time_minutes: optionalNonNegativeInt("Build time"),

    completion_date: optionalText,
    public_description: optionalText,
    care_instructions: optionalText,
    // main_image_url is no longer a text field — it's derived from
    // main_image_file/remove_main_image in src/lib/actions/pieces.ts and
    // uploaded through src/lib/storage/images.ts (Phase 9, PRD §14).

    authenticity_status: z.enum(AUTHENTICITY_STATUSES),
    piece_status: z.enum(PIECE_STATUSES),
    nfc_status: z.enum(NFC_STATUSES),
    nfc_last_tested_at: optionalText,

    internal_notes: optionalText,
  })
  // PRD §8.11. Backed by the DB constraint
  // pieces_edition_number_within_total (migration 20260728235134) so a direct
  // write can't bypass it either.
  .refine((data) => data.edition_number <= data.edition_total, {
    message: "Edition number cannot exceed the edition total",
    path: ["edition_number"],
  });

export type PieceInput = z.infer<typeof pieceSchema>;
