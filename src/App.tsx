import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { I18nProvider } from './lib/i18n'  // Component-only export
import { Layout } from './components/shared/Layout'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { ReloadPrompt } from './components/shared/ReloadPrompt'
import { Home } from './pages/Home'
import { Join } from './pages/Join'

// Lazy-load page bundles to shrink the initial JS chunk.
// Student pages and instructor pages load independently.
const StudentSession = lazy(() => import('./pages/StudentSession').then(m => ({ default: m.StudentSession })))
const StudentSummary = lazy(() => import('./pages/StudentSummary').then(m => ({ default: m.StudentSummary })))
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard').then(m => ({ default: m.InstructorDashboard })))
const CreateActivity = lazy(() => import('./pages/CreateActivity').then(m => ({ default: m.CreateActivity })))
const InstructorSession = lazy(() => import('./pages/InstructorSession').then(m => ({ default: m.InstructorSession })))
const Results = lazy(() => import('./pages/Results').then(m => ({ default: m.Results })))
const EditActivity = lazy(() => import('./pages/EditActivity').then(m => ({ default: m.EditActivity })))
const ProjectorView = lazy(() => import('./pages/ProjectorView').then(m => ({ default: m.ProjectorView })))
const Pedagogy = lazy(() => import('./pages/Pedagogy').then(m => ({ default: m.Pedagogy })))
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })))
const Feedback = lazy(() => import('./pages/Feedback').then(m => ({ default: m.Feedback })))
const Templates = lazy(() => import('./pages/Templates').then(m => ({ default: m.Templates })))
const Demo = lazy(() => import('./pages/Demo').then(m => ({ default: m.Demo })))
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })))

function PageSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[40vh]">
      <div className="w-6 h-6 border-2 border-kiln-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
      <p className="text-6xl font-extrabold text-slate-200">404</p>
      <h1 className="text-xl font-bold text-slate-800">Page not found</h1>
      <a href="/" className="text-sm text-kiln-600 hover:underline">Back to home</a>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
    <AuthProvider>
      <ReloadPrompt />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<Join />} />
            <Route path="/session/:id" element={<StudentSession />} />
            <Route path="/session/:id/summary" element={<StudentSummary />} />
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/instructor/create" element={<CreateActivity />} />
            <Route path="/instructor/session/:id" element={<InstructorSession />} />
            <Route path="/instructor/results/:id" element={<Results />} />
            <Route path="/instructor/edit/:id" element={<EditActivity />} />
            <Route path="/instructor/templates" element={<Templates />} />
            <Route path="/instructor/analytics" element={<Analytics />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/pedagogy" element={<Pedagogy />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Full-screen projector view — no Layout wrapper, needs its own ErrorBoundary */}
          <Route path="/instructor/session/:id/display" element={<ErrorBoundary><ProjectorView /></ErrorBoundary>} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </I18nProvider>
  )
}
