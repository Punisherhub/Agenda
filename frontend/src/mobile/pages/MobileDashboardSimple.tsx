import React from 'react'

const MobileDashboardSimple: React.FC = () => {
  console.log('MobileDashboardSimple rendering!!!')

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      color: '#000'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        Dashboard Mobile Funcionando!
      </h1>
      <p style={{ fontSize: '16px', marginBottom: '10px' }}>
        ✅ Login OK
      </p>
      <p style={{ fontSize: '16px', marginBottom: '10px' }}>
        ✅ Navegação OK
      </p>
      <p style={{ fontSize: '16px', marginBottom: '10px' }}>
        ✅ Dashboard Carregado
      </p>
      <div style={{
        backgroundColor: '#fff',
        padding: '15px',
        marginTop: '20px',
        borderRadius: '8px'
      }}>
        <p>Token: {localStorage.getItem('access_token') ? '✅ Presente' : '❌ Ausente'}</p>
        <p>User: {localStorage.getItem('user') ? '✅ Presente' : '❌ Ausente'}</p>
      </div>
    </div>
  )
}

export default MobileDashboardSimple
