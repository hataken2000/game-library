import type { Database } from '../types/database'

type Game = Database['public']['Tables']['games']['Row']
type PlatformEntry = Database['public']['Tables']['platform_entries']['Row']

type GameTag = {
  tag_id: string
  tags: { id: string; name: string; color: string }
}

type GameWithPlatformsAndTags = Game & {
  platform_entries: PlatformEntry[]
  game_tags: GameTag[]
}

interface StatsModalProps {
  isOpen: boolean
  onClose: () => void
  games: GameWithPlatformsAndTags[]
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-400 text-xs w-8 text-right">{value}</span>
    </div>
  )
}

export function StatsModal({ isOpen, onClose, games }: StatsModalProps) {
  if (!isOpen) return null

  const total = games.length

  // ステータス集計
  const statusCount = { unplayed: 0, playing: 0, completed: 0, abandoned: 0 }
  for (const g of games) {
    const s = (g.status ?? 'unplayed') as keyof typeof statusCount
    if (s in statusCount) statusCount[s]++
  }
  const clearRate = total > 0 ? Math.round((statusCount.completed / total) * 100) : 0
  const stackRate = total > 0 ? Math.round((statusCount.unplayed / total) * 100) : 0

  // プラットフォーム集計
  const platformCount: Record<string, number> = {}
  for (const g of games) {
    for (const pe of g.platform_entries) {
      platformCount[pe.platform] = (platformCount[pe.platform] ?? 0) + 1
    }
  }
  const sortedPlatforms = Object.entries(platformCount).sort((a, b) => b[1] - a[1])
  const maxPlatform = sortedPlatforms[0]?.[1] ?? 1

  // ジャンル集計（上位10）
  const genreCount: Record<string, number> = {}
  for (const g of games) {
    for (const genre of g.genres ?? []) {
      genreCount[genre] = (genreCount[genre] ?? 0) + 1
    }
  }
  const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxGenre = topGenres[0]?.[1] ?? 1

  // プレイ時間ランキング（上位10）
  const withPlaytime = games
    .map((g) => ({
      title: g.title,
      hours: g.platform_entries.find((e) => e.platform === 'steam')?.playtime_hours ?? 0,
    }))
    .filter((g) => g.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 10)

  const totalHours = games.reduce((acc, g) => {
    return acc + (g.platform_entries.find((e) => e.platform === 'steam')?.playtime_hours ?? 0)
  }, 0)

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-white text-lg font-semibold">統計</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-6">
          {/* 総計サマリー */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-gray-400 text-xs mt-0.5">総ゲーム数</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{totalHours.toLocaleString()}h</p>
              <p className="text-gray-400 text-xs mt-0.5">総プレイ時間</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{clearRate}%</p>
              <p className="text-gray-400 text-xs mt-0.5">クリア率</p>
            </div>
          </div>

          {/* 積みゲー率 */}
          <div className="bg-gray-700/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">積みゲー率</p>
            <p className="text-3xl font-bold text-yellow-400">{stackRate}%</p>
            <p className="text-gray-500 text-xs mt-0.5">{statusCount.unplayed}件が未プレイ</p>
          </div>

          {/* ステータス分布 */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">ステータス分布</p>
            <div className="space-y-2">
              {[
                { label: '未プレイ', count: statusCount.unplayed, color: 'bg-gray-500' },
                { label: 'プレイ中', count: statusCount.playing, color: 'bg-blue-500' },
                { label: 'クリア済み', count: statusCount.completed, color: 'bg-green-500' },
                { label: '断念', count: statusCount.abandoned, color: 'bg-red-500' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-20">{row.label}</span>
                  <div className="flex-1">
                    <Bar value={row.count} max={total} color={row.color} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* プラットフォーム別 */}
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">プラットフォーム別</p>
            <div className="space-y-2">
              {sortedPlatforms.map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-20 capitalize">{platform}</span>
                  <div className="flex-1">
                    <Bar value={count} max={maxPlatform} color="bg-indigo-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ジャンル分布 */}
          {topGenres.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">ジャンル（上位10）</p>
              <div className="space-y-2">
                {topGenres.map(([genre, count]) => (
                  <div key={genre} className="flex items-center gap-3">
                    <span className="text-gray-300 text-xs w-28 truncate">{genre}</span>
                    <div className="flex-1">
                      <Bar value={count} max={maxGenre} color="bg-purple-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* プレイ時間ランキング */}
          {withPlaytime.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">プレイ時間 Top10</p>
              <div className="space-y-1.5">
                {withPlaytime.map((g, i) => (
                  <div key={g.title} className="flex items-center gap-3">
                    <span className="text-gray-600 text-xs w-4">{i + 1}</span>
                    <span className="text-gray-200 text-sm flex-1 truncate">{g.title}</span>
                    <span className="text-blue-400 text-sm font-medium">{g.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
