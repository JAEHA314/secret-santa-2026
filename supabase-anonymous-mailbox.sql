-- Run once in Supabase SQL Editor before testing anonymous mailbox letters.
-- Existing letters remain non-anonymous.
alter table public.mailbox_letters
  add column if not exists is_anonymous boolean not null default false;

-- Keep existing browser permissions working with the new column.
grant select, insert on table public.mailbox_letters to anon;

-- NOTE: is_anonymous controls what the app displays after the mailbox opens.
-- The current app uses the anon browser role for both normal and client-side admin UI,
-- so sender_id is still stored on the row for admin/debugging purposes.
