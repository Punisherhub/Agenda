import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

interface MobileProtectedRouteProps {
  children: React.ReactNode
}

const MobileProtectedRoute: React.FC<MobileProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('access_token')

  console.log('MobileProtectedRoute - token:', token ? 'exists' : 'missing')

  useEffect(() => {
    // Prevent pull-to-refresh on mobile
    document.body.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overscrollBehavior = 'auto'
    }
  }, [])

  if (!token) {
    console.log('No token, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('Token found, rendering children')
  return <>{children}</>
}

export default MobileProtectedRoute
