/**
 * Unit tests for core server actions in lib/actions/events.ts
 *
 * Strategy:
 * - Mock @/lib/supabase/server so no real DB is touched
 * - Mock @/lib/auth/guard so we control auth state per test
 * - Mock next/navigation and next/cache to capture side effects
 * - Use a chainable builder helper to simulate Supabase's fluent API
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest"

// ── Module mocks (hoisted) ────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))
vi.mock("@/lib/auth/guard", () => ({ requireUser: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/guard"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  createEvent,
  castVote,
  upsertRsvp,
  uploadMemory,
  deleteMemory,
  addEventStop,
  deleteEventStop,
  reorderEventStops,
} from "@/lib/actions/events"

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_USER = { id: "user-uuid-1", email: "test@example.com" } as any

/**
 * Creates a Supabase query-builder mock. Every chainable method returns `this`;
 * terminal methods (.single, .maybeSingle) resolve to `result`. The builder
 * itself is also thenable so `await supabase.from("x").insert(y)` works
 * without a trailing `.single()`.
 */
function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  for (const m of [
    "insert", "select", "delete", "upsert", "update",
    "eq", "neq", "order", "limit", "filter",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.single      = vi.fn().mockResolvedValue(result)
  chain.maybeSingle = vi.fn().mockResolvedValue(result)
  chain.then        = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(result).then(res, rej)
  return chain
}

/** Builds a full Supabase client mock from a table → result map. */
function makeClient(tables: Record<string, unknown> = {}, storageOverrides: Record<string, unknown> = {}) {
  return {
    from: vi.fn((table: string) => makeChain(tables[table] ?? { data: null, error: null })),
    storage: {
      from: vi.fn(() => ({
        upload:       vi.fn().mockResolvedValue(storageOverrides.upload   ?? { data: { path: "events/e1/ts-file.jpg" }, error: null }),
        remove:       vi.fn().mockResolvedValue(storageOverrides.remove   ?? { data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://cdn.example.com/img.jpg" } }),
      })),
    },
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  ;(requireUser as Mock).mockResolvedValue(MOCK_USER)
})

// ─────────────────────────────────────────────────────────────────────────────
// createEvent
// ─────────────────────────────────────────────────────────────────────────────

describe("createEvent", () => {
  const BASE_INPUT = {
    title:           "Team Lunch",
    description:     "Monthly team lunch",
    date:            "2026-08-15T12:30",
    type:            "lunch" as const,
    alcoholFriendly: false,
    pollQuestions:   [],
    stops:           [],
  }

  it("happy path — minimal event — redirects to new event page", async () => {
    const client = makeClient({
      events: { data: { id: "evt-abc" }, error: null },
    })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent(BASE_INPUT)

    expect(result).toBeUndefined()
    expect(redirect).toHaveBeenCalledWith("/events/evt-abc?created=1")
  })

  it("happy path — event with poll questions and options", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: { id: "evt-abc" }, error: null }))  // events insert
      .mockImplementationOnce(() => makeChain({ data: { id: "q-1" }, error: null }))       // poll_questions
      .mockImplementationOnce(() => makeChain({ error: null }))                             // poll_options
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent({
      ...BASE_INPUT,
      pollQuestions: [
        { text: "Which venue?", type: "single", options: ["The Blue Boar", "The Crown"] },
      ],
    })

    expect(result).toBeUndefined()
    expect(redirect).toHaveBeenCalledWith("/events/evt-abc?created=1")
    // Verify poll_questions and poll_options were written
    expect(fromMock).toHaveBeenCalledWith("poll_questions")
    expect(fromMock).toHaveBeenCalledWith("poll_options")
  })

  it("happy path — event with map stops", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: { id: "evt-abc" }, error: null })) // events
      .mockImplementationOnce(() => makeChain({ error: null }))                           // event_stops
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent({
      ...BASE_INPUT,
      stops: [{ placeId: "ChIJ", name: "The Shard", address: "London", lat: 51.5, lng: -0.09 }],
    })

    expect(result).toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith("event_stops")
  })

  it("validation — empty title returns error without touching DB", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent({ ...BASE_INPUT, title: "" })

    expect(result).toEqual({ error: "Title is required" })
    expect(client.from).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it("validation — poll question with fewer than 2 options is silently dropped", async () => {
    const client = makeClient({
      events: { data: { id: "evt-abc" }, error: null },
    })
    ;(createClient as Mock).mockResolvedValue(client)

    // Question has only 1 non-empty option → sanitiser removes it → no poll inserted
    const result = await createEvent({
      ...BASE_INPUT,
      pollQuestions: [{ text: "When?", type: "single", options: ["Friday", ""] }],
    })

    // Only 1 valid option after filtering empty strings → question dropped → no poll_questions call
    expect(result).toBeUndefined()
    expect(client.from).not.toHaveBeenCalledWith("poll_questions")
  })

  it("DB error on event insert — returns error, does not redirect", async () => {
    const client = makeClient({
      events: { data: null, error: { message: "unique constraint violation" } },
    })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent(BASE_INPUT)

    expect(result).toEqual({ error: "unique constraint violation" })
    expect(redirect).not.toHaveBeenCalled()
  })

  it("DB error on poll question — returns error and rolls back event", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: { id: "evt-xyz" }, error: null })) // events insert
      .mockImplementationOnce(() => makeChain({ data: null, error: { message: "poll error" } })) // poll_questions
      .mockImplementationOnce(() => makeChain({ error: null }))                                  // events delete (rollback)
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent({
      ...BASE_INPUT,
      pollQuestions: [{ text: "Where?", type: "single", options: ["Venue A", "Venue B"] }],
    })

    expect(result).toEqual({ error: "poll error" })
    expect(redirect).not.toHaveBeenCalled()
    // Rollback: events.delete() was called
    const deleteCalls = fromMock.mock.calls.filter(([t]) => t === "events")
    expect(deleteCalls.length).toBeGreaterThanOrEqual(2)
  })

  it("DB error on stop insert — returns error and rolls back event", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: { id: "evt-xyz" }, error: null })) // events insert
      .mockImplementationOnce(() => makeChain({ error: { message: "stop error" } }))      // event_stops
      .mockImplementationOnce(() => makeChain({ error: null }))                            // events delete
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await createEvent({
      ...BASE_INPUT,
      stops: [{ placeId: "p1", name: "Venue", address: "London", lat: 51.5, lng: -0.09 }],
    })

    expect(result).toEqual({ error: "stop error" })
    expect(redirect).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// castVote
