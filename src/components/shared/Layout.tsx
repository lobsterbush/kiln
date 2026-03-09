import { Outlet, Link } from 'react-router-dom'
import { Flame } from 'lucide-react'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-900 hover:text-orange-600 transition-colors">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-bold tracking-tight">Kiln</span>
          </Link>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
