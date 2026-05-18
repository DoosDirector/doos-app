-- ── Storage bucket: memories ──────────────────────────────────────────────────
--
-- Public bucket so getPublicUrl() works without signed URLs.
-- Storage-level RLS policies restrict who can upload and delete.
-- Path convention: events/{event_id}/{timestamp}-{filename}
--
-- Allowed types and 50 MB cap mirror the server-action validation in
-- lib/actions/events.ts (uploadMemory).
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memories',
  'memories',
  true,
  52428800,  -- 50 MB in bytes
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Storage policies ──────────────────────────────────────────────────────────

-- Anyone (including anon) can read files — public bucket means URLs work
-- without auth, but we still need an explicit SELECT policy if RLS is enabled
-- on storage.objects.
create policy "Anyone can read memories"
  on storage.objects
  for select
  using (bucket_id = 'memories');

-- Only authenticated event members can upload.
-- Extracts the event_id from path segment 2: events/{event_id}/{file}
create policy "Event members can upload memories"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'memories'
    and public.is_event_member(
      (string_to_array(name, '/'))[2]::uuid
    )
  );

-- Uploaders (via owner column) and event organisers can delete files.
create policy "Uploaders and organisers can delete memories"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'memories'
    and (
      -- The file owner (uploader)
      owner = auth.uid()
      or
      -- The event organiser
      exists (
        select 1 from public.events e
        where e.id   = (string_to_array(name, '/'))[2]::uuid
          and e.organiser_id = auth.uid()
      )
    )
  );
