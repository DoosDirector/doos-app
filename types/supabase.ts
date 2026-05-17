// AUTO-EQUIVALENT: manually authored from migrations 000001–000009.
// Regenerate against the live DB once credentials are set:
//   npx supabase gen types typescript --project-id <ref> > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      event_stops: {
        Row: {
          address: string | null
          created_at: string
          event_id: string
          id: string
          lat: number
          lng: number
          name: string
          order: number
          place_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          event_id: string
          id?: string
          lat: number
          lng: number
          name: string
          order?: number
          place_id?: string | null
        }
        Update: {
          address?: string | null
          lat?: number
          lng?: number
          name?: string
          order?: number
          place_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_stops_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          alcohol_friendly: boolean
          created_at: string
          date: string | null
          description: string | null
          id: string
          organiser_id: string
          share_token: string
          title: string
          type: Database["public"]["Enums"]["event_type"]
        }
        Insert: {
          alcohol_friendly?: boolean
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organiser_id: string
          share_token?: string
          title: string
          type?: Database["public"]["Enums"]["event_type"]
        }
        Update: {
          alcohol_friendly?: boolean
          date?: string | null
          description?: string | null
          share_token?: string
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "events_organiser_id_fkey"
            columns: ["organiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          storage_path: string
          uploader_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          storage_path: string
          uploader_id: string
        }
        Update: {
          caption?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          question_id: string
        }
        Update: {
          option_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_questions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "poll_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          question_id: string
          user_id: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: "poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "poll_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string
          drinking_preference: Database["public"]["Enums"]["drinking_preference"]
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          drinking_preference?: Database["public"]["Enums"]["drinking_preference"]
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Update: {
          drinking_preference?: Database["public"]["Enums"]["drinking_preference"]
          status?: Database["public"]["Enums"]["rsvp_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_event_member: {
        Args: { p_event_id: string }
        Returns: boolean
      }
    }
    Enums: {
      drinking_preference: "yes" | "no" | "maybe"
      event_type: "night_out" | "lunch" | "coffee" | "team_building" | "activity" | "other"
      media_type: "image" | "video"
      question_type: "venue" | "date" | "activity" | "other"
      rsvp_status: "yes" | "no" | "maybe"
    }
    CompositeTypes: Record<string, never>
  }
}

// ── Convenience type helpers (mirrors supabase-js conventions) ────────────────

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T]
