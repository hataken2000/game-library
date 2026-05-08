import type { Database } from '../types/database'

type Game = Database['public']['Tables']['games']['Row']
type PlatformEntry = Database['public']['Tables']['platform_entries']['Row']

type GameWithPlatforms = Game & { platform_entries: PlatformEntry[] }

interface GameDetailModalProps {
  game: GameWithPlatforms | null
  onClose: () => void
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function GameDetailModal({ game, onClose }: GameDetailModalProps) {
  if (!game) return null

  const steamEntry = game.platform_entries.find((p) => p.platform === 'steam')

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl overflow-hidden w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {game.cover_url ? (
            <img
              src={game.cover_url}
              alt={game.title}
              className="w-full h-56 object-cover"
            />
          ) : (
            <div className="w-full h-56 bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <div>
            <h2 className="text-white text-xl font-bold">{game.title}</h2>
            {game.release_year && (
              <p className="text-gray-400 text-sm mt-0.5">{game.release_year}</p>
            )}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {game.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-6">
            {game.metacritic_score != null && (
              <div>
                <p className="text-gray-500 text-xs mb-0.5">IGDB Score</p>
                <p className={`text-2xl font-bold ${scoreColor(game.metacritic_score)}`}>
                  {game.metacritic_score}
                </p>
              </div>
            )}
            {game.opencritic_score != null && (
              <div>
                <p className="text-gray-500 text-xs mb-0.5">OpenCritic</p>
                <p className={`text-2xl font-bold ${scoreColor(game.opencritic_score)}`}>
                  {Math.round(game.opencritic_score)}
                </p>
                {game.opencritic_percent_recommended != null && (
                  <p className="text-gray-400 text-xs">
                    {Math.round(game.opencritic_percent_recommended)}% 推奨
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-gray-500 text-xs mb-2">所持プラットフォーム</p>
            <div className="flex flex-wrap gap-2">
              {game.platform_entries.map((p) => (
                <span
                  key={p.id}
                  className="bg-gray-700 text-gray-200 text-sm px-3 py-1 rounded"
                >
                  {p.platform}
                </span>
              ))}
            </div>
          </div>

          {steamEntry && (
            <div className="flex gap-6">
              {steamEntry.playtime_hours != null && (
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">プレイ時間</p>
                  <p className="text-white text-lg font-semibold">{steamEntry.playtime_hours}h</p>
                </div>
              )}
              {steamEntry.last_played && (
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">最終プレイ</p>
                  <p className="text-white text-sm">{String(steamEntry.last_played)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
