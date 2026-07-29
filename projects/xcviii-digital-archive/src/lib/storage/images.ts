import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import { validateImageFile } from "@/lib/validation/images";

/**
 * Upload/delete against the `images` bucket (Phase 9, PRD §14). Runs under
 * the caller's already-requireAdmin()-authenticated Supabase client — same as
 * every other write in src/lib/actions/ — so bucket RLS (admin-only writes,
 * supabase/migrations/20260729023804_image_storage.sql) is what actually
 * enforces authorization here, not this module. Unlike src/lib/data/*.ts,
 * this module takes an already-constructed SupabaseClient rather than
 * building one from next/headers itself, so it has no "server-only" tag and
 * its pure path-building functions are directly unit-testable.
 */

export const IMAGE_BUCKET = "images";

export function buildImagePath({
  prefix,
  extension,
}: {
  prefix: "pieces" | "collections";
  extension: string;
}) {
  return `${prefix}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Recovers the storage object path from a public URL previously returned by
 * uploadImage(), e.g. "https://<ref>.supabase.co/storage/v1/object/public/
 * images/pieces/<uuid>.jpg" -> "pieces/<uuid>.jpg". Returns null for any URL
 * that isn't one of ours (a hand-typed URL from before Phase 9, or an already
 * different bucket) — deleteImageByUrl treats that as nothing to clean up.
 */
export function extractImagePath(url: string): string | null {
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;

  const path = url.slice(index + marker.length);
  return path.length > 0 ? path : null;
}

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  {
    prefix,
    file,
    extension,
  }: { prefix: "pieces" | "collections"; file: File; extension: string },
): Promise<string> {
  const path = buildImagePath({ prefix, extension });

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}

/**
 * Best-effort: a failed delete (already gone, or a pre-Phase-9 URL that
 * isn't ours) must never block the piece/collection mutation that's
 * replacing or clearing the image.
 */
export async function deleteImageByUrl(
  supabase: SupabaseClient<Database>,
  url: string,
): Promise<void> {
  const path = extractImagePath(url);
  if (!path) return;

  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

export type ImageUpdate =
  | { ok: false; error: string }
  /**
   * `url: undefined` means "leave the column untouched"; `null` means
   * "clear it". `commit()` deletes whatever image the new state made
   * obsolete — the previous image on a replace/clear — and is a no-op on
   * "unchanged". It's meant to run only after the caller's own DB write
   * succeeds, so a failed mutation never orphans the still-referenced image.
   */
  | { ok: true; url: string | null | undefined; commit: () => Promise<void> };

/**
 * Shared by createPiece/updatePiece and createCollection/updateCollection:
 * given the file (if any) and remove-checkbox from the form, decides what
 * the image column should become. Uploading happens eagerly here (before the
 * caller's DB write) since a new file needs a live URL to store; deleting the
 * image it replaces is deferred to commit() so it only happens once the DB
 * write that references the new URL has actually succeeded.
 */
export async function resolveImageUpdate(
  supabase: SupabaseClient<Database>,
  {
    prefix,
    file,
    remove,
    currentUrl,
  }: {
    prefix: "pieces" | "collections";
    file: File | null;
    remove: boolean;
    currentUrl: string | null;
  },
): Promise<ImageUpdate> {
  if (file) {
    const validation = validateImageFile(file);
    if (!validation.success) return { ok: false, error: validation.error };

    const url = await uploadImage(supabase, {
      prefix,
      file,
      extension: validation.extension,
    });

    return {
      ok: true,
      url,
      commit: async () => {
        if (currentUrl) await deleteImageByUrl(supabase, currentUrl);
      },
    };
  }

  if (remove) {
    return {
      ok: true,
      url: null,
      commit: async () => {
        if (currentUrl) await deleteImageByUrl(supabase, currentUrl);
      },
    };
  }

  return { ok: true, url: undefined, commit: async () => {} };
}
