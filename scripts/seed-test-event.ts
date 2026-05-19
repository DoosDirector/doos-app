/**
 * Seed script — creates one realistic test event for final validation.
 *
 * Usage:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> ORGANISER_EMAIL=<email> \
 *     npx tsx scripts/seed-test-event.ts
 *
 * The script uses the service-role key so it bypasses RLS and can insert rows
 * on behalf of any existing user account.  It never creates auth users.
 *
 * Required env vars:
 *   SUPABASE_URL              – e.g. https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY – service role (secret) key
 *   ORGANISER_EMAIL           – email of an existing Supabase auth user
 */

import { createClient } from "@supabase/supabase-js"

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL             = process.env.NEXT_PUBLIC_SUPABASE_URL             ?? process.env.SUPABASE_URL             ?? ""
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
const ORGANISER_EMAIL          = process.env.ORGANISER_EMAIL ?? ""

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ORGANISER_EMAIL) {
  console.error(
    "Missing required env vars.\n" +
    "Set: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, ORGANISER_EMAIL"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Event data ────────────────────────────────────────────────────────────────

// A team lunch crawl around central London — realistic scenario for a UK workplace app.
const EVENT_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // one week from now
EVENT_DATE.setHours(12, 30, 0, 0)

const EVENT_TITLE       = "Team Summer Lunch 🍽️"
const EVENT_DESCRIPTION = "Our first proper team get-together of the summer! We'll start with drinks at The Southwark Tavern, then head over to Flat Iron for steaks. Smart-casual dress code. Looking forward to seeing everyone outside of Slack!"
const EVENT_TYPE        = "lunch"
const ALCOHOL_FRIENDLY  = true

const POLL_QUESTIONS = [
  {
    text:    "Which day works best for you?",
    options: ["Tuesday 25 June", "Wednesday 26 June", "Thursday 27 June"],
  },
  {
    text:    "Starter preference?",
    options: ["Soup of the day", "Chicken wings", "Halloumi fries", "I'll decide on the day"],
  },
]

const STOPS = [
  {
    name:    "The Southwark Tavern",
    address: "22 Southwark St, London SE1 1TU",
    lat:     51.5055,
    lng:     -0.0919,
    order:   0,
  },
  {
    name:    "Flat Iron Southwark",
    address: "2 Union St, London SE1 1LY",
    lat:     51.5046,
    lng:     -0.0912,
    order:   1,
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(label: string) {
  console.log(`  ✓  ${label}`)
}

function fail(label: string, msg: unknown): never {
  console.error(`  ✗  ${label}: ${msg}`)
  process.exit(1)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nDoo's seed script — creating test event\n")

  // 1. Resolve organiser UUID from email via Auth admin API
  const { data: userList, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) fail("listUsers", listErr.message)

  const authUser = userList.users.find(
    (u) => u.email?.toLowerCase() === ORGANISER_EMAIL.toLowerCase()
  )
  if (!authUser) fail("find user", `No user with email "${ORGANISER_EMAIL}" found in Auth`)
  const organiserId = authUser.id
  ok(`Organiser: ${authUser.email} (${organiserId})`)

  // 2. Create event
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .insert({
      organiser_id:    organiserId,
      title:           EVENT_TITLE,
      description:     EVENT_DESCRIPTION,
      type:            EVENT_TYPE,
      date:            EVENT_DATE.toISOString(),
      alcohol_friendly: ALCOHOL_FRIENDLY,
    })
    .select("id, share_token")
    .single()

  if (eventErr || !event) fail("insert event", eventErr?.message ?? "no data")
  ok(`Event created: id=${event.id}  share_token=${event.share_token}`)

  // 3. Poll questions + options
  for (const q of POLL_QUESTIONS) {
    const { data: question, error: qErr } = await supabase
      .from("poll_questions")
      .insert({ event_id: event.id, question_text: q.text, question_type: "other" })
      .select("id")
      .single()

    if (qErr || !question) fail(`insert question "${q.text}"`, qErr?.message ?? "no data")

    const optionRows = q.options.map((text) => ({
      question_id: question.id,
      option_text: text,
    }))
    const { error: optErr } = await supabase.from("poll_options").insert(optionRows)
    if (optErr) fail(`insert options for "${q.text}"`, optErr.message)

    ok(`Poll: "${q.text}" (${q.options.length} options)`)
  }

  // 4. Map stops
  for (const stop of STOPS) {
    const { error: stopErr } = await supabase.from("event_stops").insert({
      event_id: event.id,
      name:     stop.name,
      address:  stop.address,
      lat:      stop.lat,
      lng:      stop.lng,
      order:    stop.order,
    })
    if (stopErr) fail(`insert stop "${stop.name}"`, stopErr.message)
    ok(`Stop ${stop.order + 1}: ${stop.name}`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://doos.app"
  console.log(`
──────────────────────────────────────────────
  Test event seeded successfully!

  Event URL:  ${appUrl}/events/${event.id}
  Share URL:  ${appUrl}/e/${event.share_token}

  Title:      ${EVENT_TITLE}
  Date:       ${EVENT_DATE.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
  Stops:      ${STOPS.length}
  Polls:      ${POLL_QUESTIONS.length}
──────────────────────────────────────────────
`)
}

main().catch((err) => {
  console.error("Unexpected error:", err)
  process.exit(1)
})
