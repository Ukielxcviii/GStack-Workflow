"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal";
import {
  buildPieceId,
  buildSlug,
  nextCandidate,
} from "@/lib/pieces/identifiers";
import type { Database } from "@/lib/supabase/database.types";
import { pieceSchema, type PieceInput } from "@/lib/validation/pieces";

type PieceRow = Database["public"]["Tables"]["pieces"]["Insert"];

export type PieceFormState =
  | { error: string; fieldErrors?: Record<string, string[] | undefined> }
  | undefined;

/** Bounded so a persistent collision surfaces an error instead of looping. */
const MAX_IDENTIFIER_ATTEMPTS = 5;

function parsePieceForm(formData: FormData) {
  // A disabled input (the frozen slug field, once published) is omitted from
  // FormData entirely — .get() returns null, not "". Normalize to "" so the
  // optional-field schema treats "disabled" the same as "left blank".
  const value = (key: string) => formData.get(key) ?? "";

  return pieceSchema.safeParse({
    name: value("name"),
    collection_id: value("collection_id"),
    product_tier: value("product_tier"),
    edition_number: value("edition_number"),
    edition_total: value("edition_total"),
    slug: value("slug"),
    base_hat_brand: value("base_hat_brand"),
    base_hat_model: value("base_hat_model"),
    team: value("team"),
    hat_size: value("hat_size"),
    primary_color: value("primary_color"),
    materials: value("materials"),
    craft_technique: value("craft_technique"),
    pearl_count: value("pearl_count"),
    crystal_count: value("crystal_count"),
    build_time_minutes: value("build_time_minutes"),
    completion_date: value("completion_date"),
    public_description: value("public_description"),
    care_instructions: value("care_instructions"),
    main_image_url: value("main_image_url"),
    authenticity_status: value("authenticity_status"),
    piece_status: value("piece_status"),
    nfc_status: value("nfc_status"),
    nfc_last_tested_at: value("nfc_last_tested_at"),
    internal_notes: value("internal_notes"),
  });
}

function toNullable(value: string | undefined | null) {
  return value && value.length > 0 ? value : null;
}

function toRow(data: PieceInput): Omit<PieceRow, "piece_id" | "slug"> {
  return {
    name: data.name,
    collection_id: data.collection_id,
    product_tier: data.product_tier,
    edition_number: data.edition_number,
    edition_total: data.edition_total,
    base_hat_brand: toNullable(data.base_hat_brand),
    base_hat_model: toNullable(data.base_hat_model),
    team: toNullable(data.team),
    hat_size: toNullable(data.hat_size),
    primary_color: toNullable(data.primary_color),
    materials: toNullable(data.materials),
    craft_technique: toNullable(data.craft_technique),
    pearl_count: data.pearl_count ?? null,
    crystal_count: data.crystal_count ?? null,
    build_time_minutes: data.build_time_minutes ?? null,
    completion_date: toNullable(data.completion_date),
    public_description: toNullable(data.public_description),
    care_instructions: toNullable(data.care_instructions),
    main_image_url: toNullable(data.main_image_url),
    authenticity_status: data.authenticity_status,
    piece_status: data.piece_status,
    nfc_status: data.nfc_status,
    nfc_last_tested_at: toNullable(data.nfc_last_tested_at),
    internal_notes: toNullable(data.internal_notes),
  };
}

/**
 * Constraint names verified against the live database rather than assumed —
 * see the Phase 5 plan. A (collection_id, edition_number) clash is a real user
 * error, not something to retry around.
 */
function classifyUniqueViolation(message: string) {
  if (message.includes("pieces_piece_id_key")) return "piece_id" as const;
  if (message.includes("pieces_slug_key")) return "slug" as const;
  if (message.includes("pieces_collection_id_edition_number_key")) {
    return "edition" as const;
  }
  return null;
}

const EDITION_TAKEN: PieceFormState = {
  error: "That edition number is already used in this collection.",
  fieldErrors: {
    edition_number: ["This edition number is already used in this collection."],
  },
};

