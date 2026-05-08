import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import { syncSteamLibrary } from './lib/steam'
import { GameCard } from './components/GameCard'
import { FilterBar } from './components/FilterBar'
import { SettingsModal } from './components/SettingsModal'
import type { Database } from './types/database'

type Game = Database['public']['Tables']['games']['Row']
type PlatformEntry = Database['public']['Tables']['platform_entries']['Row']

type GameWithPlatforms = Game & { platform_entries: PlatformEntry[] }

export default function App() {
  const [games, setGames] = useState<GameWithPlatforms[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('All')
  const [sortBy, setSortBy] = useState('title')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  async function fetchGames() {
    setLoading(true)
    const { data } = await supabase
      .from('games')
      .select('*, platform_entries(*)')
      .order('title')
    setGames((data as GameWithPlatforms[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchGames()
  }, [])

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
  }, [games, searchQuery, selectedPlatform, sortBy])

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Game Library</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="bg-gray-700 hover:bg-gray-600 text-sm px-4 py-2 rounded"
        >
          設定
        </button>
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                platforms={game.platform_entries}
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
      />
    </div>
  )
}
