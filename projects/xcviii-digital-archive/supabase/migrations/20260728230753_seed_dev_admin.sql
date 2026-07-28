-- Phase 2: seed a development administrator (PRD §20). Idempotent — safe to
-- re-run. Promotes the auth user matching this email (created via the
-- Supabase dashboard) to role = 'admin' in profiles.
insert into public.profiles (id, role)
select id, 'admin'
from auth.users
where email = 'ukielxcviii@gmail.com'
on conflict (id) do update set role = 'admin';
