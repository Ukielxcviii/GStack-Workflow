-- Phase 2: core schema (PRD §9). slug_redirects (§9.5) is skipped per the PRD's
-- own "optional for version one" note — published slugs become immutable at the
-- application layer instead (Phase 5), which is the fallback the PRD itself names.

create extension if not exists "pgcrypto";

-- Shared trigger: keep updated_at current on every row update.
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 9.1 Users — Supabase Auth owns identity; this is the app-facing profile/role.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- 9.2 Collections
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  collection_code text not null unique,
  short_description text,
  story text,
  release_date date,
  cover_image_url text,
  planned_piece_total integer check (planned_piece_total >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_collections_updated_at
  before update on public.collections
  for each row
  execute function public.set_updated_at();

-- 9.3 Pieces
create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  piece_id text not null unique,
  name text not null,
  slug text not null unique,
  collection_id uuid not null references public.collections (id),
  product_tier text not null
    check (product_tier in ('pearl_halo', 'rhinestone_halo', 'constellation', 'other')),
  edition_number integer not null check (edition_number > 0),
  edition_total integer not null check (edition_total > 0),
  base_hat_brand text,
  base_hat_model text,
  team text,
  hat_size text,
  primary_color text,
  materials text,
  craft_technique text,
  pearl_count integer check (pearl_count >= 0),
  crystal_count integer check (crystal_count >= 0),
  build_time_minutes integer check (build_time_minutes >= 0),
  completion_date date,
  public_description text,
  care_instructions text,
  main_image_url text,
  authenticity_status text not null default 'authentic'
    check (authenticity_status in ('authentic', 'pending_verification', 'revoked')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published', 'archived')),
  piece_status text not null default 'in_production'
    check (piece_status in ('in_production', 'available', 'collected', 'reserved', 'archived')),
  nfc_status text not null default 'not_assigned'
    check (nfc_status in ('not_assigned', 'ready_to_program', 'programmed', 'tested', 'replaced')),
  nfc_last_tested_at timestamptz,
  first_published_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, edition_number)
);

create index pieces_collection_id_idx on public.pieces (collection_id);

create trigger set_pieces_updated_at
  before update on public.pieces
  for each row
  execute function public.set_updated_at();

-- 9.4 Scan events — append-only log, no updated_at.
create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.pieces (id),
  scanned_at timestamptz not null default now(),
  referrer text,
  user_agent text,
  device_category text,
  country_code text,
  anonymous_identifier text
);

-- Backs the Phase 8 admin "total scans" aggregate (single GROUP BY piece_id
-- query, per the locked engineering decision — not N+1 per-row queries).
create index scan_events_piece_id_idx on public.scan_events (piece_id);
