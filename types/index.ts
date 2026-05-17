// Re-export supabase-generated types and add app-level aliases.
// Source of truth for DB types is types/supabase.ts.

export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "./supabase"

// ── Enum aliases ──────────────────────────────────────────────────────────────

import type { Enums } from "./supabase"

export type EventType          = Enums<"event_type">
export type QuestionType       = Enums<"question_type">
export type RsvpStatus         = Enums<"rsvp_status">
export type DrinkingPreference = Enums<"drinking_preference">
export type MediaType          = Enums<"media_type">

// ── Row type aliases ──────────────────────────────────────────────────────────

import type { Tables } from "./supabase"

export type Profile      = Tables<"profiles">
export type Event        = Tables<"events">
export type PollQuestion = Tables<"poll_questions">
export type PollOption   = Tables<"poll_options">
export type PollVote     = Tables<"poll_votes">
export type Rsvp         = Tables<"rsvps">
export type EventStop    = Tables<"event_stops">
export type Memory       = Tables<"memories">
