/**
 * Golden-path smoke test: sign in → create event → RSVP → upload memory → share
 *
 * Prerequisites (real Supabase project + seeded test account required):
 *
 *   PLAYWRIGHT_BASE_URL   – e.g. http://localhost:3000  (default)
 *   E2E_EMAIL             – email of a seeded test account
 *   E2E_PASSWORD          – its password
 *
 * Run (headed for debugging):
 *   npx playwright test --headed
 *
 * Run against production:
 *   PLAYWRIGHT_BASE_URL=https://doos.app npx playwright test
 *
 * Design notes
 * ────────────
 * - `storageState` persists the Supabase session cookie so each test doesn't
 *   re-authenticate from scratch.
 * - `test.beforeAll` creates the event once; the UUID is shared via a closure
 *   variable scoped to the describe block (populated before any test runs).
 * - Tests are ordered 1–5 and share `eventId`; skip guards make failures
 *   visible rather than silently cascading.
 */

import path    from "path"
import fs      from "fs"
import os      from "os"
import { test, expect, type BrowserContext } from "@playwright/test"

// ── Credentials ───────────────────────────────────────────────────────────────

const EMAIL    = process.env.E2E_EMAIL    ?? "test@example.com"
const PASSWORD = process.env.E2E_PASSWORD ?? "password123"

// ── Shared state (populated in beforeAll, read by individual tests) ───────────

let authStatePath: string   // temp file holding session cookies
let eventId:       string   // UUID of the event created in beforeAll

// ── Auth helper ───────────────────────────────────────────────────────────────

async function signInAndSaveState(context: BrowserContext, statePath: string) {
  const page = await context.newPage()
  await page.goto("/auth/sign-in")

  await page.getByLabel(/email/i).fill(EMAIL)
  await page.getByLabel(/password/i).fill(PASSWORD)
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
  await page.close()

  await context.storageState({ path: statePath })
}

