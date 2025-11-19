import React from 'react'
import MobileLayoutSimple from '../layouts/MobileLayoutSimple'

const MobileDashboardTest: React.FC = () => {
  console.log('MobileDashboardTest rendering with MobileLayoutSimple...')

  return (
    <MobileLayoutSimple>
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f0f0',
        minHeight: 'calc(100vh - 120px)',
        color: '#000'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
          Dashboard com Layout Mobile!
        </h1>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          ✅ Login OK
        </p>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          ✅ MobileLayout OK
        </p>
        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
          ✅ Bottom Navigation Visível
        </p>
        <div style={{
          backgroundColor: '#fff',
          padding: '15px',
          marginTop: '20px',
          borderRadius: '8px'
        }}>
          <p>Se você vê o bottom navigation abaixo, o layout está funcionando!</p>
        </div>
      </div>
    </MobileLayoutSimple>
  )
}

export default MobileDashboardTest
