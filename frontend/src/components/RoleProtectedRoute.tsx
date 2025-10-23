import React from 'react'
import { Navigate } from 'react-router-dom'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

/**
 * Componente para proteger rotas baseado em roles de usuário
 * @param allowedRoles - Array de roles permitidas (ex: ['admin', 'manager'])
 * Nota: Backend retorna roles em lowercase
 */
const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Verificar se usuário tem uma das roles permitidas
  // Backend retorna roles em lowercase (admin, manager, vendedor, atendente)
  const hasPermission = allowedRoles.includes(user.role)

  if (!hasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RoleProtectedRoute
