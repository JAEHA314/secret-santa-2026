-- Run once in Supabase SQL Editor before testing party mode.
create table if not exists public.party_guesses (
  player_id text primary key references public.players(id) on delete cascade,
  guessed_giver_id text not null references public.players(id),
  confirmed_at timestamptz not null default now(),
  constraint party_guess_not_self check (player_id <> guessed_giver_id)
);

create table if not exists public.party_reveals (
  player_id text primary key references public.players(id) on delete cascade,
  revealed_at timestamptz not null default now()
);

alter table public.party_guesses enable row level security;
alter table public.party_reveals enable row level security;

drop policy if exists "party_guesses_select_anon" on public.party_guesses;
drop policy if exists "party_guesses_insert_anon" on public.party_guesses;
drop policy if exists "party_guesses_update_anon" on public.party_guesses;
create policy "party_guesses_select_anon" on public.party_guesses for select to anon using (true);
create policy "party_guesses_insert_anon" on public.party_guesses for insert to anon with check (true);
-- No UPDATE/DELETE policy: a confirmed guess is irreversible from the browser.

drop policy if exists "party_reveals_select_anon" on public.party_reveals;
drop policy if exists "party_reveals_insert_anon" on public.party_reveals;
create policy "party_reveals_select_anon" on public.party_reveals for select to anon using (true);
create policy "party_reveals_insert_anon" on public.party_reveals for insert to anon with check (true);
-- No UPDATE/DELETE policy: a reveal is irreversible from the browser.

grant select, insert on table public.party_guesses, public.party_reveals to anon;
