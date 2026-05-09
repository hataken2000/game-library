import type { Database } from '../types/database'

type Game = Database['public']['Tables']['games']['Row']
type PlatformEntry = Database['public']['Tables']['platform_entries']['Row']

interface GameListRowProps {
  game: Game
  platforms: PlatformEntry[]
  onClick: () => void
  displayTitle: string
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function GameListRow({ game, platforms, onClick, displayTitle }: GameListRowProps) {
  const steamEntry = platforms.find((p) => p.platform === 'steam')

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-700">
        {game.cover_url ? (
          <img src={game.cover_url} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-600 text-xs">?</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{displayTitle}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {platforms.map((p) => (
            <span key={p.id} className="bg-gray-700 text-gray-400 text-xs px-1.5 py-0.5 rounded">
              {p.platform}
            </span>
          ))}
          {game.genres && game.genres.length > 0 && (
            <span className="text-gray-500 text-xs truncate">{game.genres.slice(0, 2).join(' · ')}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {game.metacritic_score != null && (
          <span className={`text-sm font-bold ${scoreColor(game.metacritic_score)}`}>
            {game.metacritic_score}
          </span>
        )}
        {steamEntry?.playtime_hours != null && (
          <span className="text-gray-400 text-xs w-12 text-right">
            {steamEntry.playtime_hours}h
          </span>
        )}
      </div>
    </div>
  )
}
