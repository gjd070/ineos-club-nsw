-- Ineos Club NSW — database setup
-- Run this in Supabase SQL Editor

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rego text,
  year integer,
  colour text,
  roof_colour text,
  created_at timestamptz default now()
);

create table gear_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order integer default 0
);

create table gear_options (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references gear_categories(id) on delete cascade,
  brand_model text not null,
  source text,
  created_at timestamptz default now(),
  unique(category_id, brand_model)
);

create table member_gear (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references members(id) on delete cascade,
  category_id uuid references gear_categories(id) on delete cascade,
  option_id uuid references gear_options(id) on delete set null,
  unique(member_id, category_id)
);

-- Enable RLS (public read/write — no personal data)
alter table members enable row level security;
alter table gear_categories enable row level security;
alter table gear_options enable row level security;
alter table member_gear enable row level security;

create policy "public access" on members for all using (true) with check (true);
create policy "public access" on gear_categories for all using (true) with check (true);
create policy "public access" on gear_options for all using (true) with check (true);
create policy "public access" on member_gear for all using (true) with check (true);

-- Seed gear categories from the NSW Ineos Gear Guide
insert into gear_categories (name, display_order) values
  ('Raised Air Intake', 1),
  ('Bull Bar', 2),
  ('Brush Bars', 3),
  ('Side Steps', 4),
  ('Roof Rack', 5),
  ('Starlink', 6),
  ('Rear Door Table', 7),
  ('Seat Covers', 8),
  ('UHF Radio', 9),
  ('UHF Aerial', 10),
  ('Dashcam', 11),
  ('Camp Battery', 12),
  ('Solar', 13),
  ('Rear Windows', 14),
  ('Camp Lights', 15),
  ('Rear Shelf', 16),
  ('Rear Interior Sides', 17),
  ('Wrap / Protection Film', 18);
