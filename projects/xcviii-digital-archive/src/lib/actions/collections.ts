"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/dal";
import { collectionSchema } from "@/lib/validation/collections";

export type CollectionFormState =
  | { error: string; fieldErrors?: Record<string, string[] | undefined> }
  | undefined;

function parseCollectionForm(formData: FormData) {
  return collectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    collection_code: formData.get("collection_code"),
    short_description: formData.get("short_description"),
    story: formData.get("story"),
    release_date: formData.get("release_date"),
    cover_image_url: formData.get("cover_image_url"),
    planned_piece_total: formData.get("planned_piece_total"),
    internal_notes: formData.get("internal_notes"),
  });
}

function toNullable(value: string | undefined | null) {
  return value && value.length > 0 ? value : null;
}

/** Maps a unique-violation's constraint name to the form field it belongs to. */
function uniqueViolationField(
  message: string,
): "slug" | "collection_code" | null {
  if (message.includes("collections_slug_key")) return "slug";
  if (message.includes("collections_collection_code_key"))
    return "collection_code";
  return null;
}

export async function createCollection(
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const { supabase } = await requireAdmin();

  const parsed = parseCollectionForm(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data } = parsed;
  const { error } = await supabase.from("collections").insert({
    name: data.name,
    slug: data.slug,
    collection_code: data.collection_code,
    short_description: toNullable(data.short_description),
    story: toNullable(data.story),
    release_date: toNullable(data.release_date),
    cover_image_url: toNullable(data.cover_image_url),
    planned_piece_total: data.planned_piece_total ?? null,
    internal_notes: toNullable(data.internal_notes),
  });

  if (error) {
    const field =
      error.code === "23505" ? uniqueViolationField(error.message) : null;
    if (field) {
      const label = field === "slug" ? "slug" : "collection code";
      return {
        error: `That ${label} is already in use.`,
        fieldErrors: { [field]: [`This ${label} is already in use.`] },
      };
    }
    return { error: "Something went wrong creating the collection." };
  }

  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function updateCollection(
  id: string,
  _prevState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const { supabase } = await requireAdmin();

  const parsed = parseCollectionForm(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data } = parsed;
  const { error } = await supabase
    .from("collections")
    .update({
      name: data.name,
      slug: data.slug,
      collection_code: data.collection_code,
      short_description: toNullable(data.short_description),
      story: toNullable(data.story),
      release_date: toNullable(data.release_date),
      cover_image_url: toNullable(data.cover_image_url),
      planned_piece_total: data.planned_piece_total ?? null,
      internal_notes: toNullable(data.internal_notes),
    })
    .eq("id", id);

  if (error) {
    const field =
      error.code === "23505" ? uniqueViolationField(error.message) : null;
    if (field) {
      const label = field === "slug" ? "slug" : "collection code";
      return {
        error: `That ${label} is already in use.`,
        fieldErrors: { [field]: [`This ${label} is already in use.`] },
      };
    }
    return { error: "Something went wrong updating the collection." };
  }

  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function publishCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await supabase
    .from("collections")
    .update({ status: "published" })
    .eq("id", id);
  revalidatePath("/admin/collections");
}

export async function unpublishCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await supabase.from("collections").update({ status: "draft" }).eq("id", id);
  revalidatePath("/admin/collections");
}

async function getActivePieceCount(collectionId: string) {
  const { supabase } = await requireAdmin();
  const { count } = await supabase
    .from("pieces")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId)
    .neq("piece_status", "archived");
  return count ?? 0;
}

export type ArchiveResult =
  | { status: "archived" }
  | { status: "requires_confirmation"; activePieceCount: number }
  | { status: "error"; error: string };

/**
 * PRD §8.2: "A collection cannot be archived without warning the
 * administrator if active pieces are attached." Re-checked here (not just in
 * the UI) so a raw call can't skip the warning.
 */
export async function archiveCollection(
  collectionId: string,
  confirmed: boolean,
): Promise<ArchiveResult> {
  const { supabase } = await requireAdmin();

  if (!confirmed) {
    const activePieceCount = await getActivePieceCount(collectionId);
    if (activePieceCount > 0) {
      return { status: "requires_confirmation", activePieceCount };
    }
  }

  const { error } = await supabase
    .from("collections")
    .update({ status: "archived" })
    .eq("id", collectionId);

  if (error) {
    return { status: "error", error: "Failed to archive collection." };
  }

  revalidatePath("/admin/collections");
  return { status: "archived" };
}
