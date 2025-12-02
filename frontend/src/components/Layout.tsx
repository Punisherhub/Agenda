import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Users, LogOut, User, Home, Briefcase, Package, BarChart3, Gift } from 'lucide-react'
import logoOnSell from '../assets/LogoOnSellSistemas.png'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Verificar se usuário tem permissão (ADMIN ou MANAGER)
  // Backend retorna roles em UPPERCASE
  const userRole = (user.role || '').toUpperCase()
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'SUPORTE'

  // Itens de menu disponíveis para todos
  const allNavItems = [
    { path: '/', icon: Home, label: 'Dashboard', requiredRole: null },
    { path: '/agendamentos', icon: Calendar, label: 'Agendamentos', requiredRole: null },
    { path: '/clientes', icon: Users, label: 'Clientes', requiredRole: null },
    { path: '/servicos', icon: Briefcase, label: 'Serviços', requiredRole: 'ADMIN_MANAGER' },
    { path: '/materiais', icon: Package, label: 'Materiais', requiredRole: 'ADMIN_MANAGER' },
    { path: '/fidelidade', icon: Gift, label: 'Fidelidade', requiredRole: 'ADMIN_MANAGER' },
    { path: '/relatorios', icon: BarChart3, label: 'Relatórios', requiredRole: 'ADMIN_MANAGER' },
  ]

  // Filtrar itens de menu baseado na role do usuário
  const navItems = allNavItems.filter(item => {
    if (!item.requiredRole) return true // Disponível para todos
    if (item.requiredRole === 'ADMIN_MANAGER') return isAdminOrManager
    return false
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src={logoOnSell}
                alt="OnSell Sistemas"
                className="h-12 object-contain"
              />
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.full_name}</p>
                <p className="text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-500"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* User info in sidebar */}
            <div className="mt-8 px-4">
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <div className="bg-gray-200 rounded-full p-2">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {user.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.estabelecimento_nome || `Estabelecimento #${user.estabelecimento_id}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout