-- ── poll_votes table ──────────────────────────────────────────────────────────
-- question_id is stored alongside option_id (small denormalisation) so the
-- unique constraint (user_id, question_id) can be a simple table constraint
-- without requiring a subquery expression index (unsupported in PostgreSQL).
create table if not exists public.poll_votes (
  id          uuid primary key default gen_random_uuid(),
  option_id   uuid not null references public.poll_options (id) on delete cascade,
  question_id uuid not null references public.poll_questions (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- One vote per user per question, enforced at the DB level
  constraint poll_votes_user_question_uniq unique (user_id, question_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Fast vote-count aggregation per option
create index if not exists poll_votes_option_id_idx
  on public.poll_votes (option_id);

-- Fast lookup of all votes by a user (for showing their current selection)
create index if not exists poll_votes_user_id_idx
  on public.poll_votes (user_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.poll_votes enable row level security;

-- Users can read all votes (needed to display live vote counts)
create policy "Authenticated users can read poll votes"
  on public.poll_votes
  for select
  to authenticated
  using (true);

-- Users can insert a vote only as themselves
create policy "Users can insert their own vote"
  on public.poll_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can delete (retract) only their own vote
create policy "Users can delete their own vote"
  on public.poll_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Anon users can read votes via share link (to show poll results publicly)
create policy "Anon users can read poll votes"
  on public.poll_votes
  for select
  to anon
  using (true);
