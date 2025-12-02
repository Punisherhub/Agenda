import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Building2, MapPin, Users, Plus, Edit, Trash2, LogOut, Shield } from 'lucide-react'

// Tipos
interface Empresa {
  id: number
  nome: string
  cnpj: string
  email: string
  telefone?: string
  is_active: boolean
}

interface Estabelecimento {
  id: number
  nome: string
  empresa_id: number
  endereco?: string
  cidade?: string
  estado?: string
  is_active: boolean
  empresa?: Empresa
}

interface Usuario {
  id: number
  full_name: string
  email: string
  role: 'admin' | 'manager' | 'vendedor' | 'atendente' | 'suporte'
  estabelecimento_id?: number
  is_active: boolean
}

// API Client
// Em produção, usa VITE_API_URL configurado no Railway
// Em desenvolvimento, usa proxy /api
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const SuportePage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'empresas' | 'estabelecimentos' | 'usuarios'>('empresas')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null)

  // Verificar autenticação e role ao montar
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr) {
      navigate('/suporte/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.role !== 'suporte') {
      navigate('/suporte/login')
      return
    }

    setCurrentUser(user)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/suporte/login')
  }

  // Queries
  const { data: empresas } = useQuery({
    queryKey: ['empresas-suporte'],
    queryFn: async () => (await api.get('/empresas/')).data
  })

  const { data: estabelecimentos } = useQuery({
    queryKey: ['estabelecimentos-suporte'],
    queryFn: async () => (await api.get('/estabelecimentos/')).data
  })

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-suporte'],
    queryFn: async () => (await api.get('/users/')).data
  })

  // Mutations - Empresas
  const createEmpresa = useMutation({
    mutationFn: (data: any) => api.post('/empresas/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-suporte'] })
      setShowModal(false)
      setEditingItem(null)
      alert('✅ Empresa criada com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao criar empresa'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const updateEmpresa = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/empresas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-suporte'] })
      setShowModal(false)
      setEditingItem(null)
      alert('✅ Empresa atualizada com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar empresa'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const deleteEmpresa = useMutation({
    mutationFn: (id: number) => api.delete(`/empresas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-suporte'] })
      alert('✅ Empresa deletada com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao deletar empresa'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  // Mutations - Estabelecimentos
  const createEstabelecimento = useMutation({
    mutationFn: (data: any) => api.post('/estabelecimentos/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos-suporte'] })
      setShowModal(false)
      setEditingItem(null)
      alert('✅ Estabelecimento criado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao criar estabelecimento'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const updateEstabelecimento = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/estabelecimentos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos-suporte'] })
      setShowModal(false)
      setEditingItem(null)
      alert('✅ Estabelecimento atualizado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar estabelecimento'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const deleteEstabelecimento = useMutation({
    mutationFn: (id: number) => api.delete(`/estabelecimentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos-suporte'] })
      alert('✅ Estabelecimento deletado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao deletar estabelecimento'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  // Mutations - Usuários
  const updateUserRole = useMutation({
    mutationFn: ({ id, role }: { id: number, role: string }) =>
      api.put(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-suporte'] })
      alert('✅ Role do usuário atualizada com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar role'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-suporte'] })
      alert('✅ Usuário deletado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao deletar usuário'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const toggleUserStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) =>
      api.put(`/users/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-suporte'] })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao alterar status do usuário'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const toggleEstabelecimentoStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) =>
      api.put(`/estabelecimentos/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estabelecimentos-suporte'] })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao alterar status do estabelecimento'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  const createUser = useMutation({
    mutationFn: (data: any) => api.post('/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-suporte'] })
      setShowModal(false)
      setEditingItem(null)
      alert('✅ Usuário criado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao criar usuário'
      if (errorMessage === 'Email already registered') {
        alert('❌ Este email já está cadastrado!')
      } else if (errorMessage === 'Username already taken') {
        alert('❌ Este username já está em uso!')
      } else {
        alert(`❌ Erro: ${errorMessage}`)
      }
    }
  })

  const updateUser = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-suporte'] })
      setShowModal(false)
      setEditingItem(null)
      alert('✅ Usuário atualizado com sucesso!')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 'Erro ao atualizar usuário'
      alert(`❌ Erro: ${errorMessage}`)
    }
  })

  // Handlers
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: any = Object.fromEntries(formData.entries())

    console.log('handleSubmit - activeTab:', activeTab)
    console.log('handleSubmit - data:', data)

    // Converter empresa_id para número se estiver presente
    if (data.empresa_id) {
      data.empresa_id = parseInt(data.empresa_id as string, 10)
    }

    // Converter estabelecimento_id para número ou null
    if (data.estabelecimento_id) {
      const estabId = data.estabelecimento_id as string
      data.estabelecimento_id = estabId === '' ? null : parseInt(estabId, 10)
    }

    // Converter campos vazios para null (evitar validação de min_length)
    if (data.cpf === '') data.cpf = null
    if (data.telefone === '') data.telefone = null
    if (data.cargo === '') data.cargo = null

    // NÃO converter role aqui - backend faz a conversão

    if (activeTab === 'empresas') {
      if (editingItem) {
        updateEmpresa.mutate({ id: editingItem.id, data })
      } else {
        createEmpresa.mutate(data)
      }
    } else if (activeTab === 'estabelecimentos') {
      if (editingItem) {
        updateEstabelecimento.mutate({ id: editingItem.id, data })
      } else {
        createEstabelecimento.mutate(data)
      }
    } else if (activeTab === 'usuarios') {
      console.log('Criando/Editando usuário:', editingItem ? 'Editar' : 'Criar')
      if (editingItem) {
        updateUser.mutate({ id: editingItem.id, data })
      } else {
        createUser.mutate(data)
      }
    }
  }

  if (!currentUser) {
    return null // Aguardando verificação de autenticação
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Customizado */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Painel de Suporte</h1>
                <p className="text-sm text-red-100">Área restrita - Gerenciamento do sistema</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser.full_name}</p>
                <p className="text-xs text-red-100">{currentUser.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('empresas')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'empresas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-5 h-5 inline mr-2" />
            Empresas
          </button>
          <button
            onClick={() => setActiveTab('estabelecimentos')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'estabelecimentos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-5 h-5 inline mr-2" />
            Estabelecimentos
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'usuarios'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Usuários
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Empresas Tab */}
          {activeTab === 'empresas' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Empresas</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setShowModal(true)
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Empresa
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">CNPJ</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Telefone</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas?.empresas?.map((empresa: Empresa) => (
                    <tr key={empresa.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{empresa.nome}</td>
                      <td className="py-3 px-4">{empresa.cnpj}</td>
                      <td className="py-3 px-4">{empresa.email}</td>
                      <td className="py-3 px-4">{empresa.telefone || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          empresa.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {empresa.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingItem(empresa)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Desativar empresa?')) {
                              deleteEmpresa.mutate(empresa.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Estabelecimentos Tab */}
          {activeTab === 'estabelecimentos' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Estabelecimentos</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setShowModal(true)
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Estabelecimento
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Empresa</th>
                    <th className="text-left py-3 px-4">Cidade/Estado</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {estabelecimentos?.estabelecimentos?.map((estab: Estabelecimento) => (
                    <tr key={estab.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{estab.nome}</td>
                      <td className="py-3 px-4">{estab.empresa?.nome || `-`}</td>
                      <td className="py-3 px-4">{estab.cidade && estab.estado ? `${estab.cidade}/${estab.estado}` : '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            toggleEstabelecimentoStatus.mutate({ id: estab.id, is_active: !estab.is_active })
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            estab.is_active ? 'bg-green-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              estab.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingItem(estab)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Desativar estabelecimento?')) {
                              deleteEstabelecimento.mutate(estab.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Usuários Tab */}
          {activeTab === 'usuarios' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gerenciar Usuários e Permissões</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setShowModal(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Novo Usuário
                </button>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Estabelecimento</th>
                    <th className="text-left py-3 px-4">Permissão</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios?.users?.map((user: Usuario) => {
                    const estabelecimento = estabelecimentos?.estabelecimentos?.find((e: Estabelecimento) => e.id === user.estabelecimento_id)
                    return (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{user.full_name}</td>
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="py-3 px-4">{estabelecimento?.nome || '-'}</td>
                        <td className="py-3 px-4">
                          <select
                            value={user.role.toLowerCase()}
                            onChange={(e) => {
                              if (confirm(`Alterar permissão para ${e.target.value}?`)) {
                                updateUserRole.mutate({ id: user.id, role: e.target.value })
                              }
                            }}
                            className="border rounded px-2 py-1"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="atendente">Atendente</option>
                            <option value="suporte">Suporte</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              toggleUserStatus.mutate({ id: user.id, is_active: !user.is_active })
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              user.is_active ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                user.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingItem(user)
                              setShowModal(true)
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Desativar usuário?')) {
                                deleteUser.mutate(user.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-4">
                {editingItem ? 'Editar' : 'Novo'} {activeTab === 'empresas' ? 'Empresa' : 'Estabelecimento'}
              </h3>

              <form onSubmit={handleSubmit}>
                {activeTab === 'empresas' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Nome *</label>
                      <input
                        type="text"
                        name="nome"
                        defaultValue={editingItem?.nome}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">CNPJ *</label>
                      <input
                        type="text"
                        name="cnpj"
                        defaultValue={editingItem?.cnpj}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingItem?.email}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Telefone</label>
                      <input
                        type="text"
                        name="telefone"
                        defaultValue={editingItem?.telefone}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'estabelecimentos' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Nome *</label>
                      <input
                        type="text"
                        name="nome"
                        defaultValue={editingItem?.nome}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Empresa *</label>
                      <select
                        name="empresa_id"
                        defaultValue={editingItem?.empresa_id}
                        required
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Selecione...</option>
                        {empresas?.empresas?.map((emp: Empresa) => (
                          <option key={emp.id} value={emp.id}>{emp.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Endereço</label>
                      <input
                        type="text"
                        name="endereco"
                        defaultValue={editingItem?.endereco}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cidade *</label>
                        <input
                          type="text"
                          name="cidade"
                          defaultValue={editingItem?.cidade}
                          required
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Estado *</label>
                        <input
                          type="text"
                          name="estado"
                          defaultValue={editingItem?.estado}
                          maxLength={2}
                          required
                          placeholder="PR"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">CEP *</label>
                      <input
                        type="text"
                        name="cep"
                        defaultValue={editingItem?.cep}
                        required
                        placeholder="00000-000"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Telefone</label>
                      <input
                        type="text"
                        name="telefone"
                        defaultValue={editingItem?.telefone}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingItem?.email}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'usuarios' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        name="full_name"
                        defaultValue={editingItem?.full_name}
                        required
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Username *</label>
                      <input
                        type="text"
                        name="username"
                        defaultValue={editingItem?.username}
                        required
                        disabled={!!editingItem}
                        className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingItem?.email}
                        required
                        disabled={!!editingItem}
                        className="w-full border rounded px-3 py-2 disabled:bg-gray-100"
                      />
                    </div>
                    {!editingItem && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Senha *</label>
                        <input
                          type="password"
                          name="password"
                          required
                          minLength={6}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Telefone</label>
                        <input
                          type="text"
                          name="telefone"
                          defaultValue={editingItem?.telefone}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CPF</label>
                        <input
                          type="text"
                          name="cpf"
                          defaultValue={editingItem?.cpf}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cargo</label>
                        <input
                          type="text"
                          name="cargo"
                          defaultValue={editingItem?.cargo}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Permissão *</label>
                        <select
                          name="role"
                          defaultValue={editingItem?.role || 'vendedor'}
                          required
                          className="w-full border rounded px-3 py-2"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="atendente">Atendente</option>
                          <option value="suporte">Suporte</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1">Estabelecimento</label>
                      <select
                        name="estabelecimento_id"
                        defaultValue={editingItem?.estabelecimento_id || ''}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Nenhum</option>
                        {estabelecimentos?.estabelecimentos?.map((estab: Estabelecimento) => (
                          <option key={estab.id} value={estab.id}>{estab.nome}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingItem(null)
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuportePage
