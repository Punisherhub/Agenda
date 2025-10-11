import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Users, LogOut, User, Home, Briefcase, Package, BarChart3 } from 'lucide-react'

const Layout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/agendamentos', icon: Calendar, label: 'Agendamentos' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/servicos', icon: Briefcase, label: 'Serviços' },
    { path: '/materiais', icon: Package, label: 'Materiais' },
    { path: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Agenda OnSell
              </h1>
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
                      Estabelecimento #{user.estabelecimento_id}
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