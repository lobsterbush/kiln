import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom'
import { Flame, Menu, X } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { ErrorBoundary } from './ErrorBoundary'

export function Layout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-gradient-to-br from-kiln-400 to-kiln-600 rounded-lg shadow-sm group-hover:shadow-md group-hover:shadow-kiln-200 transition-all">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-kiln-600 transition-colors">Kiln</span>
          </Link>
          <nav className="flex items-center gap-5">
            <a
              href={`${import.meta.env.BASE_URL}#how-it-works`}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
            >
              How it works
            </a>
            <a
              href={`${import.meta.env.BASE_URL}#features`}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors hidden sm:block"
            >
              Features
            </a>
            <NavLink
              to="/pedagogy"
              className={({ isActive }) =>
                `text-sm transition-colors hidden sm:block ${
                  isActive ? 'text-kiln-600 font-medium' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              Pedagogy
            </NavLink>
            {!loading && (
              <Link
                to="/instructor"
                className="text-sm font-medium px-4 py-2 bg-kiln-50 text-kiln-700 rounded-xl hover:bg-kiln-100 transition-colors hidden sm:block"
              >
                {user ? 'Dashboard' : 'Instructor Sign In'}
              </Link>
            )}
            {/* Mobile: hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="sm:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </nav>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200/60 bg-white/95 backdrop-blur-md px-4 py-4 flex flex-col gap-1 animate-fade-in">
            <a
              href={`${import.meta.env.BASE_URL}#how-it-works`}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            >
              How it works
            </a>
            <a
              href={`${import.meta.env.BASE_URL}#features`}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Features
            </a>
            <NavLink
              to="/pedagogy"
              className={({ isActive }) =>
                `px-3 py-2.5 text-sm rounded-xl transition-colors ${
                  isActive ? 'text-kiln-600 font-medium bg-kiln-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Pedagogy
            </NavLink>
            {!loading && (
              <Link
                to="/instructor"
                className="mt-1 px-3 py-2.5 text-sm font-semibold text-kiln-700 bg-kiln-50 rounded-xl hover:bg-kiln-100 transition-colors"
              >
                {user ? 'Dashboard' : 'Instructor Sign In'}
              </Link>
            )}
          </div>
        )}
      </header>
      <main className={`flex-1 w-full${isHome ? '' : ' max-w-5xl mx-auto px-4 py-8'}`}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-slate-200/60 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© 2026 Kiln · <em>Where thinking hardens</em></p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link
              to="/feedback"
              className="hover:text-kiln-600 transition-colors"
            >
              Feedback
            </Link>
            <Link
              to="/pedagogy"
              className="hover:text-kiln-600 transition-colors hidden sm:block"
            >
              Pedagogy
            </Link>
            <Link
              to="/privacy"
              className="hover:text-kiln-600 transition-colors hidden sm:block"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
