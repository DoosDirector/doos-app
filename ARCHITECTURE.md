# Doo's - Architecture & Tech Stack

## Stack (chosen for speed, low cost, great Claude compatibility)
- Framework: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Database & Auth: Supabase (PostgreSQL + Auth + Storage + Realtime)
- Maps: Google Maps JavaScript API + Places API
- State management: TanStack Query + Zustand (minimal)
- Deployment: Vercel
- PWA: Next.js PWA support (installable on phones)
- Storage: Supabase Storage (Memory Box images/videos)
- Icons: Lucide React

## Folder Structure (we will follow exactly)

/app
/dashboard
/events/[id]
/edit
/rsvp
/memory-box
/components
/lib/supabase
/types

# Key Rules
- Keep every file <400 lines
- Use server components wherever possible
- Never over-engineer – YAGNI
- All dates in UTC + display in user timezone