export async function createPiece(
  _prevState: PieceFormState,
  formData: FormData,
): Promise<PieceFormState> {
  const { supabase } = await requireAdmin();

  const parsed = parsePieceForm(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { data } = parsed;

  const { data: collection } = await supabase
    .from("collections")
    .select("slug, collection_code")
    .eq("id", data.collection_id)
    .single();

  if (!collection) {
    return {
      error: "That collection no longer exists.",
      fieldErrors: { collection_id: ["Select an existing collection."] },
    };
  }

  const row = toRow(data);
  let pieceId = buildPieceId({
    collectionCode: collection.collection_code,
    editionNumber: data.edition_number,
    year: new Date().getFullYear(),
  });
  // An admin-supplied slug wins over the generated one, per §8.5.
  let slug =
    toNullable(data.slug) ??
    buildSlug({
      collectionSlug: collection.slug,
      editionNumber: data.edition_number,
    });

  // Generate → insert → on unique violation, retry with the next candidate
  // (the locked engineering decision), bounded.
  for (let attempt = 0; attempt < MAX_IDENTIFIER_ATTEMPTS; attempt++) {
    const { error } = await supabase
      .from("pieces")
      .insert({ ...row, piece_id: pieceId, slug });

    if (!error) {
      revalidatePath("/admin/pieces");
      redirect("/admin/pieces");
    }

    if (error.code !== "23505") {
      return { error: "Something went wrong creating the piece." };
    }

    const conflict = classifyUniqueViolation(error.message);
    if (conflict === "edition") return EDITION_TAKEN;
    if (conflict === "piece_id") pieceId = nextCandidate(pieceId);
    else if (conflict === "slug") slug = nextCandidate(slug);
    else return { error: "Something went wrong creating the piece." };
  }

  return {
    error:
      "Could not generate a unique piece ID and slug. Try a different edition number.",
  };
}

export async function updatePiece(
  id: string,
  _prevState: PieceFormState,
  formData: FormData,
): Promise<PieceFormState> {
  const { supabase } = await requireAdmin();

  const parsed = parsePieceForm(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { data } = parsed;

  const { data: existing } = await supabase
    .from("pieces")
    .select("slug, first_published_at")
    .eq("id", id)
    .single();

  if (!existing) return { error: "That piece no longer exists." };

  const requestedSlug = toNullable(data.slug);

  // §8.5: once published, the slug is frozen — NFC tags in the physical world
  // already point at it, and v1 has no redirect table. Enforced here, not just
  // by disabling the input.
  if (existing.first_published_at) {
    if (requestedSlug && requestedSlug !== existing.slug) {
      return {
        error:
          "This piece has been published, so its URL can no longer change.",
        fieldErrors: {
          slug: ["Published pieces keep their original URL."],
        },
      };
    }
  }

  const row = {
    ...toRow(data),
    ...(!existing.first_published_at && requestedSlug
      ? { slug: requestedSlug }
      : {}),
  };

  const { error } = await supabase.from("pieces").update(row).eq("id", id);

  if (error) {
    if (error.code === "23505") {
      const conflict = classifyUniqueViolation(error.message);
      if (conflict === "edition") return EDITION_TAKEN;
      if (conflict === "slug") {
        return {
          error: "That URL is already in use.",
          fieldErrors: { slug: ["This URL is already in use."] },
        };
      }
    }
    return { error: "Something went wrong updating the piece." };
  }

  revalidatePath("/admin/pieces");
  revalidatePath(`/admin/pieces/${id}`);
  redirect(`/admin/pieces/${id}`);
}

export async function publishPiece(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const { data: existing } = await supabase
    .from("pieces")
    .select("first_published_at")
    .eq("id", id)
    .single();

  await supabase
    .from("pieces")
    .update({
      publication_status: "published",
      // Set once, on first publication — it's what freezes the slug.
      first_published_at:
        existing?.first_published_at ?? new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/pieces");
  revalidatePath(`/admin/pieces/${id}`);
}

export async function unpublishPiece(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  // first_published_at deliberately survives: the piece has been public, so its
  // URL stays frozen even while unpublished.
  await supabase
    .from("pieces")
    .update({ publication_status: "draft" })
    .eq("id", id);

  revalidatePath("/admin/pieces");
  revalidatePath(`/admin/pieces/${id}`);
}

export async function archivePiece(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await supabase
    .from("pieces")
    .update({ publication_status: "archived", piece_status: "archived" })
    .eq("id", id);

  revalidatePath("/admin/pieces");
  revalidatePath(`/admin/pieces/${id}`);
}
