import React from 'react'
import { Navigate } from 'react-router-dom'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

/**
 * Componente para proteger rotas baseado em roles de usuário
 * @param allowedRoles - Array de roles permitidas (ex: ['ADMIN', 'MANAGER'])
 * Nota: Backend retorna roles em UPPERCASE
 */
const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Verificar se usuário tem uma das roles permitidas
  // Backend retorna roles em UPPERCASE (ADMIN, MANAGER, VENDEDOR, ATENDENTE, SUPORTE)
  // Normalizamos ambos para uppercase para comparação case-insensitive
  const userRole = (user.role || '').toUpperCase()
  const normalizedAllowedRoles = allowedRoles.map(role => role.toUpperCase())
  const hasPermission = normalizedAllowedRoles.includes(userRole)

  if (!hasPermission) {
    // Redirecionar para dashboard se não tiver permissão
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default RoleProtectedRoute
