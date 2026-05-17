-- ── Improved profile auto-creation trigger ────────────────────────────────────
-- Replaces the Task 9 version with two improvements:
--   1. ON CONFLICT (id) DO NOTHING – idempotent; safe if trigger fires twice
--   2. Falls back to 'picture' key for avatar_url (used by some OAuth providers)
-- Safe to re-run: CREATE OR REPLACE function + DROP/CREATE trigger.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',   -- Google OAuth
      new.raw_user_meta_data->>'name',         -- Microsoft/Azure OAuth
      split_part(new.email, '@', 1)            -- email signup fallback
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',   -- Supabase-normalised field
      new.raw_user_meta_data->>'picture'        -- Google raw metadata key
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ── Verification ──────────────────────────────────────────────────────────────
-- After signing up a test user, run:
--   select id, display_name, avatar_url, created_at
--   from public.profiles
--   order by created_at desc
--   limit 5;
-- Every auth.users row should have a matching profiles row.
