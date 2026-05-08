interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSyncStart: () => void
  isSyncing: boolean
}

export function SettingsModal({ isOpen, onClose, onSyncStart, isSyncing }: SettingsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">設定</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
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
            disabled={isSyncing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-blue-400 text-white py-2 rounded text-sm font-medium flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                </svg>
                同期中...
              </>
            ) : (
              'Steamライブラリ同期'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
