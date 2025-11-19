import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface MobileLayoutTailwindProps {
  children: React.ReactNode
}

const MobileLayoutTailwind: React.FC<MobileLayoutTailwindProps> = ({ children }) => {
  console.log('MobileLayoutTailwind rendering...')

  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', emoji: '🏠', label: 'Início' },
    { path: '/agendamentos', emoji: '📅', label: 'Agenda' },
    { path: '/clientes', emoji: '👥', label: 'Clientes' },
    { action: handleLogout, emoji: '🚪', label: 'Sair' }
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Agenda OnSell</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item, index) => {
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
    </div>
  )
}

export default MobileLayoutTailwind
