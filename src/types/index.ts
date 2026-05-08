export type Platform = 'steam' | 'epic' | 'gog' | 'battlenet' | 'other'

export interface Game {
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
  platform_entries?: PlatformEntry[]
  tags?: Tag[]
}

export interface PlatformEntry {
  id: string
  game_id: string
  platform: Platform
  platform_game_id: string | null
  acquired_year: number | null
  acquired_date: string | null
  is_free: boolean
  price_paid: number | null
  playtime_hours: number | null
  last_played: string | null
  created_at: string
  dlcs?: Dlc[]
}

export interface Dlc {
  id: string
  platform_entry_id: string
  title: string
  platform_dlc_id: string | null
  is_owned: boolean
  acquired_date: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  color: string
  created_at: string
}
