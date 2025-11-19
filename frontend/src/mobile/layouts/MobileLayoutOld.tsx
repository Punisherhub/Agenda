import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User } from '../../types'

interface MobileLayoutProps {
  children: React.ReactNode
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showMenu, setShowMenu] = useState(false)

  console.log('MobileLayout rendering...')

  const userStr = localStorage.getItem('user')
  const user: User | null = userStr ? JSON.parse(userStr) : null
  console.log('User from localStorage:', user)

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager'

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const bottomNavItems = [
    { emoji: '🏠', label: 'Início', path: '/dashboard' },
    { emoji: '📅', label: 'Agenda', path: '/agendamentos' },
    { emoji: '👥', label: 'Clientes', path: '/clientes' },
    { emoji: '☰', label: 'Menu', action: () => setShowMenu(true) }
  ]

  const menuItems = [
    ...(isAdminOrManager ? [
      { emoji: '⚙️', label: 'Serviços', path: '/servicos' },
      { emoji: '📦', label: 'Materiais', path: '/materiais' },
      { emoji: '📊', label: 'Relatórios', path: '/relatorios' }
    ] : []),
    { emoji: '⚙️', label: 'Configurações', path: '/configuracoes' },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Agenda OnSell</h1>
            {user && (
              <p className="text-xs text-gray-500">{user.full_name}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="grid grid-cols-4 h-16">
          {bottomNavItems.map((item, index) => {
            const isActive = location.pathname === item.path

            return (
              <button
                key={index}
                onClick={() => item.path ? navigate(item.path) : item.action?.()}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <div className="text-2xl">{item.emoji}</div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Slide-out Menu */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-white shadow-2xl z-40 transform transition-transform">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="bg-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Menu</h2>
                    {user && (
                      <p className="text-sm opacity-90">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="p-2 hover:bg-blue-700 rounded-lg text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {menuItems.map((item, index) => {
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          navigate(item.path)
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                      >
                        <div className="text-xl">{item.emoji}</div>
                        <span className="text-gray-900 font-medium">
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 active:bg-red-200 transition-colors"
                >
                  <div className="text-xl">🚪</div>
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MobileLayout
