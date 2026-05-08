import type { Database } from '../types/database'

type Game = Database['public']['Tables']['games']['Row']
type PlatformEntry = Database['public']['Tables']['platform_entries']['Row']

interface GameCardProps {
  game: Game
  platforms: PlatformEntry[]
  onClick: () => void
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function GameCard({ game, platforms, onClick }: GameCardProps) {
  const steamEntry = platforms.find((p) => p.platform === 'steam')

  return (
    <div
      className="bg-gray-800 rounded-lg overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
      onClick={onClick}
    >
      {game.cover_url ? (
        <img
          src={game.cover_url}
          alt={game.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
          <span className="text-gray-500 text-sm">No Image</span>
        </div>
      )}

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
          {game.title}
        </h3>

        <div className="flex flex-wrap gap-1">
          {platforms.map((p) => (
            <span
              key={p.id}
              className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded"
            >
              {p.platform}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-auto">
          {game.metacritic_score != null && (
            <span className={`text-sm font-bold ${scoreColor(game.metacritic_score)}`}>
              MC {game.metacritic_score}
            </span>
          )}
          {steamEntry?.playtime_hours != null && (
            <span className="text-gray-400 text-xs">
              {steamEntry.playtime_hours}h
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
