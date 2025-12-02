import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  CogIcon,
  CubeIcon,
  ChartBarIcon,
  GiftIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import logoOnSell from '../../assets/LogoOnSellSistemas.png'

interface MobileLayoutTailwindProps {
  children: React.ReactNode
}

const MobileLayoutTailwind: React.FC<MobileLayoutTailwindProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Início' },
    { path: '/agendamentos', icon: CalendarIcon, label: 'Agenda' },
    { path: '/clientes', icon: UsersIcon, label: 'Clientes' },
    { path: '/servicos', icon: CogIcon, label: 'Serviços' },
    { path: '/materiais', icon: CubeIcon, label: 'Materiais' },
    { path: '/fidelidade', icon: GiftIcon, label: 'Fidelidade' },
    { path: '/relatorios', icon: ChartBarIcon, label: 'Relatórios' }
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <img
            src={logoOnSell}
            alt="OnSell Sistemas"
            className="h-8 object-contain"
          />
          <button
            onClick={handleLogout}
            className="p-2 active:bg-gray-100 rounded-full"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="grid grid-cols-7 h-16">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 active:bg-gray-100'
                }`}
              >
                <Icon className="w-6 h-6" />
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
