import { Routes, Route } from 'react-router-dom'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AgendamentosPage from './pages/AgendamentosPage'
import ClientesPage from './pages/ClientesPage'
import ServicosPage from './pages/ServicosPage'
import MateriaisPage from './pages/MateriaisPage'
import RelatoriosPage from './pages/RelatoriosPage'
import FidelidadePage from './pages/FidelidadePage'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas protegidas */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="agendamentos" element={<AgendamentosPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="servicos" element={
          <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
            <ServicosPage />
          </RoleProtectedRoute>
        } />
        <Route path="materiais" element={
          <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
            <MateriaisPage />
          </RoleProtectedRoute>
        } />
        <Route path="relatorios" element={
          <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
            <RelatoriosPage />
          </RoleProtectedRoute>
        } />
        <Route path="fidelidade" element={
          <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
            <FidelidadePage />
          </RoleProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App