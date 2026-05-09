import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

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

interface GameDetailModalProps {
  game: GameWithPlatformsAndTags | null
  onClose: () => void
  onTagsChanged: () => void
  onStatusChanged: () => void
  displayTitle: string
  showJaTitle: boolean
}

type Status = 'unplayed' | 'playing' | 'completed' | 'abandoned'

const STATUS_OPTIONS: { value: Status; label: string; color: string; active: string }[] = [
  { value: 'unplayed', label: '未プレイ', color: 'text-gray-400 border-gray-600', active: 'bg-gray-600 border-gray-500 text-white' },
  { value: 'playing', label: 'プレイ中', color: 'text-blue-400 border-blue-800', active: 'bg-blue-600 border-blue-500 text-white' },
  { value: 'completed', label: 'クリア済み', color: 'text-green-400 border-green-800', active: 'bg-green-600 border-green-500 text-white' },
  { value: 'abandoned', label: '断念', color: 'text-red-400 border-red-800', active: 'bg-red-600 border-red-500 text-white' },
]

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export function GameDetailModal({ game, onClose, onTagsChanged, onStatusChanged, displayTitle, showJaTitle }: GameDetailModalProps) {
  const [tagInput, setTagInput] = useState('')
  const [allTags, setAllTags] = useState<Tag[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!game) return
    supabase.from('tags').select('*').order('name').then(({ data }) => {
      setAllTags(data ?? [])
    })
    setTagInput('')
  }, [game?.id])

  if (!game) return null

  const steamEntry = game.platform_entries.find((p) => p.platform === 'steam')
  const currentTagIds = new Set(game.game_tags.map((gt) => gt.tag_id))
  const currentStatus = (game.status ?? 'unplayed') as Status

  const suggestions = allTags.filter(
    (t) => !currentTagIds.has(t.id) && t.name.toLowerCase().includes(tagInput.toLowerCase()) && tagInput.length > 0
  )

  async function handleStatusChange(status: Status) {
    if (!game) return
    await supabase.from('games').update({ status }).eq('id', game.id)
    onStatusChanged()
  }

  async function addTag(name: string) {
    if (!game) return
    const trimmed = name.trim()
    if (!trimmed) return

    const { data: tag } = await supabase
      .from('tags')
      .upsert({ name: trimmed, color: '#6366f1' }, { onConflict: 'name' })
      .select('id')
      .single()

    if (!tag) return

    await supabase.from('game_tags').upsert({ game_id: game.id, tag_id: tag.id })
    setTagInput('')
    onTagsChanged()
  }

  async function removeTag(tagId: string) {
    if (!game) return
    await supabase.from('game_tags').delete().eq('game_id', game.id).eq('tag_id', tagId)
    onTagsChanged()
  }

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
            <img src={game.cover_url} alt={game.title} className="w-full h-56 object-cover" />
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
          {/* タイトル・ジャンル */}
          <div>
            <h2 className="text-white text-xl font-bold">{displayTitle}</h2>
            {showJaTitle && game.title_ja && (
              <p className="text-gray-500 text-sm">{game.title}</p>
            )}
            {game.release_year && (
              <p className="text-gray-400 text-sm mt-0.5">{game.release_year}</p>
            )}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {game.genres.map((genre) => (
                  <span key={genre} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ステータス */}
          <div>
            <p className="text-gray-500 text-xs mb-2">ステータス</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                    currentStatus === opt.value ? opt.active : opt.color + ' hover:border-gray-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* スコア */}
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

          {/* プラットフォーム */}
          <div>
            <p className="text-gray-500 text-xs mb-2">所持プラットフォーム</p>
            <div className="flex flex-wrap gap-2">
              {game.platform_entries.map((p) => (
                <span key={p.id} className="bg-gray-700 text-gray-200 text-sm px-3 py-1 rounded">
                  {p.platform}
                </span>
              ))}
            </div>
          </div>

          {/* Steam情報 */}
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

          {/* タグ */}
          <div>
            <p className="text-gray-500 text-xs mb-2">タグ</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {game.game_tags.map((gt) => (
                <span
                  key={gt.tag_id}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: gt.tags.color }}
                >
                  {gt.tags.name}
                  <button onClick={() => removeTag(gt.tag_id)} className="hover:opacity-70 leading-none">
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(tagInput) }}
                placeholder="タグを追加（Enter）"
                className="w-full bg-gray-700 text-gray-200 text-sm px-3 py-1.5 rounded outline-none focus:ring-1 focus:ring-blue-500"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-gray-700 rounded shadow-lg z-10 max-h-32 overflow-y-auto">
                  {suggestions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => addTag(t.name)}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
