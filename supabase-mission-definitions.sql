-- Run once in Supabase SQL Editor before using ADMIN > 미션 관리.
create table if not exists public.mission_definitions (
  id integer primary key,
  target text not null check (target in ('마니또','모두','나')),
  particle text not null default '',
  action text not null,
  type text not null check (type in ('mailbox','message','board','action')),
  record_label text not null default '',
  notice text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.mission_definitions enable row level security;
drop policy if exists "mission definitions readable" on public.mission_definitions;
create policy "mission definitions readable" on public.mission_definitions for select using (true);
drop policy if exists "mission definitions writable" on public.mission_definitions;
create policy "mission definitions writable" on public.mission_definitions for all using (true) with check (true);
