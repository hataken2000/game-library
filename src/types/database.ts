export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          igdb_id: number | null
          title: string
          slug: string | null
          cover_url: string | null
          genres: string[]
          release_year: number | null
          metacritic_score: number | null
          opencritic_score: number | null
          opencritic_percent_recommended: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['games']['Insert']>
      }
      platform_entries: {
        Row: {
          id: string
          game_id: string
          platform: string
          platform_game_id: string | null
          acquired_year: number | null
          acquired_date: string | null
          is_free: boolean
          price_paid: number | null
          playtime_hours: number | null
          last_played: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['platform_entries']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['platform_entries']['Insert']>
      }
      dlcs: {
        Row: {
          id: string
          platform_entry_id: string
          title: string
          platform_dlc_id: string | null
          is_owned: boolean
          acquired_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['dlcs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['dlcs']['Insert']>
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tags']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tags']['Insert']>
      }
      game_tags: {
        Row: {
          game_id: string
          tag_id: string
        }
        Insert: Database['public']['Tables']['game_tags']['Row']
        Update: Partial<Database['public']['Tables']['game_tags']['Row']>
      }
    }
  }
}
