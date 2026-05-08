interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedPlatform: string
  onPlatformChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
}

const PLATFORMS = ['All', 'Steam', 'Epic', 'GOG', 'Battle.net']
const SORT_OPTIONS = [
  { value: 'title', label: 'タイトル順' },
  { value: 'metacritic', label: 'メタスコア順' },
  { value: 'playtime', label: 'プレイ時間順' },
]

export function FilterBar({
  searchQuery,
  onSearchChange,
  selectedPlatform,
  onPlatformChange,
  sortBy,
  onSortChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="ゲームを検索..."
        className="bg-gray-800 text-white placeholder-gray-500 border border-gray-700 rounded px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:border-gray-500"
      />

      <select
        value={selectedPlatform}
        onChange={(e) => onPlatformChange(e.target.value)}
        className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
