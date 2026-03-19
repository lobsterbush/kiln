import { useState } from 'react'
import { Outlet, Link, useLocation, NavLink } from 'react-router-dom'
import { Flame, Menu, X, Globe } from 'lucide-react'
import { useAuth } from '../../lib/auth'
import { useTranslation, LOCALES } from '../../lib/i18n-constants'
import type { Locale } from '../../lib/i18n-constants'
import { ErrorBoundary } from './ErrorBoundary'

export function Layout() {
  const { user, loading } = useAuth()
  const { locale, setLocale, t } = useTranslation()
  const location = useLocation()
  const isHome = location.pathname === '/'
  // Reset mobile menu on route change by keying on pathname
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState(location.pathname)
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname)
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Skip to main content — WCAG 2.1 AA keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-kiln-600 focus:text-white focus:rounded-xl focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        {t('nav.skipToMain')}
      </a>
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 pt-safe" role="banner">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Kiln home">
            <div className="p-1.5 bg-gradient-to-br from-kiln-400 to-kiln-600 rounded-lg shadow-sm group-hover:shadow-md group-hover:shadow-kiln-200 transition-all">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-kiln-600 transition-colors">Kiln</span>
          </Link>
          <nav className="flex items-center gap-5" aria-label="Main navigation">
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
      <main id="main-content" className={`flex-1 w-full${isHome ? '' : ' max-w-5xl mx-auto px-4 py-8'}`} role="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <footer className="border-t border-slate-200/60 bg-white py-6 pb-safe" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">{t('common.copyright')}</p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link to="/feedback" className="hover:text-kiln-600 transition-colors">
              {t('common.feedback')}
            </Link>
            <Link to="/pedagogy" className="hover:text-kiln-600 transition-colors hidden sm:block">
              {t('nav.pedagogy')}
            </Link>
            <Link to="/privacy" className="hover:text-kiln-600 transition-colors hidden sm:block">
              {t('common.privacy')}
            </Link>
            {/* Language switcher */}
            <div className="relative flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="bg-transparent text-xs text-slate-400 hover:text-slate-600 cursor-pointer border-none outline-none appearance-none pr-3"
                aria-label="Language"
              >
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>{l.nativeLabel}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
