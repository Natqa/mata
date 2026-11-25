-- Mata: dobór treningu jogi do nastroju
-- Wklej całość w Supabase → SQL Editor → New query → Run.
-- Można uruchomić ponownie.

-- ------------------------------------------------------------------ videos --
-- Biblioteka filmów z kanału YouTube. Wspólna dla wszystkich zalogowanych.
-- Zapisuje ją tylko Edge Function "yoga-ai" (klucz service role).
create table if not exists public.videos (
  id              text primary key,              -- YouTube video id
  channel_id      text not null,
  channel_title   text,
  title           text not null,
  description     text,
  duration_sec    integer,
  thumbnail_url   text,
  published_at    timestamptz,
  synced_at       timestamptz not null default now()
);

create index if not exists videos_channel_idx on public.videos (channel_id);

alter table public.videos enable row level security;

drop policy if exists "videos_read_signed_in" on public.videos;
create policy "videos_read_signed_in" on public.videos
  for select to authenticated using (true);

-- ---------------------------------------------------------------- sessions --
-- Każda prośba o dobór treningu: nastrój, polecony film i uzasadnienie AI.
-- Każda osoba widzi i zmienia tylko swoje wpisy.
create table if not exists public.sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mood          text not null check (char_length(mood) between 1 and 1000),
  max_minutes   integer check (max_minutes > 0),
  video_id      text references public.videos (id) on delete set null,
  reason        text,
  alternatives  jsonb not null default '[]'::jsonb,  -- [{ video_id, reason }]
  model         text,
  done_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists sessions_user_created_idx on public.sessions (user_id, created_at desc);

alter table public.sessions enable row level security;

drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own" on public.sessions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own" on public.sessions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own" on public.sessions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own" on public.sessions
  for delete to authenticated using (user_id = auth.uid());
