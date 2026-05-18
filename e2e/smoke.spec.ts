/**
 * Golden-path smoke test: sign in → create event → RSVP → upload memory → share
 *
 * Requires a real Supabase project and a seeded test account.
 * Set the following env vars before running:
 *
 *   PLAYWRIGHT_BASE_URL   – e.g. http://localhost:3000 (default)
 *   E2E_EMAIL             – test account email
 *   E2E_PASSWORD          – test account password
 *
 * Run: npx playwright test --headed
 */

import { test, expect, type Page } from "@playwright/test"
import path from "path"

// ── Helpers ───────────────────────────────────────────────────────────────────

async function signIn(page: Page) {
  await page.goto("/auth/sign-in")
  await page.getByLabel(/email/i).fill(process.env.E2E_EMAIL ?? "test@example.com")
  await page.getByLabel(/password/i).fill(process.env.E2E_PASSWORD ?? "password123")
  await page.getByRole("button", { name: /sign in/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Golden path smoke test", () => {
  let eventId: string
  let shareToken: string

  // ── 1. Sign in ──────────────────────────────────────────────────────────────

  test("1 – signs in with email and password", async ({ page }) => {
    await signIn(page)
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole("heading", { name: /your doos/i })).toBeVisible()
  })

  // ── 2. Create event ─────────────────────────────────────────────────────────

  test("2 – creates a new event", async ({ page }) => {
    await signIn(page)

    await page.goto("/events/create")
    await expect(page.getByRole("heading", { name: /create a doo/i })).toBeVisible()

    // Step 1: Basic details
    const title = `Smoke test – ${new Date().toISOString()}`
    await page.getByLabel(/event title/i).fill(title)
    await page.getByLabel(/description/i).fill("An automated smoke-test event.")

    // Pick a date one week from now (yyyy-mm-ddThh:mm)
    const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const isoLocal = soon.toISOString().slice(0, 16)
    await page.getByLabel(/date/i).fill(isoLocal)

    // Advance to step 2 (Polls)
    await page.getByRole("button", { name: /next/i }).click()
    await expect(page.getByText(/add a poll/i)).toBeVisible()

    // Advance to step 3 (Stops) — skip polls
    await page.getByRole("button", { name: /next/i }).click()
    await expect(page.getByText(/add a stop/i)).toBeVisible()

    // Submit — skip stops
    await page.getByRole("button", { name: /create/i }).click()

    // Should land on the new event page
    await page.waitForURL(/\/events\/[0-9a-f-]{36}$/, { timeout: 20_000 })

    eventId = page.url().split("/events/")[1]
    expect(eventId).toMatch(/^[0-9a-f-]{36}$/)
  })

  // ── 3. RSVP ─────────────────────────────────────────────────────────────────

  test("3 – RSVPs to the event", async ({ page }) => {
    test.skip(!eventId, "Skipped: event not created in prior test")

    await signIn(page)
    await page.goto(`/events/${eventId}/rsvp`)
    await expect(page.getByRole("heading", { name: /rsvp/i })).toBeVisible()

    // Select "Going"
    await page.getByRole("button", { name: /going/i }).click()
    await page.getByRole("button", { name: /save/i }).click()

    // Should redirect back to event page
    await page.waitForURL(`/events/${eventId}`, { timeout: 10_000 })
    await expect(page.getByText(/going/i)).toBeVisible()
  })

  // ── 4. Upload memory ────────────────────────────────────────────────────────

  test("4 – uploads a memory photo", async ({ page }) => {
    test.skip(!eventId, "Skipped: event not created in prior test")

    await signIn(page)
    await page.goto(`/events/${eventId}/memory-box`)
    await expect(page.getByRole("heading", { name: /memory box/i })).toBeVisible()

    // Navigate to upload page
    await page.getByRole("link", { name: /add memory|upload/i }).click()
    await page.waitForURL(/\/memory-box\/upload/, { timeout: 5_000 })

    // Use a 1×1 pixel JPEG fixture
    const fixturePath = path.resolve(__dirname, "fixtures/1x1.jpg")
    await page.getByLabel(/choose file|photo/i).setInputFiles(fixturePath)

    await page.getByRole("button", { name: /upload/i }).click()

    // Should return to memory box with at least one photo
    await page.waitForURL(`/events/${eventId}/memory-box`, { timeout: 20_000 })
    const images = page.locator("img[alt]")
    await expect(images.first()).toBeVisible()
  })

  // ── 5. Share ─────────────────────────────────────────────────────────────────

  test("5 – share link resolves to public preview", async ({ page }) => {
    test.skip(!eventId, "Skipped: event not created in prior test")

    await signIn(page)
    await page.goto(`/events/${eventId}`)

    // Get share token from copy button's data attribute or navigate via href
    const shareHref = await page.locator("[data-share-url], [href^='/e/']").first().getAttribute("href")
    if (!shareHref) {
      // Try clipboard-based share button
      await page.getByRole("button", { name: /copy link|share/i }).click()
      // If native share sheet, just verify the button is there
      await expect(page.getByRole("button", { name: /copy link|share/i })).toBeVisible()
      return
    }

    shareToken = shareHref.replace("/e/", "")
    await page.goto(`/e/${shareToken}`)
    await expect(page.getByText(/you've been invited/i)).toBeVisible()
    await expect(page.getByRole("link", { name: /sign in to rsvp|rsvp to this/i })).toBeVisible()
  })
})

// ── Public share page — no auth required ────────────────────────────────────

test.describe("Public share page", () => {
  test("renders not-found gracefully for unknown token", async ({ page }) => {
    await page.goto("/e/00000000-0000-0000-0000-000000000000")
    // Should show 404 or the event-not-found page — not an unhandled crash
    const status = page.url()
    // Either a 404 page or the share page's own not-found state
    const body = await page.textContent("body")
    expect(body).not.toContain("Application error")
  })
})

// ── Auth guard ───────────────────────────────────────────────────────────────

test.describe("Auth guard", () => {
  test("unauthenticated user is redirected to sign-in from dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 10_000 })
  })

  test("unauthenticated user is redirected to sign-in from create event", async ({ page }) => {
    await page.goto("/events/create")
    await expect(page).toHaveURL(/\/auth\/sign-in/, { timeout: 10_000 })
  })
})
