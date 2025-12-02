import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, AlertCircle } from 'lucide-react'
import api from '../services/api'

const SuporteLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      })

      console.log('Response data:', response.data)

      // A API pode retornar { access_token, user } ou apenas { access_token }
      const access_token = response.data.access_token || response.data.token

      if (!access_token) {
        setError('Resposta inválida do servidor')
        setLoading(false)
        return
      }

      // Buscar dados do usuário usando o token
      try {
        const userResponse = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        })

        const user = userResponse.data

        console.log('User data:', user)

        // Verificar se o usuário tem role de suporte
        if (user.role !== 'suporte') {
          setError('Acesso negado. Esta área é exclusiva para suporte técnico.')
          setLoading(false)
          return
        }

        // Salvar token e dados do usuário
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        // Redirecionar para página de suporte
        navigate('/suporte')
      } catch (userErr) {
        console.error('Erro ao buscar dados do usuário:', userErr)
        setError('Erro ao carregar dados do usuário')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Erro no login:', err)
      if (err.response?.status === 401) {
        setError('Username ou senha incorretos')
      } else {
        setError('Erro ao fazer login. Tente novamente.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4 shadow-lg">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Suporte Técnico</h1>
          <p className="text-gray-400">Área restrita - Acesso exclusivo</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="username"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Acessar Sistema
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-center text-sm text-gray-500">
              Sistema de gerenciamento interno
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
          <p className="text-xs text-yellow-200 text-center">
            ⚠️ Esta é uma área restrita. Todos os acessos são registrados e monitorados.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SuporteLoginPage