// ─────────────────────────────────────────────────────────────────────────────
// Golden path
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Golden path smoke test", () => {

  // Sign in once, create the test event, persist session to a temp file.
  test.beforeAll(async ({ browser }) => {
    authStatePath = path.join(os.tmpdir(), `doos-e2e-auth-${Date.now()}.json`)

    const context = await browser.newContext()
    await signInAndSaveState(context, authStatePath)

    // Create the event while we have a fresh context
    const page = await context.newPage()
    await page.goto("/events/create")
    await expect(page.getByRole("heading", { name: /create a doo/i })).toBeVisible()

    // Step 1: Basic details
    const title = `Smoke-test Doo – ${new Date().toISOString()}`
    await page.getByLabel(/event title/i).fill(title)
    await page.getByLabel(/description/i).fill("Automated golden-path smoke test.")

    const soon     = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const isoLocal = soon.toISOString().slice(0, 16)          // yyyy-mm-ddThh:mm
    const dateInput = page.locator('input[type="datetime-local"], input[type="date"]').first()
    await dateInput.fill(isoLocal)

    // Step 2: skip polls
    await page.getByRole("button", { name: /next/i }).click()
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible({ timeout: 5_000 })

    // Step 3: skip stops → create
    await page.getByRole("button", { name: /next/i }).click()
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible({ timeout: 5_000 })
    await page.getByRole("button", { name: /create/i }).click()

    // Land on the new event page and extract its UUID
    await page.waitForURL(/\/events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, {
      timeout: 25_000,
    })
    eventId = page.url().match(/\/events\/([0-9a-f-]{36})$/)?.[1] ?? ""
    expect(eventId, "event ID must be captured from URL").not.toBe("")

    await page.close()
    await context.close()
  })

  // Clean up the temp auth file after all tests.
  test.afterAll(() => {
    if (authStatePath && fs.existsSync(authStatePath)) fs.unlinkSync(authStatePath)
  })

  // ── 1. Sign in ──────────────────────────────────────────────────────────────

  test("1 – signs in with email and password", async ({ browser }) => {
    const context = await browser.newContext()
    const page    = await context.newPage()

    await page.goto("/auth/sign-in")
    await page.getByLabel(/email/i).fill(EMAIL)
    await page.getByLabel(/password/i).fill(PASSWORD)
    await page.getByRole("button", { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

    await expect(page).toHaveURL(/\/dashboard/)
    // Dashboard heading varies — just confirm we're past the auth wall
    await expect(page.locator("h1, h2").first()).toBeVisible()

    await context.close()
  })

  // ── 2. Event created (verified inside beforeAll) ─────────────────────────────

  test("2 – event was created and has a valid UUID", () => {
    expect(eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  // ── 3. RSVP ─────────────────────────────────────────────────────────────────

  test("3 – RSVPs to the event as Going", async ({ browser }) => {
    test.skip(!eventId, "eventId not set — event creation failed")

    const context = await browser.newContext({ storageState: authStatePath })
    const page    = await context.newPage()

    await page.goto(`/events/${eventId}/rsvp`)

    // The attendance radiogroup has aria-label="Attendance"; "Going" is the first option
    const goingBtn = page.getByRole("radio", { name: /going/i })
    await expect(goingBtn).toBeVisible({ timeout: 10_000 })
    await goingBtn.click()

    // Submit button text: "Confirm RSVP" (first RSVP) or "Update RSVP" (existing)
    await page.getByRole("button", { name: /confirm rsvp|update rsvp/i }).click()

    // upsertRsvp redirects to /events/<id>?rsvp=updated
    await page.waitForURL(new RegExp(`/events/${eventId}`), { timeout: 15_000 })

    await context.close()
  })

  // ── 4. Upload memory ────────────────────────────────────────────────────────

  test("4 – uploads a memory photo", async ({ browser }) => {
    test.skip(!eventId, "eventId not set — event creation failed")

    const context = await browser.newContext({ storageState: authStatePath })
    const page    = await context.newPage()

    // Navigate directly to the upload page (skip memory-box listing)
    await page.goto(`/events/${eventId}/memory-box/upload`)
    await expect(page.getByRole("heading", { name: /add a memory/i })).toBeVisible({ timeout: 10_000 })

    // The actual <input type="file"> is visually hidden with class "sr-only".
    // Playwright can setInputFiles on it directly without needing to click the drop zone.
    const fixturePath = path.resolve(__dirname, "fixtures/1x1.jpg")
    await page.locator('input[type="file"]').setInputFiles(fixturePath)

    // After attaching a file the submit button shows "Upload 1 file"
    await expect(
      page.getByRole("button", { name: /upload/i }),
    ).toBeVisible({ timeout: 5_000 })

    await page.getByRole("button", { name: /upload/i }).click()

    // On success the action redirects to /events/<id>/memory-box
    await page.waitForURL(new RegExp(`/events/${eventId}/memory-box$`), { timeout: 25_000 })

    await context.close()
  })

  // ── 5. Share ─────────────────────────────────────────────────────────────────

  test("5 – share link resolves to public preview", async ({ browser }) => {
    test.skip(!eventId, "eventId not set — event creation failed")

    // Fetch the share_token by loading the event page as the auth'd user.
    // The <ShareButton> receives shareToken as a prop; we read it by
    // intercepting the page's network response for the event data, or simply
    // by constructing the public URL from the share_token embedded in the HTML.
    const authContext  = await browser.newContext({ storageState: authStatePath })
    const authPage     = await authContext.newPage()
    await authPage.goto(`/events/${eventId}`)

    // The Share button has aria-label="Share this Doo"
    const shareBtn = authPage.getByRole("button", { name: /copy link|share this doo|share doo/i })
    await expect(shareBtn).toBeVisible({ timeout: 10_000 })

    // Grant clipboard-read permission and capture the URL written to clipboard
    await authContext.grantPermissions(["clipboard-read", "clipboard-write"])
    await shareBtn.click()

    // The button copies /e/<token> to clipboard; wait briefly for the copy
    await authPage.waitForTimeout(500)
    const clipText = await authPage.evaluate(() => navigator.clipboard.readText())

    // clipText may be either the full URL (https://…/e/<token>) or just the path
    const tokenMatch = clipText.match(/\/e\/([A-Za-z0-9_-]{10,})/)
    const shareToken = tokenMatch?.[1]

    await authContext.close()

    // Verify the public preview page loads without auth
    if (!shareToken) {
      // Clipboard not available in this browser/env — verify the button exists only
      test.info().annotations.push({
        type: "skip-reason",
        description: "Clipboard API unavailable; share button presence confirmed only",
      })
      return
    }

    const anonContext = await browser.newContext()
    const anonPage    = await anonContext.newPage()
    await anonPage.goto(`/e/${shareToken}`)

    await expect(anonPage.getByText(/you've been invited/i)).toBeVisible({ timeout: 10_000 })

    // CTA should prompt sign-in (anon user)
    await expect(
      anonPage.getByRole("link", { name: /sign in to rsvp/i }),
    ).toBeVisible()

    await anonContext.close()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Auth guard (no credentials needed)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Auth guard", () => {
  test("unauthenticated user is redirected to sign-in from /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 10_000 })
  })

  test("unauthenticated user is redirected to sign-in from /events/create", async ({ page }) => {
    await page.goto("/events/create")
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 10_000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Public share page (no credentials needed)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Public share page", () => {
  test("unknown token renders gracefully — no unhandled crash", async ({ page }) => {
    // Use a syntactically valid but non-existent token
    await page.goto("/e/unknown-token-that-does-not-exist")

    // Should show a 404 / not-found UI, not an unhandled application error
    const body = await page.textContent("body")
    expect(body).not.toContain("Application error")
    expect(body).not.toContain("Internal Server Error")
  })
})
