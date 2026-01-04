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
import SuportePage from './pages/SuportePage'
import WAHAPage from './pages/WAHAPage'
import SuporteLoginPage from './pages/SuporteLoginPage'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/suporte/login" element={<SuporteLoginPage />} />

      {/* Rota de suporte (suporte-only, não listada nos menus) */}
      <Route path="/suporte" element={<SuportePage />} />

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
        <Route path="whatsapp" element={
          <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
            <WAHAPage />
          </RoleProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App