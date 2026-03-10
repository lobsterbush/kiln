import { Outlet, Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { ErrorBoundary } from './ErrorBoundary'

export function Layout() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-gradient-to-br from-kiln-400 to-kiln-600 rounded-lg shadow-sm group-hover:shadow-md group-hover:shadow-kiln-200 transition-all">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-kiln-600 transition-colors">Kiln</span>
          </Link>
          <nav className="flex items-center gap-5">
            <a
              href={`${import.meta.env.BASE_URL}#pricing`}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
            >
              Pricing
            </a>
            {!loading && (
              <Link
                to="/instructor"
                className="text-sm font-medium px-4 py-2 bg-kiln-50 text-kiln-700 rounded-xl hover:bg-kiln-100 transition-colors"
              >
                {user ? 'Dashboard' : 'Instructor Sign In'}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-slate-200/60 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">Kiln — Where thinking hardens</p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <a
              href="mailto:charles.crabtree@monash.edu?subject=Kiln Support"
              className="hover:text-kiln-600 transition-colors"
            >
              Support
            </a>
            <a
              href={`${import.meta.env.BASE_URL}#pricing`}
              className="hover:text-kiln-600 transition-colors hidden sm:block"
            >
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
