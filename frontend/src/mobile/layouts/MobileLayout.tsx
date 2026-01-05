import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  CogIcon,
  CubeIcon,
  ChartBarIcon,
  GiftIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import logoOnSell from '../../assets/LogoOnSellSistemas.png'

interface MobileLayoutTailwindProps {
  children: React.ReactNode
}

const MobileLayoutTailwind: React.FC<MobileLayoutTailwindProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    { path: '/relatorios', icon: ChartBarIcon, label: 'Relatórios' },
    { path: '/waha', icon: ChatBubbleLeftRightIcon, label: 'WhatsApp' }
  ]

  const handleNavigate = (path: string) => {
    navigate(path)
    setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 active:bg-gray-100 rounded-lg"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          </button>

          <img
            src={logoOnSell}
            alt="OnSell Sistemas"
            className="h-8 object-contain"
          />

          <button
            onClick={handleLogout}
            className="p-2 active:bg-gray-100 rounded-lg"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header - Fixed Top */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <img
              src={logoOnSell}
              alt="OnSell Sistemas"
              className="h-8 object-contain brightness-0 invert"
            />
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 active:bg-blue-500 rounded-lg text-white"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="text-white">
            <p className="text-sm opacity-90">Bem-vindo!</p>
            <p className="font-semibold">{JSON.parse(localStorage.getItem('user') || '{}').full_name || 'Usuário'}</p>
          </div>
        </div>

        {/* Navigation Items - Scrollable Middle */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                    : 'text-gray-700 active:bg-gray-100'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Sidebar Footer - Fixed Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={() => {
              handleLogout()
              setSidebarOpen(false)
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-600 active:bg-red-50 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </div>
  )
}

export default MobileLayoutTailwind
