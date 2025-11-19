import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isMobileDevice } from './utils/deviceDetector'
import MobileApp from './mobile/MobileApp'
import App from './App'
import './mobile/styles/mobile.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

/**
 * AppRouter - Detecta o dispositivo e renderiza a versão apropriada
 *
 * - Mobile: Renderiza MobileApp (arquitetura separada)
 * - Desktop: Renderiza App (versão desktop original)
 *
 * Nenhum código é compartilhado entre as versões,
 * mantendo a separação completa de concerns.
 */
const AppRouter: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Detecta o dispositivo
    const mobile = isMobileDevice()
    console.log('Device detection - isMobile:', mobile)
    setIsMobile(mobile)

    // Aplica classe no body para mobile
    if (mobile) {
      console.log('Mobile detected, applying mobile styles')
      document.body.classList.add('mobile-view')
      // Previne zoom no iOS em inputs
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        )
      }
    } else {
      document.body.classList.remove('mobile-view')
    }

    setIsLoading(false)

    // Listener para mudanças de orientação/tamanho
    const handleResize = () => {
      const newIsMobile = isMobileDevice()
      if (newIsMobile !== isMobile) {
        // Reload page if device type changes (mobile <-> desktop)
        window.location.reload()
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      document.body.classList.remove('mobile-view')
    }
  }, [isMobile])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="mobile-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Render appropriate version with shared Router and QueryClient
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {isMobile ? <MobileApp /> : <App />}
      </Router>
    </QueryClientProvider>
  )
}

export default AppRouter
