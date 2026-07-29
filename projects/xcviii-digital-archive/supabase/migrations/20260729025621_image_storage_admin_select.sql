-- Fixes 20260729023804_image_storage.sql: that migration's comment claimed no
-- SELECT policy was needed because public reads go through the
-- /storage/v1/object/public/... endpoint, which does bypass RLS — that part's
-- true. What it missed: an *authenticated* client's list()/remove() calls
-- (used by src/lib/storage/images.ts's deleteImageByUrl(), and by admins
-- managing the bucket generally) go through the regular Storage API, which
-- filters storage.objects by RLS same as any other table. With no SELECT
-- policy, admins saw zero rows for their own uploads — list() returned an
-- empty array and remove() silently no-opped (no error, nothing deleted).
-- Confirmed live: manual verification of the piece-image "replace" flow left
-- the old object still fetchable from its public URL after a successful
-- update, because the old-image cleanup's remove() call had nothing to act
-- on to delete.
create policy "admins list images"
  on storage.objects
  for select
  using (bucket_id = 'images' and public.is_admin());