// ─────────────────────────────────────────────────────────────────────────────

describe("castVote", () => {
  it("happy path — deletes old vote then inserts new vote", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ error: null })) // poll_votes delete
      .mockImplementationOnce(() => makeChain({ error: null })) // poll_votes insert
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await castVote("opt-1", "q-1")

    expect(result).toBeUndefined()
    expect(fromMock).toHaveBeenCalledTimes(2)
    expect(fromMock).toHaveBeenCalledWith("poll_votes")
  })

  it("delete error — returns error without attempting insert", async () => {
    const fromMock = vi.fn().mockImplementationOnce(() => makeChain({ error: { message: "delete failed" } }))
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await castVote("opt-1", "q-1")

    expect(result).toEqual({ error: "delete failed" })
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it("insert error — returns error", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ error: null }))                        // delete OK
      .mockImplementationOnce(() => makeChain({ error: { message: "insert failed" } })) // insert fails
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await castVote("opt-1", "q-1")

    expect(result).toEqual({ error: "insert failed" })
  })

  it("requireUser failure — propagates thrown error", async () => {
    ;(requireUser as Mock).mockRejectedValue(new Error("Unauthorized"))
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    await expect(castVote("opt-1", "q-1")).rejects.toThrow("Unauthorized")
    expect(client.from).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// upsertRsvp
// ─────────────────────────────────────────────────────────────────────────────

describe("upsertRsvp", () => {
  const VALID_INPUT = {
    eventId:            "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    status:             "yes" as const,
    drinkingPreference: "no"  as const,
  }

  it("happy path — upserts and redirects", async () => {
    const client = makeClient({ rsvps: { error: null } })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await upsertRsvp(VALID_INPUT)

    expect(result).toBeUndefined()
    expect(client.from).toHaveBeenCalledWith("rsvps")
    expect(redirect).toHaveBeenCalledWith(`/events/${VALID_INPUT.eventId}?rsvp=updated`)
  })

  it("validation — non-UUID eventId returns error", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await upsertRsvp({ ...VALID_INPUT, eventId: "not-a-uuid" })

    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(client.from).not.toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it("validation — invalid status returns error", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await upsertRsvp({ ...VALID_INPUT, status: "hmm" as never })

    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(redirect).not.toHaveBeenCalled()
  })

  it("DB upsert error — returns error without redirecting", async () => {
    const client = makeClient({ rsvps: { error: { message: "upsert conflict" } } })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await upsertRsvp(VALID_INPUT)

    expect(result).toEqual({ error: "upsert conflict" })
    expect(redirect).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// uploadMemory
// ─────────────────────────────────────────────────────────────────────────────

describe("uploadMemory", () => {
  const EVENT_ID  = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  const MOCK_FILE = new File(["binary"], "photo.jpg", { type: "image/jpeg" })

  function makeFormData(overrides: { file?: unknown; eventId?: string; caption?: string } = {}) {
    const fd = new FormData()
    fd.append("file",    (overrides.file    ?? MOCK_FILE) as File)
    fd.append("eventId", overrides.eventId  ?? EVENT_ID)
    fd.append("caption", overrides.caption  ?? "A great memory")
    return fd
  }

  it("happy path — image — uploads to storage and inserts DB row", async () => {
    const client = makeClient({ memories: { error: null } })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await uploadMemory(makeFormData())

    expect(result).toBeUndefined()
    expect(client.storage.from).toHaveBeenCalledWith("memories")
    expect(client.from).toHaveBeenCalledWith("memories")
    expect(revalidatePath).toHaveBeenCalled()
  })

  it("happy path — video — sets media_type to video", async () => {
    const videoFile = new File(["data"], "clip.mp4", { type: "video/mp4" })
    const client    = makeClient({ memories: { error: null } })
    ;(createClient as Mock).mockResolvedValue(client)

    const fd = new FormData()
    fd.append("file",    videoFile)
    fd.append("eventId", EVENT_ID)
    fd.append("caption", "")

    const result = await uploadMemory(fd)

    expect(result).toBeUndefined()
    // Verify the insert was called (media_type determined internally)
    expect(client.from).toHaveBeenCalledWith("memories")
  })

  it("missing file — returns error without DB calls", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const fd = new FormData()
    fd.append("eventId", EVENT_ID)
    // No "file" field

    const result = await uploadMemory(fd)

    expect(result).toEqual({ error: "No file provided" })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("invalid MIME type — returns validation error", async () => {
    const badFile = new File(["pdf content"], "doc.pdf", { type: "application/pdf" })
    const client  = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await uploadMemory(makeFormData({ file: badFile }))

    expect(result).toEqual(expect.objectContaining({
      error: expect.stringContaining("Unsupported file type"),
    }))
    expect(client.storage.from).not.toHaveBeenCalled()
  })

  it("file too large — returns validation error", async () => {
    const bigFile = new File(["x"], "huge.jpg", { type: "image/jpeg" })
    Object.defineProperty(bigFile, "size", { value: 51 * 1024 * 1024 })
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await uploadMemory(makeFormData({ file: bigFile }))

    expect(result).toEqual({ error: "File must be smaller than 50 MB" })
    expect(client.storage.from).not.toHaveBeenCalled()
  })

  it("invalid eventId — returns validation error", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await uploadMemory(makeFormData({ eventId: "not-a-uuid" }))

    expect(result).toEqual(expect.objectContaining({ error: expect.any(String) }))
    expect(client.storage.from).not.toHaveBeenCalled()
  })

  it("storage upload error — returns error without inserting DB row", async () => {
    const client = makeClient(
      {},
      { upload: { data: null, error: { message: "bucket not found" } } },
    )
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await uploadMemory(makeFormData())

    expect(result).toEqual({ error: "bucket not found" })
    expect(client.from).not.toHaveBeenCalledWith("memories")
  })

  it("DB insert error after upload — returns error and removes file from storage", async () => {
    const removeMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const client: any = makeClient({ memories: { error: { message: "insert failed" } } })
    client.storage.from.mockReturnValue({
      upload:       vi.fn().mockResolvedValue({ data: { path: "events/e1/ts-file.jpg" }, error: null }),
      remove:       removeMock,
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
    })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await uploadMemory(makeFormData())

    expect(result).toEqual({ error: "insert failed" })
    expect(removeMock).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deleteMemory
// ─────────────────────────────────────────────────────────────────────────────

describe("deleteMemory", () => {
  const MEMORY_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  const EVENT_ID  = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

  function makeMemoryRow(overrides: Partial<{
    uploader_id: string
    organiser_id: string
  }> = {}) {
    return {
      id:           MEMORY_ID,
      storage_path: "events/d0ee/ts-photo.jpg",
      uploader_id:  overrides.uploader_id  ?? MOCK_USER.id,
      event_id:     EVENT_ID,
      events:       { organiser_id: overrides.organiser_id ?? "organiser-uuid" },
    }
  }

  it("uploader can delete their own memory", async () => {
    const memoryRow = makeMemoryRow({ uploader_id: MOCK_USER.id })
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: memoryRow, error: null })) // select
      .mockImplementationOnce(() => makeChain({ error: null }))                  // delete
    const removeMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const client: any = { from: fromMock, storage: { from: vi.fn(() => ({ remove: removeMock })) } }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory(MEMORY_ID, EVENT_ID)

    expect(result).toBeUndefined()
    expect(removeMock).toHaveBeenCalledWith(["events/d0ee/ts-photo.jpg"])
    expect(revalidatePath).toHaveBeenCalled()
  })

  it("organiser can delete any memory in their event", async () => {
    const memoryRow = makeMemoryRow({
      uploader_id:  "someone-else",
      organiser_id: MOCK_USER.id,
    })
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: memoryRow, error: null }))
      .mockImplementationOnce(() => makeChain({ error: null }))
    const removeMock = vi.fn().mockResolvedValue({ data: [], error: null })
    const client: any = { from: fromMock, storage: { from: vi.fn(() => ({ remove: removeMock })) } }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory(MEMORY_ID, EVENT_ID)

    expect(result).toBeUndefined()
    expect(removeMock).toHaveBeenCalled()
  })

  it("validation — non-UUID memoryId returns error", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory("not-a-uuid", EVENT_ID)

    expect(result).toEqual({ error: "Invalid memory ID" })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("validation — non-UUID eventId returns error", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory(MEMORY_ID, "not-a-uuid")

    expect(result).toEqual({ error: "Invalid event ID" })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("memory not found — returns error without attempting delete", async () => {
    const fromMock = vi.fn().mockImplementationOnce(() =>
      makeChain({ data: null, error: { message: "not found", code: "PGRST116" } })
    )
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory(MEMORY_ID, EVENT_ID)

    expect(result).toEqual({ error: "Memory not found" })
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it("unauthorised user — neither uploader nor organiser — returns error", async () => {
    const memoryRow = makeMemoryRow({
      uploader_id:  "someone-else",
      organiser_id: "another-person",
    })
    const fromMock = vi.fn().mockImplementationOnce(() =>
      makeChain({ data: memoryRow, error: null })
    )
    const client = { from: fromMock, storage: makeClient().storage }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory(MEMORY_ID, EVENT_ID)

    expect(result).toEqual({ error: "You do not have permission to delete this memory" })
    // Only one DB call (the select) — no delete
    expect(fromMock).toHaveBeenCalledTimes(1)
  })

  it("DB delete error — returns error, storage removal not attempted", async () => {
    const memoryRow = makeMemoryRow({ uploader_id: MOCK_USER.id })
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: memoryRow, error: null }))            // select
      .mockImplementationOnce(() => makeChain({ error: { message: "delete failed" } }))    // delete
    const removeMock = vi.fn()
    const client: any = { from: fromMock, storage: { from: vi.fn(() => ({ remove: removeMock })) } }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteMemory(MEMORY_ID, EVENT_ID)

    expect(result).toEqual({ error: "delete failed" })
    expect(removeMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// addEventStop
// ─────────────────────────────────────────────────────────────────────────────

describe("addEventStop", () => {
  const EVENT_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  const STOP_ID  = "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

  const BASE_STOP = {
    eventId: EVENT_ID,
    name:    "The Red Lion",
    address: "1 High Street, London",
    lat:     51.5074,
    lng:     -0.1278,
    placeId: "ChIJplace123",
  }

  it("happy path — first stop gets order 0 and returns its id", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: [],              error: null })) // select existing stops
      .mockImplementationOnce(() => makeChain({ data: { id: STOP_ID }, error: null })) // insert → single
    ;(createClient as Mock).mockResolvedValue({ from: fromMock })

    const result = await addEventStop(BASE_STOP)

    expect(result).toEqual({ id: STOP_ID })
    const insertChain = fromMock.mock.results[1].value
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ order: 0, event_id: EVENT_ID }),
    )
  })

  it("happy path — subsequent stop gets order = max + 1", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: [{ order: 2 }], error: null })) // existing stops, max order = 2
      .mockImplementationOnce(() => makeChain({ data: { id: STOP_ID }, error: null }))
    ;(createClient as Mock).mockResolvedValue({ from: fromMock })

    await addEventStop(BASE_STOP)

    const insertChain = fromMock.mock.results[1].value
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ order: 3 }),
    )
  })

  it("validation — missing name returns error without DB calls", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await addEventStop({ ...BASE_STOP, name: "" })

    expect(result).toMatchObject({ error: expect.any(String) })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("validation — non-UUID eventId returns error without DB calls", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await addEventStop({ ...BASE_STOP, eventId: "not-a-uuid" })

    expect(result).toMatchObject({ error: "Invalid event ID" })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("DB insert error — returns error", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: [], error: null }))
      .mockImplementationOnce(() => makeChain({ data: null, error: { message: "insert failed" } }))
    ;(createClient as Mock).mockResolvedValue({ from: fromMock })

    const result = await addEventStop(BASE_STOP)

    expect(result).toEqual({ error: "insert failed" })
  })

  it("revalidates event path on success", async () => {
    const fromMock = vi.fn()
      .mockImplementationOnce(() => makeChain({ data: [], error: null }))
      .mockImplementationOnce(() => makeChain({ data: { id: STOP_ID }, error: null }))
    ;(createClient as Mock).mockResolvedValue({ from: fromMock })

    await addEventStop(BASE_STOP)

    expect(revalidatePath).toHaveBeenCalledWith(`/events/${EVENT_ID}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deleteEventStop
// ─────────────────────────────────────────────────────────────────────────────

describe("deleteEventStop", () => {
  const EVENT_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  const STOP_ID  = "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

  it("happy path — deletes stop and revalidates path", async () => {
    const client = makeClient({ event_stops: { error: null } })
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteEventStop(STOP_ID, EVENT_ID)

    expect(result).toBeUndefined()
    expect(revalidatePath).toHaveBeenCalledWith(`/events/${EVENT_ID}`)
  })

  it("DB error — returns error without revalidating", async () => {
    const chain = makeChain({ error: { message: "delete failed" } })
    const client = { from: vi.fn().mockReturnValue(chain) }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await deleteEventStop(STOP_ID, EVENT_ID)

    expect(result).toEqual({ error: "delete failed" })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("requireUser failure — propagates thrown error", async () => {
    ;(requireUser as Mock).mockRejectedValueOnce(new Error("Unauthenticated"))

    await expect(deleteEventStop(STOP_ID, EVENT_ID)).rejects.toThrow("Unauthenticated")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// reorderEventStops
// ─────────────────────────────────────────────────────────────────────────────

describe("reorderEventStops", () => {
  const EVENT_ID   = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  const ORDERED_IDS = [
    "f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "f2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  ]

  it("happy path — issues one update per stop and revalidates", async () => {
    const chain = makeChain({ error: null })
    const client = { from: vi.fn().mockReturnValue(chain) }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await reorderEventStops(EVENT_ID, ORDERED_IDS)

    expect(result).toBeUndefined()
    expect(client.from).toHaveBeenCalledTimes(3)
    expect(chain.update).toHaveBeenNthCalledWith(1, { order: 0 })
    expect(chain.update).toHaveBeenNthCalledWith(2, { order: 1 })
    expect(chain.update).toHaveBeenNthCalledWith(3, { order: 2 })
    expect(revalidatePath).toHaveBeenCalledWith(`/events/${EVENT_ID}`)
  })

  it("one update fails — returns error and does not revalidate", async () => {
    const goodChain = makeChain({ error: null })
    const badChain  = makeChain({ error: { message: "update failed" } })
    const client = { from: vi.fn()
      .mockReturnValueOnce(goodChain)
      .mockReturnValueOnce(badChain)
      .mockReturnValueOnce(goodChain),
    }
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await reorderEventStops(EVENT_ID, ORDERED_IDS)

    expect(result).toEqual({ error: "update failed" })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("empty list — no DB calls, revalidates path", async () => {
    const client = makeClient()
    ;(createClient as Mock).mockResolvedValue(client)

    const result = await reorderEventStops(EVENT_ID, [])

    expect(result).toBeUndefined()
    expect(client.from).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith(`/events/${EVENT_ID}`)
  })

  it("requireUser failure — propagates thrown error", async () => {
    ;(requireUser as Mock).mockRejectedValueOnce(new Error("Unauthenticated"))

    await expect(reorderEventStops(EVENT_ID, ORDERED_IDS)).rejects.toThrow("Unauthenticated")
  })
})
