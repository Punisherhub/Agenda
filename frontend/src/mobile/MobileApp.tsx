import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MobileLoginPage from './pages/MobileLoginPage'
import MobileDashboardPage from './pages/MobileDashboardPage'
import MobileAgendamentosPage from './pages/MobileAgendamentosPage'
import MobileClientesPage from './pages/MobileClientesPage'
import MobileServicosPage from './pages/MobileServicosPage'
import MobileMateriaisPage from './pages/MobileMateriaisPage'
import MobileRelatoriosPage from './pages/MobileRelatoriosPage'
import MobileFidelidadePage from './pages/MobileFidelidadePage'
import MobileProtectedRoute from './components/MobileProtectedRoute'

const MobileApp: React.FC = () => {
  console.log('MobileApp rendering...')

  return (
    <Routes>
      <Route path="/login" element={<MobileLoginPage />} />

      <Route path="/dashboard" element={
        <MobileProtectedRoute>
          <MobileDashboardPage />
        </MobileProtectedRoute>
      } />

      <Route path="/agendamentos" element={
        <MobileProtectedRoute>
          <MobileAgendamentosPage />
        </MobileProtectedRoute>
      } />

      <Route path="/clientes" element={
        <MobileProtectedRoute>
          <MobileClientesPage />
        </MobileProtectedRoute>
      } />

      <Route path="/servicos" element={
        <MobileProtectedRoute>
          <MobileServicosPage />
        </MobileProtectedRoute>
      } />

      <Route path="/materiais" element={
        <MobileProtectedRoute>
          <MobileMateriaisPage />
        </MobileProtectedRoute>
      } />

      <Route path="/relatorios" element={
        <MobileProtectedRoute>
          <MobileRelatoriosPage />
        </MobileProtectedRoute>
      } />

      <Route path="/fidelidade" element={
        <MobileProtectedRoute>
          <MobileFidelidadePage />
        </MobileProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default MobileApp
