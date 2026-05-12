# Doo's – Implementation Plan (Polished)

## Legend
Tasks are ordered from environment setup to launch. Each task is atomic and independently completable.

---

## Phase 1 – Project Bootstrap
1. **Init Next.js project** – Scaffold a new Next.js 15 App Router project with TypeScript and Tailwind CSS in the repo root.
2. **Install core dependencies** – Add shadcn/ui, Lucide React, TanStack Query, Zustand, next-pwa, Zod, Sonner, @supabase/ssr, and all other required packages to package.json and install them.
3. **Configure Tailwind & global styles** – Set up the Tailwind config with brand colours, fonts, and a global CSS baseline.
4. **Create folder structure** – Create the canonical `/app`, `/components`, `/lib/supabase`, and `/types` directories as defined in ARCHITECTURE.md.
5. **Configure environment variables** – Add `.env.local.example` with all required keys (Supabase URL/anon, Google Maps API, app URL, etc.).
6. **Set up Supabase project** – *(Manual step)* Create a new Supabase project in the dashboard and note the URL and anon key for env vars.
7. **Configure Vercel project** – *(Manual step)* Link the repo to Vercel and set environment variables for the first deployment.
8. **Verify blank deployment** – Push the skeleton app and confirm it deploys successfully on Vercel.

---

## Phase 2 – Database Schema
9. **Users table** – Define the `profiles` table extending Supabase auth (id, display_name, avatar_url, created_at).
10. **Events table** – Create the `events` table (id, organiser_id, title, description, type, date, alcohol_friendly, share_token, created_at).
11. **Poll questions table** – Create `poll_questions` (id, event_id, question_text, question_type, created_at).
12. **Poll options table** – Create `poll_options` (id, question_id, option_text, created_at).
13. **Poll votes table** – Create `poll_votes` (id, option_id, user_id, created_at) with unique constraint per user per question.
14. **RSVPs table** – Create `rsvps` (id, event_id, user_id, status enum yes/no/maybe, drinking_preference enum yes/no/maybe, created_at).
15. **Event stops table** – Create `event_stops` (id, event_id, place_id, name, address, lat, lng, order, created_at) for map route stops.
16. **Memories table** – Create `memories` (id, event_id, uploader_id, storage_path, media_type, caption, created_at).
17. **Row-level security policies** – Apply RLS policies so users can only read events they belong to and write their own rows.
18. **Supabase TypeScript types** – Generate and commit the typed Supabase client using `supabase gen types typescript`.

---

## Phase 3 – Authentication
19. **Supabase auth client** – Create `/lib/supabase/client.ts` and `/lib/supabase/server.ts` helpers for browser and server components.
20. **Auth middleware** – Add Next.js middleware to refresh the Supabase session cookie on every request.
21. **Sign-in page UI** – Build `/app/auth/sign-in/page.tsx` with email/password and Google OAuth buttons using shadcn/ui.
22. **Microsoft SSO button** – Add Microsoft OAuth provider to the sign-in page (note: requires manual Azure app registration).
23. **Auth callback route** – Create `/app/auth/callback/route.ts` to handle OAuth redirects and exchange the code for a session.
24. **Sign-out action** – Implement a server action that signs the user out and redirects to `/auth/sign-in`.
25. **Auth redirect guard** – Protect all routes under `/dashboard` and `/events` so unauthenticated users are redirected to sign-in.
26. **Profile auto-creation** – Add a Supabase database trigger to insert a row in `profiles` when a new auth user is created.

---

## Phase 4 – Layout & Navigation
27. **Root layout** – Build the root `layout.tsx` with HTML shell, font loading, TanStack Query provider, and Supabase session context.
28. **App shell component** – Create a shared `<AppShell>` component with a top nav bar (logo, avatar, sign-out) and bottom mobile nav.
29. **Mobile-first nav bar** – Implement a responsive bottom navigation bar with icons for Dashboard, Create, and Profile.
30. **Loading skeleton** – Create a reusable `<Skeleton>` loading component for all data-fetching states.
31. **Error boundary** – Add a global error boundary page (`error.tsx`) and a not-found page (`not-found.tsx`).

---

## Phase 5 – Dashboard
32. **Dashboard page** – Build `/app/dashboard/page.tsx` as a server component that fetches the user's events from Supabase.
33. **Event card component** – Create `<EventCard>` showing event title, date, type icon, RSVP count, and alcohol indicator.
34. **Empty state** – Display a friendly empty state with a "Create your first Doo" call-to-action when the user has no events.
35. **Dashboard loading state** – Add Suspense with skeleton cards while events are loading.

---

## Phase 6 – Event Creation
36. **Create event page** – Build `/app/events/create/page.tsx` with a multi-step form shell.
37. **Step 1 – Basic details form** – Implement fields for event title, description, date/time (UK timezone), and event type selector.
38. **Event type selector** – Build a visual picker for event types (night out, lunch, coffee, team-building, etc.) with icons.
39. **Alcohol toggle** – Add a toggle input for `alcohol_friendly` with a clear icon indicator.
40. **Step 2 – Poll builder** – Allow the organiser to add poll questions (e.g. "Which venue?") and multiple options per question.
41. **Step 3 – Map stop picker** – Embed Google Maps to search and add venue stops to the event route.
42. **Create event server action** – Write the server action that inserts event, poll questions, poll options, and stops in a single transaction.
43. **Post-creation redirect** – On success, redirect to the new event page and show a success toast.

---

