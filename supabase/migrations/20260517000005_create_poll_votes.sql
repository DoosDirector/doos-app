-- ── poll_votes table ──────────────────────────────────────────────────────────
create table if not exists public.poll_votes (
  id          uuid primary key default gen_random_uuid(),
  option_id   uuid not null references public.poll_options (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ── Unique constraint: one vote per user per question ─────────────────────────
-- We enforce this at the question level (not option level) so a user can't
-- vote for two options on the same question. The subquery resolves
-- option → question for the unique index.
create unique index if not exists poll_votes_user_question_uniq
  on public.poll_votes (
    user_id,
    (select question_id from public.poll_options where id = option_id)
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
