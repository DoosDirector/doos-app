// Shared TypeScript types – populated as features are built

// ── Enums ─────────────────────────────────────────────────────────────────────

export type EventType =
  | "night_out"
  | "lunch"
  | "coffee"
  | "team_building"
  | "activity"
  | "other"

export type QuestionType = "venue" | "date" | "activity" | "other"

export type RsvpStatus = "yes" | "no" | "maybe"

export type DrinkingPreference = "yes" | "no" | "maybe"

// ── Database row types ────────────────────────────────────────────────────────

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export type Event = {
  id: string
  organiser_id: string
  title: string
  description: string | null
  type: EventType
  date: string | null
  alcohol_friendly: boolean
  share_token: string
  created_at: string
}

export type PollQuestion = {
  id: string
  event_id: string
  question_text: string
  question_type: QuestionType
  created_at: string
}

export type PollOption = {
  id: string
  question_id: string
  option_text: string
  created_at: string
}

export type PollVote = {
  id: string
  option_id: string
  question_id: string
  user_id: string
  created_at: string
}

export type Rsvp = {
  id: string
  event_id: string
  user_id: string
  status: RsvpStatus
  drinking_preference: DrinkingPreference
  created_at: string
}

export type EventStop = {
  id: string
  event_id: string
  place_id: string | null
  name: string
  address: string | null
  lat: number
  lng: number
  order: number
  created_at: string
}

// ── Supabase Database schema (extends as tables are added) ────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at"> & { created_at?: string }
        Update: Partial<Omit<Profile, "id">>
      }
      events: {
        Row: Event
        Insert: Omit<Event, "id" | "share_token" | "created_at"> & {
          id?: string
          share_token?: string
          created_at?: string
        }
        Update: Partial<Omit<Event, "id" | "created_at">>
      }
      poll_questions: {
        Row: PollQuestion
        Insert: Omit<PollQuestion, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PollQuestion, "id" | "event_id" | "created_at">>
      }
      poll_options: {
        Row: PollOption
        Insert: Omit<PollOption, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<PollOption, "id" | "question_id" | "created_at">>
      }
      poll_votes: {
        Row: PollVote
        Insert: Omit<PollVote, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: never
      }
      rsvps: {
        Row: Rsvp
        Insert: Omit<Rsvp, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Pick<Rsvp, "status" | "drinking_preference">>
      }
      event_stops: {
        Row: EventStop
        Insert: Omit<EventStop, "id" | "created_at"> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Omit<EventStop, "id" | "event_id" | "created_at">>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      event_type: EventType
      question_type: QuestionType
      rsvp_status: RsvpStatus
      drinking_preference: DrinkingPreference
    }
  }
}
