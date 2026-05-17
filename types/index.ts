// Shared TypeScript types – populated as features are built

// ── Database row types ────────────────────────────────────────────────────────

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