## Phase 7 – Event Detail Page
44. **Event detail page shell** – Build `/app/events/[id]/page.tsx` as a server component fetching event, organiser, RSVPs, and stops.
45. **Event header component** – Display event title, date, type, organiser avatar, and alcohol indicator at the top.
46. **RSVP summary strip** – Show a compact count of Yes / No / Maybe responses with avatars.
47. **Poll section component** – Render each poll question with its options and live vote counts.
48. **Map section component** – Embed a Google Maps view showing all stops connected by a route polyline.
49. **Memory Box preview** – Show the most recent 4 memory thumbnails with a "View all" link.
50. **Share button** – Add a "Share" button that copies the shareable event link to the clipboard.

---

## Phase 8 – Polls
51. **Vote server action** – Write a server action (upsert) so a user can cast or change their vote on a poll option.
52. **Live vote counts** – Use Supabase Realtime to update vote counts in the poll section without a page refresh.
53. **Poll option bar chart** – Display a visual percentage bar under each option showing vote distribution.
54. **Vote confirmation toast** – Show a brief toast notification when a vote is successfully submitted.

---

## Phase 9 – RSVP
55. **RSVP page** – Build `/app/events/[id]/rsvp/page.tsx` with Yes / No / Maybe buttons and a drinking preference selector.
56. **RSVP server action** – Write a server action (upsert) to save or update the user's RSVP and drinking preference.
57. **RSVP confirmation UI** – Show the user their current RSVP status on the event page with an option to change it.
58. **Attendee list component** – Display a list of attendees grouped by RSVP status.

---

## Phase 10 – Google Maps Integration
59. **Load Google Maps script** – Add the Google Maps JavaScript API script to the layout with the API key from env.
60. **Place search component** – Build an autocomplete input using the Places API for searching venues.
61. **Map stop list** – Show an ordered, draggable list of stops added to the event.
62. **Route polyline** – Draw a Google Maps Directions API route connecting all stops in order.
63. **Stop info window** – Display stop name and address in a Maps info window on marker click.

---

## Phase 11 – Memory Box
64. **Memory Box page** – Build `/app/events/[id]/memory-box/page.tsx` with a grid of uploaded photos and videos.
65. **Upload component** – Build a drag-and-drop / tap-to-upload component that accepts images and videos.
66. **Supabase Storage upload action** – Write a server action to upload the file to Supabase Storage and insert a row in `memories`.
67. **Media display component** – Render image thumbnails and play-in-place video for each memory.
68. **Caption input** – Allow the uploader to add an optional caption before submitting.
69. **Delete memory action** – Allow the uploader or event organiser to delete a memory.

---

## Phase 12 – Sharing & Rich Previews
70. **Shareable event link** – Generate a unique `share_token` on event creation and expose `/e/[token]` as a public route.
71. **Public event preview page** – Build `/app/e/[token]/page.tsx` that shows a read-only event card (no auth required).
72. **Open Graph meta tags** – Add dynamic OG title, description, and image meta tags to the event detail and public preview pages.
73. **OG image generation** – Use Next.js `ImageResponse` to generate a branded event card image for link previews.
74. **"Post to Teams/Slack" deep link** – Build a "Share to Teams" button using the Teams deep-link URL scheme.
75. **Copy link button** – Implement a one-click "Copy link" that copies the shareable URL and shows a confirmation toast.

---

## Phase 13 – Recommendations
76. **Recommended nearby places** – Use the Google Places Nearby Search API to fetch activity suggestions near the event's first stop.
77. **Suggestions component** – Display up to 5 suggestions as tappable cards with name, rating, and type.
78. **Add suggestion to stops** – Allow the organiser to add a recommended place as a new event stop with one tap.

---

## Phase 14 – Social Sharing
79. **Social share buttons** – Add LinkedIn, Instagram, and Facebook share buttons to the Memory Box and event pages.
80. **Share intent URL builder** – Build a utility that constructs native share URLs with the event deep link and a memory teaser text.
81. **Web Share API fallback** – Use the browser Web Share API on mobile when available, falling back to link-copy.

---

## Phase 15 – PWA & Performance
82. **PWA manifest** – Add `manifest.json` with app name, icons, theme colour, and `display: standalone`.
83. **Service worker** – Configure next-pwa to cache the app shell and static assets for offline resilience.
84. **App icons** – Create and add all required PWA icon sizes (192×192, 512×512, maskable).
85. **Lighthouse audit** – Run a Lighthouse audit and fix any PWA, accessibility, or performance issues above severity medium.

---

## Phase 16 – Polish & Testing
86. **Form validation** – Add Zod schemas and error messages to all forms (create event, RSVP, upload).
87. **Toast notification system** – Integrate a toast library (sonner) and connect it to all server action responses.
88. **Responsive design pass** – Review every page on mobile (375 px) and desktop (1280 px) and fix layout issues.
89. **Accessibility audit** – Add ARIA labels, keyboard navigation, and focus management to interactive components.
90. **British English copy pass** – Review all user-facing strings and correct spelling, phrasing, and date formats to British English.
91. **Loading & error states** – Ensure every async operation has a visible loading indicator and a graceful error state.
92. **Unit tests – server actions** – Write Jest tests for the core server actions (create event, RSVP, vote).
93. **Integration smoke test** – Write a Playwright test covering the full flow: sign in → create event → RSVP → upload memory → share.

---

## Phase 17 – Launch Prep
94. **Set production environment variables** – Confirm all env vars (Supabase, Google Maps, app URL) are set in Vercel production.
95. **Custom domain** – Configure `doos.app` (or agreed domain) in Vercel and Supabase allowed URLs.
96. **Supabase production database** – Switch Supabase project to the production plan and run all migrations.
97. **Final Vercel deployment** – Trigger a production deploy and verify the live URL loads without errors.
98. **Smoke test on production** – Manually test the golden path (sign in, create event, RSVP, share) on the live domain.
99. **Seed test event** – Create one real test event with the team to validate the end-to-end experience before wider launch.
