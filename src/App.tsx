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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/join" element={<Join />} />
            <Route path="/session/:id" element={<StudentSession />} />
            <Route path="/instructor" element={<InstructorDashboard />} />
            <Route path="/instructor/create" element={<CreateActivity />} />
            <Route path="/instructor/session/:id" element={<InstructorSession />} />
            <Route path="/instructor/results/:id" element={<Results />} />
            <Route path="/instructor/edit/:id" element={<EditActivity />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
