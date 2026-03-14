import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { Layout } from './components/shared/Layout'
import { Home } from './pages/Home'
import { Join } from './pages/Join'
import { StudentSession } from './pages/StudentSession'
import { InstructorDashboard } from './pages/InstructorDashboard'
import { CreateActivity } from './pages/CreateActivity'
import { InstructorSession } from './pages/InstructorSession'
import { Results } from './pages/Results'
import { EditActivity } from './pages/EditActivity'
import { Pedagogy } from './pages/Pedagogy'
import { ProjectorView } from './pages/ProjectorView'
import { StudentSummary } from './pages/StudentSummary'

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
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
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
            <Route path="/pedagogy" element={<Pedagogy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {/* Full-screen projector view — no Layout wrapper */}
          <Route path="/instructor/session/:id/display" element={<ProjectorView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
