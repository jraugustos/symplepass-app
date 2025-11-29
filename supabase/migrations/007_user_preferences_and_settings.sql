-- Migration 007: User preferences, settings, and sessions support
set check_function_bodies = off;

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  favorite_sports text[] not null default '{}',
  notification_events boolean not null default true,
  notification_promotions boolean not null default true,
  theme text not null default 'system',
  language text not null default 'pt-BR',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_preferences_user_id_key unique (user_id),
  constraint user_preferences_theme_check check (theme in ('light', 'dark', 'system'))
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_name text,
  ip_address text,
  user_agent text,
  last_active timestamptz not null default timezone('utc'::text, now()),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists user_preferences_user_id_idx on public.user_preferences (user_id);
create index if not exists user_sessions_user_id_idx on public.user_sessions (user_id);
create index if not exists user_sessions_last_active_idx on public.user_sessions (last_active desc);

alter table public.user_preferences enable row level security;
alter table public.user_sessions enable row level security;

create policy "Users can view their preferences"
  on public.user_preferences
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their preferences"
  on public.user_preferences
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their preferences"
  on public.user_preferences
  for update
  using (auth.uid() = user_id);

create policy "Users can view their sessions"
  on public.user_sessions
  for select
  using (auth.uid() = user_id);

create policy "Users can create their sessions"
  on public.user_sessions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their sessions"
  on public.user_sessions
  for delete
  using (auth.uid() = user_id);

create or replace function public.handle_user_preferences_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row
  execute function public.handle_user_preferences_updated_at();

create or replace function public.create_user_preferences_for_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_preferences_after_profile_insert on public.profiles;
create trigger create_preferences_after_profile_insert
  after insert on public.profiles
  for each row
  execute function public.create_user_preferences_for_profile();
