-- Phase 2: Row Level Security (PRD §10).
--
-- One is_admin() SECURITY DEFINER function, reused by every table's policy
-- (locked engineering decision) — avoids both duplicating the same EXISTS
-- subquery on every table and the recursive-policy footgun: SECURITY DEFINER
-- makes this function bypass RLS internally, so it never re-triggers the very
-- policies it's used to gate.
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.pieces enable row level security;
alter table public.scan_events enable row level security;

-- profiles: admin-only. No public access to administrator profile data.
create policy "admins manage profiles"
  on public.profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- collections: public may read published; admins may do everything.
-- Multiple permissive policies on the same table are OR-combined by Postgres,
-- so these two policies compose without conflict.
create policy "public reads published collections"
  on public.collections
  for select
  using (status = 'published');

create policy "admins manage collections"
  on public.collections
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- pieces: public may read published; admins may do everything.
create policy "public reads published pieces"
  on public.pieces
  for select
  using (publication_status = 'published');

create policy "admins manage pieces"
  on public.pieces
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- scan_events: public may only insert (no read at all); admins may do
-- everything, including reading for analytics. Abuse mitigation (rate
-- limiting/dedup) is enforced by the Phase 8 server endpoint, not here.
create policy "public inserts scan events"
  on public.scan_events
  for insert
  with check (true);

create policy "admins manage scan events"
  on public.scan_events
  for all
  using (public.is_admin())
  with check (public.is_admin());
