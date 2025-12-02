import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesApi, servicosApi, agendamentosApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import MobileFAB from '../components/MobileFAB'
import MobileModal from '../components/MobileModal'
import MobileAgendamentoModal from '../components/MobileAgendamentoModal'
import MobileAgendamentoDetailModal from '../components/MobileAgendamentoDetailModal'
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  PencilIcon,
  ChartBarIcon,
  XMarkIcon,
  MapPinIcon,
  IdentificationIcon,
  ClockIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'

const MobileClientesPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false)
  const [isAgendamentoModalOpen, setIsAgendamentoModalOpen] = useState(false)
  const [isAgendamentoDetailOpen, setIsAgendamentoDetailOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<any>(null)
  const [clienteParaAgendar, setClienteParaAgendar] = useState<any>(null)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<any>(null)

  // Filtros
  const [filtros, setFiltros] = useState({
    nome: '',
    telefone: '',
    email: '',
    ativo: true
  })

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: '',
    endereco: ''
  })

  // Buscar clientes com filtros
  const { data: clientesData, isLoading } = useQuery({
    queryKey: ['clientes', filtros],
    queryFn: () => clientesApi.list(filtros)
  })

  // Busca rápida
  const { data: clientesBusca, isLoading: loadingBusca } = useQuery({
    queryKey: ['clientes', 'busca', busca],
    queryFn: () => clientesApi.search(busca),
    enabled: busca.length >= 2
  })

  // Buscar histórico do cliente
  const { data: historicoData, isLoading: loadingHistorico } = useQuery({
    queryKey: ['cliente-historico', editingCliente?.id],
    queryFn: () => clientesApi.getHistory(editingCliente.id),
    enabled: isHistoricoOpen && !!editingCliente
  })

  // Buscar serviços para modal de agendamento
  const { data: servicosData } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => servicosApi.list()
  })

  // Buscar todos clientes para modal de agendamento
  const { data: todosClientesData } = useQuery({
    queryKey: ['clientes', 'todos'],
    queryFn: () => clientesApi.list({ limit: 100 })
  })

  const servicos = servicosData?.servicos || []
  const todosClientes = todosClientesData?.clientes || []
  const agendamentosHistorico = historicoData?.agendamentos || []

  // Mutation criar
  const createMutation = useMutation({
    mutationFn: (data: any) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      handleCloseModal()
    }
  })

  // Mutation atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      clientesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      handleCloseModal()
    }
  })

  // Mutation criar agendamento
  const createAgendamentoMutation = useMutation({
    mutationFn: agendamentosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['cliente-historico'] })
      setIsAgendamentoModalOpen(false)
      setClienteParaAgendar(null)
      alert('✅ Agendamento criado com sucesso!')
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao criar agendamento:\n${errorMsg}`)
    }
  })

  // Mutation atualizar status do agendamento
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      agendamentosApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['cliente-historico'] })
    }
  })

  // Mutation cancelar agendamento
  const cancelAgendamentoMutation = useMutation({
    mutationFn: agendamentosApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['cliente-historico'] })
      setIsAgendamentoDetailOpen(false)
      setAgendamentoSelecionado(null)
    }
  })

  // Mutation deletar agendamento
  const deleteAgendamentoMutation = useMutation({
    mutationFn: agendamentosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['cliente-historico'] })
      setIsAgendamentoDetailOpen(false)
      setAgendamentoSelecionado(null)
    }
  })

  // Mutation atualizar agendamento
  const updateAgendamentoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => agendamentosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['cliente-historico'] })
      setIsAgendamentoModalOpen(false)
      setAgendamentoSelecionado(null)
      alert('✅ Agendamento atualizado com sucesso!')
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao atualizar agendamento:\n${errorMsg}`)
    }
  })

  const clientes = clientesData?.clientes || []
  const resultadosBusca = clientesBusca?.clientes || []

  // Formatar data (PURE JS) - Extrai do ISO string sem conversão de timezone
  const formatData = (dateString: string) => {
    try {
      // Extrair data do formato ISO: 2025-11-08T21:30:00-03:00 → 08/11/2025
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        const ano = dateMatch[1]
        const mes = dateMatch[2]
        const dia = dateMatch[3]
        return `${dia}/${mes}/${ano}`
      }
      return ''
    } catch {
      return ''
    }
  }

  // Formatar hora (PURE JS) - Extrai do ISO string sem conversão de timezone
  const formatHora = (dateString: string) => {
    try {
      // Extrair hora do formato ISO: 2025-11-08T21:30:00-03:00 → 21:30
      const timeMatch = dateString.match(/T(\d{2}):(\d{2})/)
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`
      }
      return '00:00'
    } catch {
      return '00:00'
    }
  }

  // Formatar telefone (PURE JS)
  const formatTelefone = (telefone: string) => {
    if (!telefone) return ''
    const numbers = telefone.replace(/\D/g, '')
    if (numbers.length === 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`
    }
    if (numbers.length === 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    }
    return telefone
  }

  // Formatar CPF (PURE JS)
  const formatCPF = (cpf: string) => {
    if (!cpf) return ''
    const numbers = cpf.replace(/\D/g, '')
    if (numbers.length === 11) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`
    }
    return cpf
  }

  const handleOpenModal = (cliente?: any) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email || '',
        cpf: cliente.cpf || '',
        endereco: cliente.endereco || ''
      })
    } else {
      setEditingCliente(null)
      setFormData({ nome: '', telefone: '', email: '', cpf: '', endereco: '' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCliente(null)
  }

  const handleOpenHistorico = (cliente: any) => {
    setEditingCliente(cliente)
    setIsHistoricoOpen(true)
  }

  const handleOpenAgendamento = (cliente: any) => {
    setClienteParaAgendar(cliente)
    setIsAgendamentoModalOpen(true)
  }

  const handleCreateAgendamento = async (data: any) => {
    try {
      if (agendamentoSelecionado) {
        // Modo edição
        await updateAgendamentoMutation.mutateAsync({ id: agendamentoSelecionado.id, data })
      } else {
        // Modo criação
        await createAgendamentoMutation.mutateAsync(data)
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      // Erro já tratado no onError da mutation
    }
  }

  const handleOpenAgendamentoDetail = (agendamento: any) => {
    setAgendamentoSelecionado(agendamento)
    setIsAgendamentoDetailOpen(true)
  }

  const handleEditAgendamento = (agendamento: any) => {
    setAgendamentoSelecionado(agendamento)
    setIsAgendamentoDetailOpen(false)
    setIsAgendamentoModalOpen(true)
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status })
  }

  const handleCancelAgendamento = async (id: number) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await cancelAgendamentoMutation.mutateAsync(id)
    }
  }

  const handleDeleteAgendamento = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      await deleteAgendamentoMutation.mutateAsync(id)
    }
  }

  const handleConcluirComMateriais = () => {
    alert('Funcionalidade de materiais não disponível no histórico. Acesse a página de Agendamentos.')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO': return 'bg-blue-100 text-blue-800'
      case 'CONFIRMADO': return 'bg-green-100 text-green-800'
      case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800'
      case 'CONCLUIDO': return 'bg-emerald-100 text-emerald-800'
      case 'CANCELADO': return 'bg-red-100 text-red-800'
      case 'NAO_COMPARECEU': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const clienteData = {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email || null,
      cpf: formData.cpf || null,
      endereco: formData.endereco || null
    }

    if (editingCliente) {
      updateMutation.mutate({ id: editingCliente.id, data: clienteData })
    } else {
      createMutation.mutate(clienteData)
    }
  }

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      nome: '',
      telefone: '',
      email: '',
      ativo: true
    })
  }

  const hasActiveFilters = filtros.nome || filtros.telefone || filtros.email

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium active:bg-gray-200"
          >
            {showFilters ? '🔼 Filtros' : '🔽 Filtros'}
          </button>
        </div>

        {/* Busca Rápida */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">Busca Rápida</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, telefone ou email..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Resultados da Busca */}
          {busca.length >= 2 && (
            <div className="space-y-2 mt-3">
              {loadingBusca ? (
                <p className="text-gray-500 text-sm">Buscando...</p>
              ) : resultadosBusca.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum cliente encontrado</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    {resultadosBusca.length} resultado{resultadosBusca.length !== 1 ? 's' : ''}:
                  </p>
                  {resultadosBusca.map((cliente: any) => (
                    <div
                      key={cliente.id}
                      className="bg-blue-50 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{cliente.nome}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <PhoneIcon className="w-4 h-4" />
                            {formatTelefone(cliente.telefone)}
                          </p>
                          {cliente.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <EnvelopeIcon className="w-4 h-4" />
                              {cliente.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleOpenAgendamento(cliente)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium active:bg-green-700"
                        >
                          <CalendarIcon className="w-4 h-4 inline" /> Agendar
                        </button>
                        <button
                          onClick={() => handleOpenModal(cliente)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
                        >
                          <PencilIcon className="w-4 h-4 inline" /> Editar
                        </button>
                        <button
                          onClick={() => handleOpenHistorico(cliente)}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium active:bg-gray-700"
                        >
                          <ChartBarIcon className="w-4 h-4 inline" /> Histórico
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Filtros Colapsáveis */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtros Avançados</h3>
              {hasActiveFilters && (
                <button
                  onClick={limparFiltros}
                  className="text-sm text-blue-600 active:text-blue-800"
                >
                  Limpar
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={filtros.nome}
                onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
                placeholder="Nome do cliente"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={filtros.telefone}
                onChange={(e) => setFiltros({ ...filtros, telefone: e.target.value })}
                placeholder="Telefone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={filtros.email}
                onChange={(e) => setFiltros({ ...filtros, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.ativo.toString()}
                onChange={(e) => setFiltros({ ...filtros, ativo: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
        )}

        {/* Lista de Clientes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Carregando...' : `${clientes.length} cliente${clientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : clientes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Nenhum cliente encontrado
            </div>
          ) : (
            clientes.map((cliente: any) => (
              <div
                key={cliente.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-3"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{cliente.nome}</h3>
                    <p className="text-xs text-gray-500">ID: {cliente.id}</p>
                    {cliente.cpf && (
                      <p className="text-xs text-gray-500">CPF: {formatCPF(cliente.cpf)}</p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      cliente.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {cliente.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Contato */}
                <div className="border-t pt-2">
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4" />
                    {formatTelefone(cliente.telefone)}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    {cliente.email || 'Sem email'}
                  </p>
                  {cliente.endereco && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {cliente.endereco}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Cadastro: {formatData(cliente.created_at)}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenAgendamento(cliente)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium active:bg-green-700"
                  >
                    <CalendarIcon className="w-4 h-4 inline" /> Agendar
                  </button>
                  <button
                    onClick={() => handleOpenModal(cliente)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
                  >
                    <PencilIcon className="w-4 h-4 inline" /> Editar
                  </button>
                  <button
                    onClick={() => handleOpenHistorico(cliente)}
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium active:bg-gray-700"
                  >
                    <ChartBarIcon className="w-4 h-4 inline" /> Histórico
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <MobileFAB onClick={() => handleOpenModal()} />

      {/* Modal Criar/Editar */}
      <MobileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="Digite o nome"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone *
            </label>
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="(11) 98765-4321"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endereço
            </label>
            <textarea
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="Rua, número, bairro, cidade..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 active:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:bg-gray-400"
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? 'Salvando...'
                : editingCliente ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </MobileModal>

      {/* Modal Histórico */}
      <MobileModal
        isOpen={isHistoricoOpen}
        onClose={() => {
          setIsHistoricoOpen(false)
          setEditingCliente(null)
        }}
        title="Histórico do Cliente"
      >
        <div className="space-y-4">
          {loadingHistorico ? (
            <p className="text-gray-500 text-center py-4">Carregando...</p>
          ) : (
            <>
              {/* Informações do Cliente */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-2">{editingCliente?.nome}</h3>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" />
                  {formatTelefone(editingCliente?.telefone)}
                </p>
                {editingCliente?.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    {editingCliente.email}
                  </p>
                )}
                {editingCliente?.cpf && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <IdentificationIcon className="w-4 h-4" />
                    {formatCPF(editingCliente.cpf)}
                  </p>
                )}
              </div>

              {/* Histórico de Agendamentos */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Histórico de Agendamentos</h4>
                {agendamentosHistorico.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Nenhum agendamento encontrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {agendamentosHistorico.map((agendamento: any) => (
                      <div
                        key={agendamento.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 active:bg-gray-50 cursor-pointer"
                        onClick={() => handleOpenAgendamentoDetail(agendamento)}
                      >
                        {/* Cabeçalho */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-bold text-blue-600">
                                {formatHora(agendamento.data_inicio)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatData(agendamento.data_inicio)}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Detalhes */}
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700 flex items-center gap-1">
                            <WrenchScrewdriverIcon className="w-4 h-4" />
                            {agendamento.servico?.nome || `Serviço #${agendamento.servico_id}`}
                          </p>
                          <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                            <CurrencyDollarIcon className="w-4 h-4" />
                            R$ {(agendamento.valor_final || agendamento.valor_total || 0).toFixed(2)}
                          </p>
                          {agendamento.observacoes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {agendamento.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Resumo */}
                    <div className="bg-blue-50 rounded-lg p-3 mt-3">
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">Total de agendamentos: {agendamentosHistorico.length}</p>
                        <p className="font-medium text-green-600">
                          Total gasto: R$ {agendamentosHistorico.reduce((sum: number, a: any) => sum + (a.valor_final || a.valor_total || 0), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </MobileModal>

      {/* Modal de Agendamento */}
      <MobileAgendamentoModal
        isOpen={isAgendamentoModalOpen}
        onClose={() => {
          setIsAgendamentoModalOpen(false)
          setClienteParaAgendar(null)
          setAgendamentoSelecionado(null)
        }}
        onSave={handleCreateAgendamento}
        agendamento={agendamentoSelecionado}
        servicos={servicos}
        clientes={todosClientes}
        loading={createAgendamentoMutation.isPending || updateAgendamentoMutation.isPending}
        clientePreSelecionado={clienteParaAgendar}
      />

      {/* Modal de Detalhes do Agendamento */}
      <MobileAgendamentoDetailModal
        isOpen={isAgendamentoDetailOpen}
        onClose={() => {
          setIsAgendamentoDetailOpen(false)
          setAgendamentoSelecionado(null)
        }}
        agendamento={agendamentoSelecionado}
        servicos={servicos}
        clientes={todosClientes}
        onEdit={handleEditAgendamento}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancelAgendamento}
        onDelete={handleDeleteAgendamento}
        onConcluirComMateriais={handleConcluirComMateriais}
        loading={updateStatusMutation.isPending || cancelAgendamentoMutation.isPending || deleteAgendamentoMutation.isPending}
      />
    </MobileLayout>
  )
}

export default MobileClientesPage
