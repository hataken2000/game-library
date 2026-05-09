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
          status: string | null
          title_ja: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          igdb_id?: number | null
          title: string
          slug?: string | null
          cover_url?: string | null
          genres?: string[]
          release_year?: number | null
          metacritic_score?: number | null
          opencritic_score?: number | null
          opencritic_percent_recommended?: number | null
          status?: string | null
          title_ja?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          igdb_id?: number | null
          title?: string
          slug?: string | null
          cover_url?: string | null
          genres?: string[]
          release_year?: number | null
          metacritic_score?: number | null
          opencritic_score?: number | null
          opencritic_percent_recommended?: number | null
          status?: string | null
          title_ja?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Insert: {
          id?: string
          game_id: string
          platform: string
          platform_game_id?: string | null
          acquired_year?: number | null
          acquired_date?: string | null
          is_free?: boolean
          price_paid?: number | null
          playtime_hours?: number | null
          last_played?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          platform?: string
          platform_game_id?: string | null
          acquired_year?: number | null
          acquired_date?: string | null
          is_free?: boolean
          price_paid?: number | null
          playtime_hours?: number | null
          last_played?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'platform_entries_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          }
        ]
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
        Insert: {
          id?: string
          platform_entry_id: string
          title: string
          platform_dlc_id?: string | null
          is_owned?: boolean
          acquired_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          platform_entry_id?: string
          title?: string
          platform_dlc_id?: string | null
          is_owned?: boolean
          acquired_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'dlcs_platform_entry_id_fkey'
            columns: ['platform_entry_id']
            isOneToOne: false
            referencedRelation: 'platform_entries'
            referencedColumns: ['id']
          }
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: []
      }
      game_tags: {
        Row: {
          game_id: string
          tag_id: string
        }
        Insert: {
          game_id: string
          tag_id: string
        }
        Update: {
          game_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'game_tags_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'game_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
