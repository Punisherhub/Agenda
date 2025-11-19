import React from 'react'
import { Navigate } from 'react-router-dom'
import { User } from '../../types'

interface MobileRoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: Array<'admin' | 'manager' | 'vendedor' | 'atendente'>
}

const MobileRoleProtectedRoute: React.FC<MobileRoleProtectedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const userStr = localStorage.getItem('user')

  if (!userStr) {
    return <Navigate to="/login" replace />
  }

  const user: User = JSON.parse(userStr)

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-lg font-medium"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default MobileRoleProtectedRoute
