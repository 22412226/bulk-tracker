-- ========================================================
-- Lean Bulking & Macro Tracker: Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com)
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. User Settings & Bulking Goals
create table if not exists user_settings (
  id text primary key default 'default_user',
  weight_kg numeric not null default 63.2,
  goal_weight_kg numeric not null default 70.0,
  height_cm numeric not null default 180.0,
  age integer not null default 21,
  gender text not null default 'Male',
  activity_level text not null default 'Moderate (4x/week strength training)',
  surplus_kcal integer not null default 350,
  use_manual_targets boolean not null default true,
  target_calories numeric not null default 2900.0,
  target_protein numeric not null default 120.0,
  target_carbs numeric not null default 380.0,
  target_fat numeric not null default 80.0,
  baseline_weight_kg numeric not null default 63.2,
  last_notified_weight_increase numeric not null default 63.2,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Food Library & Staple Presets
create table if not exists food_library (
  id text primary key,
  name text not null,
  unit_type text not null check (unit_type in ('100g', 'serving')),
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  serving_desc text default '',
  is_staple boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Daily Meal Entries
create table if not exists daily_logs (
  id text primary key,
  date text not null, -- YYYY-MM-DD
  meal_type text not null check (meal_type in ('Breakfast', 'Lunch', 'Dinner', 'Snacks/Shakes')),
  name text not null,
  quantity numeric not null,
  unit_label text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  food_id text references food_library(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Daily Body Weight Records
create table if not exists weight_history (
  date text primary key, -- YYYY-MM-DD
  weight_kg numeric not null,
  note text default '',
  logged_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Workout Day Records (GZCLP Gym Day vs Rest Day)
create table if not exists day_modes (
  date text primary key, -- YYYY-MM-DD
  is_gym_day boolean not null default false,
  notes text default ''
);

-- Enable Row Level Security (RLS) - open for anon if personal single-user app
alter table user_settings enable row level security;
alter table food_library enable row level security;
alter table daily_logs enable row level security;
alter table weight_history enable row level security;
alter table day_modes enable row level security;

create policy "Allow all operations for anon" on user_settings for all using (true) with check (true);
create policy "Allow all operations for anon" on food_library for all using (true) with check (true);
create policy "Allow all operations for anon" on daily_logs for all using (true) with check (true);
create policy "Allow all operations for anon" on weight_history for all using (true) with check (true);
create policy "Allow all operations for anon" on day_modes for all using (true) with check (true);
