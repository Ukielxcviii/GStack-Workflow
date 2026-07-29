/**
 * Image upload validation (PRD §14 "validate allowed image formats, limit
 * file size"). A plain function rather than a Zod field on pieceSchema/
 * collectionSchema: those schemas are built from string FormData.get()
 * values (see parsePieceForm/parseCollectionForm), and a File doesn't fit
 * that shape. Mirrors the storage bucket's own file_size_limit/
 * allowed_mime_types (supabase/migrations/20260729023804_image_storage.sql)
 * so a rejected upload gets a clear form error instead of a raw storage-API
 * failure.
 */

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MiB

const EXTENSIONS_BY_TYPE: Record<(typeof ALLOWED_IMAGE_TYPES)[number], string> =
  {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

export type ImageValidationResult =
  { success: true; extension: string } | { success: false; error: string };

export function validateImageFile(file: File): ImageValidationResult {
  const type = file.type as (typeof ALLOWED_IMAGE_TYPES)[number];

  if (!ALLOWED_IMAGE_TYPES.includes(type)) {
    return {
      success: false,
      error: "Image must be a JPEG, PNG, or WebP file.",
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: "Image must be 5 MB or smaller." };
  }

  return { success: true, extension: EXTENSIONS_BY_TYPE[type] };
}
