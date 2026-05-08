import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

interface PlayniteGame {
  Id: string
  Name: string
  GameId: string
  PluginId: string
  Playtime?: number
  LastActivity?: string
  Added?: string
}

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

const PLUGIN_MAP: Record<string, string> = {
  '00000002-dbd1-46c6-b5d0-b1ba559d10e4': 'epic',
  'aebe8b7c-6dc3-4a66-af31-e7375c6d5671': 'gog',
  'e3c26a3d-d695-4cb7-a769-5ff7612c7eda': 'battlenet',
}

const STEAM_PLUGIN_ID = 'cb91dfc9-b977-43bf-8e70-55f46e410fab'

type PreviewResult = { toAdd: PlayniteGame[]; skipCount: number } | null

export function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<PreviewResult>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [imported, setImported] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  async function handleFile(file: File) {
    setPreview(null)
    setImported(null)
    const text = await file.text()
    const parsed: PlayniteGame[] = JSON.parse(text)

    const nonSteam = parsed.filter((g) => g.PluginId !== STEAM_PLUGIN_ID)

    const { data: existing } = await supabase
      .from('platform_entries')
      .select('*')
      .in('platform', ['epic', 'gog', 'battlenet', 'other'])

    const existingIds = new Set(existing?.map((e) => e.platform_game_id) ?? [])
    const toAdd = nonSteam.filter((g) => !existingIds.has(g.GameId))
    const skipCount = nonSteam.length - toAdd.length

    setPreview({ toAdd, skipCount })
  }

  async function handleImport() {
    if (!preview?.toAdd.length) return
    setIsImporting(true)

    try {
      const CHUNK = 100
      let addedCount = 0

      for (let i = 0; i < preview.toAdd.length; i += CHUNK) {
        const chunk = preview.toAdd.slice(i, i + CHUNK)

        const { data: insertedGames } = await supabase
          .from('games')
          .insert(chunk.map((g) => ({ title: g.Name, genres: [] as string[] })))
          .select('id')

        if (!insertedGames) continue

        const entries = chunk.map((g, idx) => ({
          game_id: insertedGames[idx]?.id,
          platform: PLUGIN_MAP[g.PluginId] ?? 'other',
          platform_game_id: g.GameId,
          playtime_hours: g.Playtime ? Math.round(g.Playtime / 3600) : null,
          last_played: g.LastActivity ? g.LastActivity.split('T')[0] : null,
          acquired_date: g.Added ? g.Added.split('T')[0] : null,
          is_free: false,
        })).filter((e) => e.game_id)

        await supabase.from('platform_entries').insert(entries)
        addedCount += entries.length
      }

      setImported(addedCount)
      onImportComplete()
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-semibold">Playniteインポート</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        {imported != null ? (
          <div className="text-center py-6">
            <p className="text-green-400 text-lg font-semibold">{imported}件をインポートしました</p>
            <button
              onClick={onClose}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFile(file)
              }}
              onClick={() => fileRef.current?.click()}
            >
              <p className="text-gray-400 text-sm">JSONをドロップ or クリックして選択</p>
              <p className="text-gray-600 text-xs mt-1">Playnite: ライブラリ → エクスポート</p>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
              />
            </div>

            {preview && (
              <div className="bg-gray-700 rounded p-3 text-sm">
                <p className="text-white">
                  追加: <span className="text-green-400 font-semibold">{preview.toAdd.length}件</span>
                  　スキップ: <span className="text-gray-400">{preview.skipCount}件</span>
                </p>
                <p className="text-gray-500 text-xs mt-1">Steam以外のゲームを対象</p>
              </div>
            )}

            {preview && preview.toAdd.length > 0 && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                    </svg>
                    インポート中...
                  </>
                ) : (
                  `${preview.toAdd.length}件をインポート`
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
