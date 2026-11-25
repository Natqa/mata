-- Mata: oceny treningów
-- Wklej całość w Supabase → SQL Editor → New query → Run.
-- Można uruchomić ponownie.

alter table public.sessions
  add column if not exists rating      smallint check (rating between 1 and 5),
  add column if not exists rating_note text check (char_length(rating_note) <= 500),
  add column if not exists rated_at    timestamptz,
  -- Film, który faktycznie oceniono: główny wybór AI albo jedna z alternatyw.
  add column if not exists rated_video_id text references public.videos (id) on delete set null;

-- Polityka "sessions_update_own" z 001_init.sql już pozwala zmieniać własne wiersze,
-- więc ocenę może zapisać tylko osoba, do której należy trening.
