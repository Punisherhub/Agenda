import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../services/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setIsAuthenticated(false)
        setIsLoading(false)
        return
      }

      try {
        // Verificar se o token é válido fazendo uma requisição para /auth/me
        const user = await authApi.me()

        // Atualizar dados do usuário no localStorage
        localStorage.setItem('user', JSON.stringify(user))

        setIsAuthenticated(true)
      } catch (error) {
        // Token inválido ou expirado
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute