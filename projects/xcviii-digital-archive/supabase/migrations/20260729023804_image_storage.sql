-- Phase 9: Images (PRD §14).
--
-- One public bucket for both piece main images and collection cover images,
-- distinguished only by object path prefix ("pieces/<uuid>.<ext>" /
-- "collections/<uuid>.<ext>") rather than two separate buckets — they need
-- identical policies, so a second bucket would just duplicate this file.
--
-- `public = true` means reads go through the unauthenticated
-- /storage/v1/object/public/images/... endpoint, which bypasses RLS entirely
-- (it only checks bucket.public) — matching the "public may read published
-- records" model already used for collections/pieces, so no SELECT policy is
-- needed here. Writes still go through the authenticated API and are gated
-- below by the same public.is_admin() every other table's policy uses.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880, -- 5 MiB; also enforced in src/lib/validation/images.ts
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "admins upload images"
  on storage.objects
  for insert
  with check (bucket_id = 'images' and public.is_admin());

create policy "admins update images"
  on storage.objects
  for update
  using (bucket_id = 'images' and public.is_admin())
  with check (bucket_id = 'images' and public.is_admin());

create policy "admins delete images"
  on storage.objects
  for delete
  using (bucket_id = 'images' and public.is_admin());
