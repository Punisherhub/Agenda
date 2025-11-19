import React from 'react'
import MobileLayout from '../layouts/MobileLayout'

const MobileAgendamentosSimple: React.FC = () => {
  console.log('MobileAgendamentosSimple rendering...')

  return (
    <MobileLayout>
      <div style={{
        padding: '20px',
        color: '#000'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: 'bold' }}>
          📅 Agendamentos
        </h2>
        <div style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>João Silva</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Corte de Cabelo - 14:00</p>
        </div>
        <div style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Maria Santos</p>
          <p style={{ fontSize: '14px', color: '#666' }}>Barba - 15:30</p>
        </div>
      </div>
    </MobileLayout>
  )
}

export default MobileAgendamentosSimple
