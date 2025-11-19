import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface MobileLayoutSimpleNavProps {
  children: React.ReactNode
}

const MobileLayoutSimpleNav: React.FC<MobileLayoutSimpleNavProps> = ({ children }) => {
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
    { path: '/servicos', emoji: '⚙️', label: 'Serviços' },
    { path: '/materiais', emoji: '📦', label: 'Materiais' },
    { path: '/relatorios', emoji: '📊', label: 'Relatórios' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Agenda OnSell</h1>
          <button
            onClick={handleLogout}
            style={{ fontSize: '24px', padding: '8px', background: 'none', border: 'none' }}
          >
            🚪
          </button>
        </div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '64px' }}>
        {children}
      </main>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        zIndex: 20
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          height: '64px'
        }}>
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: isActive ? '#2563eb' : '#4b5563',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '20px' }}>{item.emoji}</div>
                <span style={{ fontSize: '10px', fontWeight: 500 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default MobileLayoutSimpleNav
