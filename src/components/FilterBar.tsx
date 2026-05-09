interface TagOption {
  id: string
  name: string
  color: string
}

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedPlatform: string
  onPlatformChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  tags: TagOption[]
  selectedTags: string[]
  onTagToggle: (tagId: string) => void
  selectedStatus: string
  onStatusChange: (value: string) => void
}

const PLATFORMS = ['All', 'Steam', 'Epic', 'GOG', 'Battle.net']
const STATUS_OPTIONS = [
  { value: 'All', label: 'すべて' },
  { value: 'unplayed', label: '未プレイ' },
  { value: 'playing', label: 'プレイ中' },
  { value: 'completed', label: 'クリア済み' },
  { value: 'abandoned', label: '断念' },
]
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
  tags,
  selectedTags,
  onTagToggle,
  selectedStatus,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
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
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
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

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onTagToggle(tag.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'text-white border-transparent'
                  : 'text-gray-400 border-gray-600 hover:border-gray-400'
              }`}
              style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
