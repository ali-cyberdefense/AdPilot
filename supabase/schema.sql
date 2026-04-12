-- AdPilot — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  target_acos decimal,
  created_at timestamp with time zone default now()
);

-- Upload sessions
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  target_acos decimal,
  upload_date timestamp with time zone default now(),
  date_range_start date,
  date_range_end date,
  str_rows int,
  placement_rows int,
  product_rows int
);

-- Search Term Report data
create table if not exists public.str_data (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads(id) on delete cascade not null,
  campaign_name text,
  ad_group_name text,
  targeting text,
  match_type text,
  search_term text,
  impressions int,
  clicks int,
  ctr decimal,
  cpc decimal,
  spend decimal,
  sales decimal,
  acos decimal,
  roas decimal,
  orders int,
  units int,
  cvr decimal,
  advertised_sku_units int,
  other_sku_units int,
  advertised_sku_sales decimal,
  other_sku_sales decimal,
  tactic text,
  match_type_parsed text,
  goal text,
  size text,
  tactic_label text
);

-- Placement Report data
create table if not exists public.placement_data (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads(id) on delete cascade not null,
  campaign_name text,
  bidding_strategy text,
  placement text,
  impressions int,
  clicks int,
  cpc decimal,
  spend decimal,
  sales decimal,
  acos decimal,
  roas decimal,
  orders int,
  units int
);

-- Advertised Products data
create table if not exists public.product_data (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads(id) on delete cascade not null,
  campaign_name text,
  ad_group_name text,
  advertised_sku text,
  advertised_asin text,
  impressions int,
  clicks int,
  ctr decimal,
  cpc decimal,
  spend decimal,
  sales decimal,
  acos decimal,
  roas decimal,
  orders int,
  units int,
  cvr decimal,
  advertised_sku_units int,
  other_sku_units int,
  advertised_sku_sales decimal,
  other_sku_sales decimal,
  tactic text,
  match_type_parsed text,
  goal text,
  size text,
  tactic_label text
);

-- Insights cache
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references public.uploads(id) on delete cascade not null,
  insight_type text,
  severity text,
  title text,
  description text,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.uploads enable row level security;
alter table public.str_data enable row level security;
alter table public.placement_data enable row level security;
alter table public.product_data enable row level security;
alter table public.insights enable row level security;

-- Users: can only see/edit own row
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Uploads: can only see/edit own uploads
create policy "uploads_own" on public.uploads
  for all using (auth.uid() = user_id);

-- STR data: scoped to own uploads
create policy "str_data_own" on public.str_data
  for all using (
    upload_id in (select id from public.uploads where user_id = auth.uid())
  );

-- Placement data: scoped to own uploads
create policy "placement_data_own" on public.placement_data
  for all using (
    upload_id in (select id from public.uploads where user_id = auth.uid())
  );

-- Product data: scoped to own uploads
create policy "product_data_own" on public.product_data
  for all using (
    upload_id in (select id from public.uploads where user_id = auth.uid())
  );

-- Insights: scoped to own uploads
create policy "insights_own" on public.insights
  for all using (
    upload_id in (select id from public.uploads where user_id = auth.uid())
  );
