import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface MobileLayoutSimpleProps {
  children: React.ReactNode
}

const MobileLayoutSimple: React.FC<MobileLayoutSimpleProps> = ({ children }) => {
  console.log('MobileLayoutSimple rendering...')

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#111827',
          margin: 0
        }}>
          Agenda OnSell
        </h1>
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: '64px'
      }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        height: '64px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        zIndex: 20
      }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={index}
              onClick={() => item.path ? navigate(item.path) : item.action?.()}
              style={{
                textAlign: 'center',
                padding: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isActive ? '#2563eb' : '#4b5563',
                minWidth: '60px',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <div style={{ fontSize: '24px' }}>{item.emoji}</div>
              <div style={{
                fontSize: '10px',
                marginTop: '4px',
                fontWeight: isActive ? 'bold' : 'normal'
              }}>
                {item.label}
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default MobileLayoutSimple
