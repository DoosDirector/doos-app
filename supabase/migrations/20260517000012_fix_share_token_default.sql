-- ── Fix share_token default: base64url is not a valid encoding in PostgreSQL ──
--
-- PostgreSQL's encode() only accepts 'base64', 'hex', and 'escape'.
-- base64url differs from base64 by substituting + → - and / → _ and
-- stripping = padding. We achieve this with translate() + replace().
--
-- Result: 16 URL-safe characters (12 random bytes, no padding needed because
-- 12 is evenly divisible by 3, so standard base64 never adds '=' here,
-- but we strip it anyway to be safe).
--
-- Safe to re-run: ALTER COLUMN … SET DEFAULT is idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Replace the column default ────────────────────────────────────────────
alter table public.events
  alter column share_token
  set default replace(
    translate(
      encode(gen_random_bytes(12), 'base64'),
      '+/',   -- base64 chars that are not URL-safe
      '-_'    -- their base64url replacements
    ),
    '=', ''   -- strip padding
  );

-- ── 2. Backfill any rows that were inserted with a broken token ───────────────
-- (rows created while the 'base64url' default was active will have NULL or
-- a token with an invalid default — regenerate them safely)
update public.events
set share_token = replace(
    translate(
      encode(gen_random_bytes(12), 'base64'),
      '+/', '-_'
    ),
    '=', ''
  )
where share_token is null
   or share_token ~ '[^A-Za-z0-9\-_]';  -- contains non-base64url characters
