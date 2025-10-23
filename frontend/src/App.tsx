import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AgendamentosPage from './pages/AgendamentosPage'
import ClientesPage from './pages/ClientesPage'
import ServicosPage from './pages/ServicosPage'
import MateriaisPage from './pages/MateriaisPage'
import RelatoriosPage from './pages/RelatoriosPage'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
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
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App