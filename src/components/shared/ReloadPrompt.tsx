import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-slate-900 text-white pl-5 pr-3 py-3 rounded-2xl shadow-xl border border-slate-700">
        <span className="text-sm font-medium">A new version is available</span>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-1.5 bg-kiln-500 hover:bg-kiln-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  )
}
