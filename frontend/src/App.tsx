import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { authService } from './services/authService'
import MainLayout    from './components/Layout/MainLayout'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import DocumentsPage from './pages/DocumentsPage'
import ChatPage      from './pages/ChatPage'
import QuizPage      from './pages/QuizPage'
import SummaryPage   from './pages/SummaryPage'
import EntitiesPage  from './pages/EntitiesPage'
import MindMapPage   from './pages/MindMapPage'
import AdminPage     from './pages/AdminPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, setUser } = useAuthStore()
  useEffect(() => {
    if (isAuthenticated) authService.getMe().then(setUser).catch(() => {})
  }, [])

  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"             element={<DashboardPage />} />
        <Route path="documents"             element={<DocumentsPage />} />
        <Route path="chat/:documentId"      element={<ChatPage />} />
        <Route path="quiz/:documentId"      element={<QuizPage />} />
        <Route path="summary/:documentId"   element={<SummaryPage />} />
        <Route path="entities/:documentId"  element={<EntitiesPage />} />
        <Route path="mindmap/:documentId"   element={<MindMapPage />} />
        <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
