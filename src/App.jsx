import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/RouteGuards'
import { MockModeBadge } from '@/components/MockModeBadge'
import { AuthProvider } from '@/context/AuthContext'
import { AuthPage } from '@/pages/AuthPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { HomePage } from '@/pages/HomePage'
import { LibraryPage } from '@/pages/LibraryPage'
import { SessionPage } from '@/pages/SessionPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/s/:id" element={<SessionPage />} />
              <Route path="/historia" element={<HistoryPage />} />
              <Route path="/biblioteka" element={<LibraryPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
          <MockModeBadge />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
