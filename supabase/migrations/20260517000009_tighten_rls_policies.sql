-- ── Task 17: Tighten RLS across all tables ────────────────────────────────────
--
-- Membership rule: a user "belongs to" an event if they are the organiser
-- OR have an RSVP row for it (any status).
--
-- NOTE FOR APP CODE: when a signed-in user arrives via a share link they have
-- no RSVP yet. The app must upsert an RSVP (status='maybe') before querying
-- protected event data, or show a "Join event" CTA first.
-- The anon policies remain in place so the public /e/[token] preview page
-- always works without auth.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: is the calling user a member of this event? ───────────────────────
create or replace function public.is_event_member(p_event_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    -- user is the organiser
    exists (
      select 1 from public.events e
      where e.id = p_event_id
        and e.organiser_id = auth.uid()
    )
    or
    -- user has any RSVP for the event
    exists (
      select 1 from public.rsvps r
      where r.event_id = p_event_id
        and r.user_id = auth.uid()
    );
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- events
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read all events" on public.events;

create policy "Members can read their events"
  on public.events
  for select
  to authenticated
  using (public.is_event_member(id));

-- ══════════════════════════════════════════════════════════════════════════════
-- poll_questions
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read poll questions" on public.poll_questions;

create policy "Members can read poll questions"
  on public.poll_questions
  for select
  to authenticated
  using (public.is_event_member(event_id));

-- ══════════════════════════════════════════════════════════════════════════════
-- poll_options
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read poll options" on public.poll_options;

create policy "Members can read poll options"
  on public.poll_options
  for select
  to authenticated
  using (
    exists (
      select 1 from public.poll_questions q
      where q.id = poll_options.question_id
        and public.is_event_member(q.event_id)
    )
  );

-- ══════════════════════════════════════════════════════════════════════════════
-- poll_votes
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read poll votes" on public.poll_votes;

create policy "Members can read poll votes"
  on public.poll_votes
  for select
  to authenticated
  using (public.is_event_member(
    (select q.event_id from public.poll_questions q where q.id = poll_votes.question_id)
  ));

-- ══════════════════════════════════════════════════════════════════════════════
-- rsvps
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read RSVPs" on public.rsvps;

create policy "Members can read RSVPs for their events"
  on public.rsvps
  for select
  to authenticated
  using (public.is_event_member(event_id));

-- ══════════════════════════════════════════════════════════════════════════════
-- event_stops
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read event stops" on public.event_stops;

create policy "Members can read event stops"
  on public.event_stops
  for select
  to authenticated
  using (public.is_event_member(event_id));

-- ══════════════════════════════════════════════════════════════════════════════
-- memories
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Authenticated users can read memories" on public.memories;

create policy "Members can read memories"
  on public.memories
  for select
  to authenticated
  using (public.is_event_member(event_id));

-- ══════════════════════════════════════════════════════════════════════════════
-- profiles – tighten: users can only see profiles of people on shared events
-- ══════════════════════════════════════════════════════════════════════════════
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can read profiles of event members"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.rsvps r
      where r.user_id = profiles.id
        and public.is_event_member(r.event_id)
    )
    or exists (
      select 1 from public.events e
      where e.organiser_id = profiles.id
        and public.is_event_member(e.id)
    )
  );
