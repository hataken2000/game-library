import { useEffect, useState } from 'react'

interface EnrichProgress {
  processed: number
  total: number
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSyncStart: () => void
  isSyncing: boolean
  onIgdbEnrich: (params: { twitchClientId: string; twitchClientSecret: string; refreshTitleJa?: boolean }) => void
  onOpencriticEnrich: (params: { rapidApiKey: string }) => void
  isEnriching: boolean
  enrichProgress: EnrichProgress | null
  showJaTitle: boolean
  onJaTitleToggle: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  onSyncStart,
  isSyncing,
  onIgdbEnrich,
  onOpencriticEnrich,
  isEnriching,
  enrichProgress,
  showJaTitle,
  onJaTitleToggle,
}: SettingsModalProps) {
  const [twitchClientId, setTwitchClientId] = useState('')
  const [twitchClientSecret, setTwitchClientSecret] = useState('')
  const [rapidApiKey, setRapidApiKey] = useState('')

  useEffect(() => {
    setTwitchClientId(localStorage.getItem('twitch_client_id') ?? '')
    setTwitchClientSecret(localStorage.getItem('twitch_client_secret') ?? '')
    setRapidApiKey(localStorage.getItem('rapidapi_key') ?? '')
  }, [isOpen])

  function saveAndEnrichIgdb() {
    localStorage.setItem('twitch_client_id', twitchClientId)
    localStorage.setItem('twitch_client_secret', twitchClientSecret)
    onIgdbEnrich({ twitchClientId, twitchClientSecret })
  }

  function saveAndEnrichOpencritic() {
    localStorage.setItem('rapidapi_key', rapidApiKey)
    onOpencriticEnrich({ rapidApiKey })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-semibold">設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          {/* Steam */}
          <section>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Steam</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Steam API Key</label>
                <div className="bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded font-mono">
                  {import.meta.env.VITE_STEAM_API_KEY
                    ? '••••••••' + import.meta.env.VITE_STEAM_API_KEY.slice(-4)
                    : '未設定'}
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Steam ID</label>
                <div className="bg-gray-700 text-gray-300 text-sm px-3 py-2 rounded font-mono">
                  {import.meta.env.VITE_STEAM_ID || '未設定'}
                </div>
              </div>
              <button
                onClick={onSyncStart}
                disabled={isSyncing || isEnriching}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <>
                    <SpinIcon />
                    同期中...
                  </>
                ) : (
                  'Steamライブラリ同期'
                )}
              </button>
            </div>
          </section>

          {/* IGDB */}
          <section>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">IGDB（Twitch）</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Twitch Client ID</label>
                <input
                  type="text"
                  value={twitchClientId}
                  onChange={(e) => setTwitchClientId(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Twitch Client Secret</label>
                <input
                  type="password"
                  value={twitchClientSecret}
                  onChange={(e) => setTwitchClientSecret(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={saveAndEnrichIgdb}
                disabled={isEnriching || isSyncing || !twitchClientId || !twitchClientSecret}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:text-purple-400 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                {isEnriching ? (
                  <>
                    <SpinIcon />
                    {enrichProgress
                      ? `IGDB取得中... ${enrichProgress.processed}/${enrichProgress.total}件`
                      : 'IGDB取得中...'}
                  </>
                ) : (
                  'メタデータ取得（IGDB）'
                )}
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('twitch_client_id', twitchClientId)
                  localStorage.setItem('twitch_client_secret', twitchClientSecret)
                  onIgdbEnrich({ twitchClientId, twitchClientSecret, refreshTitleJa: true })
                }}
                disabled={isEnriching || isSyncing || !twitchClientId || !twitchClientSecret}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-indigo-400 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                {isEnriching ? (
                  <>
                    <SpinIcon />
                    {enrichProgress
                      ? `日本語取得中... ${enrichProgress.processed}/${enrichProgress.total}件`
                      : '日本語取得中...'}
                  </>
                ) : '日本語タイトル再取得（IGDB）'}
              </button>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showJaTitle}
                  onChange={onJaTitleToggle}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-gray-300 text-sm">日本語タイトルで表示</span>
              </label>
            </div>
          </section>

          {/* OpenCritic */}
          <section>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">OpenCritic（RapidAPI）</h3>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">RapidAPI Key</label>
                <input
                  type="password"
                  value={rapidApiKey}
                  onChange={(e) => setRapidApiKey(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 text-gray-200 text-sm px-3 py-2 rounded font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={saveAndEnrichOpencritic}
                disabled={isEnriching || isSyncing || !rapidApiKey}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-900 disabled:text-orange-400 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
              >
                {isEnriching ? (
                  <>
                    <SpinIcon />
                    {enrichProgress
                      ? `OpenCritic取得中... ${enrichProgress.processed}/${enrichProgress.total}件`
                      : 'OpenCritic取得中...'}
                  </>
                ) : (
                  'OpenCriticスコア取得'
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function SpinIcon() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
    </svg>
  )
}
