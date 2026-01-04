import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { authApi } from '../../services/api'
import logoSAS from '../../assets/SAS.png'
import '../styles/mobile.css'

const MobileLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      console.log('Login success:', data)
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      console.log('Navigating to dashboard...')
      navigate('/dashboard')
    },
    onError: (error) => {
      console.error('Login error:', error)
      setError('Username ou senha inválidos')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Preencha todos os campos')
      return
    }

    loginMutation.mutate({ username, password })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-grey-500 to-grey-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logoSAS}
            alt="Logo"
            className="w-48 h-48 mx-auto mb-4 object-contain"
          />
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Entrar
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mobile-input"
                placeholder="Seu username"
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mobile-input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 mobile-button p-2"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-6 h-6" />
                  ) : (
                    <EyeIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg mobile-button shadow-lg active:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center justify-center">
                  <div className="mobile-spinner w-6 h-6 border-2 border-white border-t-transparent" />
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-white text-sm mt-6 opacity-90">
          © 2025 SAS
        </p>
      </div>
    </div>
  )
}

export default MobileLoginPage
