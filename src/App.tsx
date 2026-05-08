import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { syncSteamLibrary } from './lib/steam'
import { GameCard } from './components/GameCard'
import { GameListRow } from './components/GameListRow'
import { FilterBar } from './components/FilterBar'
import { SettingsModal } from './components/SettingsModal'
import { GameDetailModal } from './components/GameDetailModal'
import { ImportModal } from './components/ImportModal'
import type { Database } from './types/database'

type Game = Database['public']['Tables']['games']['Row']
type PlatformEntry = Database['public']['Tables']['platform_entries']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

type GameTag = {
  tag_id: string
  tags: { id: string; name: string; color: string }
}

type GameWithPlatformsAndTags = Game & {
  platform_entries: PlatformEntry[]
  game_tags: GameTag[]
}

interface EnrichProgress {
  processed: number
  total: number
}

export default function App() {
  const [games, setGames] = useState<GameWithPlatformsAndTags[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('All')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('title')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState<EnrichProgress | null>(null)
  const [selectedGame, setSelectedGame] = useState<GameWithPlatformsAndTags | null>(null)

  async function fetchGames() {
    setLoading(true)
    const { data } = await supabase
      .from('games')
      .select('*, platform_entries(*), game_tags(tag_id, tags(id, name, color))')
      .order('title')
    setGames((data as GameWithPlatformsAndTags[]) ?? [])
    setLoading(false)
  }

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('*').order('name')
    setAllTags(data ?? [])
  }

  useEffect(() => {
    fetchGames()
    fetchTags()
  }, [])

  async function handleTagsChanged() {
    await fetchGames()
    await fetchTags()
    if (selectedGame) {
      setSelectedGame((prev) =>
        prev ? (games.find((g) => g.id === prev.id) ?? prev) : null
      )
    }
  }

  useEffect(() => {
    if (selectedGame) {
      const updated = games.find((g) => g.id === selectedGame.id)
      if (updated) setSelectedGame(updated)
    }
  }, [games])

  async function handleSync() {
    setIsSyncing(true)
    try {
      await syncSteamLibrary()
      await fetchGames()
    } finally {
      setIsSyncing(false)
      setSettingsOpen(false)
    }
  }

  async function handleIgdbEnrich({
    twitchClientId,
    twitchClientSecret,
  }: {
    twitchClientId: string
    twitchClientSecret: string
  }) {
    setIsEnriching(true)
    setEnrichProgress(null)

    const STORAGE_KEY = 'igdb_enrich_offset'
    const savedOffset = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10)

    try {
      let offset = savedOffset
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('igdb-enrich', {
          body: { twitchClientId, twitchClientSecret, offset, limit },
        })
        if (error) {
          alert(`IGDBエラー: ${error.message}`)
          break
        }
        if (data?.error) {
          alert(`IGDBエラー: ${data.error}`)
          break
        }

        const result = data as { processed: number; total: number; hasMore: boolean }
        if (offset === savedOffset) alert(`DEBUG: ${JSON.stringify(result)}`)
        offset += limit
        localStorage.setItem(STORAGE_KEY, String(offset))
        setEnrichProgress({ processed: offset, total: result.total })
        hasMore = result.hasMore

        if (hasMore) await new Promise((r) => setTimeout(r, 300))
      }

      localStorage.removeItem(STORAGE_KEY)
      await fetchGames()
    } finally {
      setIsEnriching(false)
      setEnrichProgress(null)
    }
  }

  async function handleOpencriticEnrich({ rapidApiKey }: { rapidApiKey: string }) {
    setIsEnriching(true)
    setEnrichProgress(null)

    try {
      let offset = 0
      const limit = 5
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('opencritic-enrich', {
          body: { rapidApiKey, offset, limit },
        })
        if (error) break

        const result = data as { processed: number; total: number; hasMore: boolean }
        setEnrichProgress({ processed: offset + result.processed, total: result.total })
        hasMore = result.hasMore
        offset += limit
      }

      await fetchGames()
    } finally {
      setIsEnriching(false)
      setEnrichProgress(null)
    }
  }

  function handleTagToggle(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const filtered = useMemo(() => {
    let list = games

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((g) => g.title.toLowerCase().includes(q))
    }

    if (selectedPlatform !== 'All') {
      const p = selectedPlatform.toLowerCase()
      list = list.filter((g) =>
        g.platform_entries.some((e) => e.platform.toLowerCase() === p)
      )
    }

    if (selectedTags.length > 0) {
      list = list.filter((g) =>
        selectedTags.every((tagId) => g.game_tags.some((gt) => gt.tag_id === tagId))
      )
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'metacritic') {
        return (b.metacritic_score ?? -1) - (a.metacritic_score ?? -1)
      }
      if (sortBy === 'playtime') {
        const aHours = a.platform_entries.find((e) => e.platform === 'steam')?.playtime_hours ?? -1
        const bHours = b.platform_entries.find((e) => e.platform === 'steam')?.playtime_hours ?? -1
        return bHours - aHours
      }
      return a.title.localeCompare(b.title)
    })
  }, [games, searchQuery, selectedPlatform, selectedTags, sortBy])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-bold">Game Library</h1>
          <span className="text-gray-500 text-xs">{__BUILD_VERSION__}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-2 rounded"
            title={viewMode === 'grid' ? 'リスト表示' : 'グリッド表示'}
          >
            {viewMode === 'grid' ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded"
          >
            インポート
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded"
          >
            設定
          </button>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="mb-6">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            sortBy={sortBy}
            onSortChange={setSortBy}
            tags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            {games.length === 0
              ? '設定からSteamライブラリを同期してください'
              : '該当するゲームが見つかりません'}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                platforms={game.platform_entries}
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-700">
            {filtered.map((game) => (
              <GameListRow
                key={game.id}
                game={game}
                platforms={game.platform_entries}
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>
        )}
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSyncStart={handleSync}
        isSyncing={isSyncing}
        onIgdbEnrich={handleIgdbEnrich}
        onOpencriticEnrich={handleOpencriticEnrich}
        isEnriching={isEnriching}
        enrichProgress={enrichProgress}
      />

      <ImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={fetchGames}
      />

      <GameDetailModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        onTagsChanged={handleTagsChanged}
      />
    </div>
  )
}
