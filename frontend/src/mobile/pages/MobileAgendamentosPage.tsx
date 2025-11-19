import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agendamentosApi, servicosApi, clientesApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import MobileFAB from '../components/MobileFAB'
import MobileAgendamentoModal from '../components/MobileAgendamentoModal'
import MobileErrorBoundary from '../components/MobileErrorBoundary'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PlayIcon,
  PhoneIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const MobileAgendamentosPage: React.FC = () => {
  const queryClient = useQueryClient()
  // Obter data de hoje em formato YYYY-MM-DD sem conversão de timezone
  const getDataHoje = () => {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0')
    const dia = hoje.getDate().toString().padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }
  const [selectedDate, setSelectedDate] = useState(getDataHoje())
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    cliente_nome: ''
  })

  // Buscar agendamentos
  const { data: agendamentosData, isLoading } = useQuery({
    queryKey: ['agendamentos', filtros, selectedDate],
    queryFn: () => {
      const params: any = {}
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
      else if (!filtros.data_fim) params.data_inicio = selectedDate

      if (filtros.data_fim) params.data_fim = filtros.data_fim
      else if (!filtros.data_inicio) params.data_fim = selectedDate

      if (filtros.status) params.status = filtros.status

      return agendamentosApi.list(params)
    }
  })

  // Filtrar por nome de cliente no frontend
  const agendamentos = React.useMemo(() => {
    if (!agendamentosData?.agendamentos) return []

    let filtered = agendamentosData.agendamentos

    if (filtros.cliente_nome) {
      const searchTerm = filtros.cliente_nome.toLowerCase()
      filtered = filtered.filter((ag: any) =>
        ag.cliente?.nome?.toLowerCase().includes(searchTerm)
      )
    }

    return filtered
  }, [agendamentosData, filtros.cliente_nome])

  // Buscar serviços
  const { data: servicosData } = useQuery({
    queryKey: ['servicos'],
    queryFn: servicosApi.list
  })

  // Buscar clientes
  const { data: clientesData } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => clientesApi.list({ limit: 100 })
  })

  const servicos = servicosData?.servicos || []
  const clientes = clientesData?.clientes || []

  // Mutation criar agendamento
  const createMutation = useMutation({
    mutationFn: agendamentosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      setIsModalOpen(false)
      alert('✅ Agendamento criado com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao criar agendamento:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao criar agendamento:\n${errorMsg}`)
    }
  })

  // Mutation atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      agendamentosApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    }
  })

  // Mutation cancelar
  const cancelMutation = useMutation({
    mutationFn: agendamentosApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    }
  })

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

  // Formatar data curta
  const formatarData = (dateStr: string) => {
    try {
      const [, month, day] = dateStr.split('-')
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                     'jul', 'ago', 'set', 'out', 'nov', 'dez']
      return `${day} ${meses[parseInt(month) - 1]}`
    } catch {
      return dateStr
    }
  }

  // Mudar data sem conversão de timezone
  const changeDate = (days: number) => {
    // Parse manual da data YYYY-MM-DD
    const [ano, mes, dia] = selectedDate.split('-').map(Number)
    const currentDate = new Date(ano, mes - 1, dia)
    currentDate.setDate(currentDate.getDate() + days)

    const novoAno = currentDate.getFullYear()
    const novoMes = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const novoDia = currentDate.getDate().toString().padStart(2, '0')
    setSelectedDate(`${novoAno}-${novoMes}-${novoDia}`)

    // Limpar filtros de data ao navegar
    setFiltros({ ...filtros, data_inicio: '', data_fim: '' })
  }

  // Atualizar status
  const handleUpdateStatus = async (id: number, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status })
  }

  // Cancelar
  const handleCancel = async (id: number) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await cancelMutation.mutateAsync(id)
    }
  }

  // Handler para criar agendamento
  const handleCreateAgendamento = async (data: any) => {
    try {
      console.log('Criando agendamento com dados:', data)
      await createMutation.mutateAsync(data)
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      // Erro já tratado no onError da mutation
    }
  }

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      data_inicio: '',
      data_fim: '',
      status: '',
      cliente_nome: ''
    })
  }

  const isToday = selectedDate === getDataHoje()
  const totalReceita = agendamentos.reduce((sum: number, a: any) => sum + (a.valor_total || 0), 0)

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

  const hasActiveFilters = filtros.data_inicio || filtros.data_fim || filtros.status || filtros.cliente_nome

  // Handler para abrir modal
  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  return (
    <MobileErrorBoundary>
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium active:bg-gray-200"
          >
            {showFilters ? '🔼 Filtros' : '🔽 Filtros'}
          </button>
        </div>

        {/* Filtros Colapsáveis */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtros</h3>
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
                Data Início
              </label>
              <input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              >
                <option value="">Todos</option>
                <option value="AGENDADO">Agendado</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="NAO_COMPARECEU">Não Compareceu</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente
              </label>
              <input
                type="text"
                value={filtros.cliente_nome}
                onChange={(e) => setFiltros({ ...filtros, cliente_nome: e.target.value })}
                placeholder="Digite o nome"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>
          </div>
        )}

        {/* Date Selector (só quando não tem filtros de data) */}
        {!filtros.data_inicio && !filtros.data_fim && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 active:bg-gray-100 rounded-full"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
              <div className="text-center flex-1">
                <p className="text-sm text-gray-600 capitalize">{formatarData(selectedDate)}</p>
                {isToday && (
                  <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Hoje
                  </span>
                )}
              </div>
              <button
                onClick={() => changeDate(1)}
                className="p-2 active:bg-gray-100 rounded-full"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}

        {/* Lista de Agendamentos */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Nenhum agendamento encontrado
            </div>
          ) : (
            agendamentos.map((agendamento: any) => (
              <div
                key={agendamento.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-3"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-bold text-blue-600">
                        {formatHora(agendamento.data_inicio)}
                      </span>
                      <span className="text-sm text-gray-500">
                        - {formatHora(agendamento.data_fim)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {agendamento.cliente?.nome || `Cliente #${agendamento.cliente_id}`}
                    </h3>
                    {agendamento.cliente?.telefone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <PhoneIcon className="w-4 h-4" />
                        {agendamento.cliente.telefone}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${getStatusColor(agendamento.status)}`}>
                    {agendamento.status === 'CONCLUIDO' && <CheckIcon className="w-3 h-3" />}
                    {agendamento.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Detalhes */}
                <div className="border-t pt-2">
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <WrenchScrewdriverIcon className="w-4 h-4" />
                    {agendamento.servico?.nome || `Serviço #${agendamento.servico_id}`}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {formatData(agendamento.data_inicio)}
                  </p>
                  <p className="text-sm font-bold text-green-600 mt-1 flex items-center gap-1">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    R$ {(agendamento.valor_final || agendamento.valor_total || 0).toFixed(2)}
                  </p>
                </div>

                {/* Ações Contextuais por Status */}
                {agendamento.status === 'AGENDADO' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleUpdateStatus(agendamento.id, 'CONFIRMADO')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium active:bg-green-700 disabled:bg-gray-400"
                    >
                      <CheckIcon className="w-4 h-4 inline" /> Confirmar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(agendamento.id, 'NAO_COMPARECEU')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium active:bg-gray-700 disabled:bg-gray-400"
                    >
                      ✗ Não Compareceu
                    </button>
                    <button
                      onClick={() => handleCancel(agendamento.id)}
                      disabled={cancelMutation.isPending}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 disabled:bg-gray-400"
                    >
                      🚫 Cancelar
                    </button>
                  </div>
                )}

                {agendamento.status === 'CONFIRMADO' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleUpdateStatus(agendamento.id, 'EM_ANDAMENTO')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700 disabled:bg-gray-400"
                    >
                      <PlayIcon className="w-4 h-4 inline" /> Iniciar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(agendamento.id, 'NAO_COMPARECEU')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium active:bg-gray-700 disabled:bg-gray-400"
                    >
                      ✗ Não Compareceu
                    </button>
                    <button
                      onClick={() => handleCancel(agendamento.id)}
                      disabled={cancelMutation.isPending}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 disabled:bg-gray-400"
                    >
                      🚫 Cancelar
                    </button>
                  </div>
                )}

                {agendamento.status === 'EM_ANDAMENTO' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleUpdateStatus(agendamento.id, 'CONCLUIDO')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium active:bg-green-700 disabled:bg-gray-400"
                    >
                      <CheckIcon className="w-4 h-4 inline" /> Finalizar
                    </button>
                    <button
                      onClick={() => handleCancel(agendamento.id)}
                      disabled={cancelMutation.isPending}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 disabled:bg-gray-400"
                    >
                      🚫 Cancelar
                    </button>
                  </div>
                )}

                {agendamento.status === 'NAO_COMPARECEU' && (
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleUpdateStatus(agendamento.id, 'CONFIRMADO')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium active:bg-green-700 disabled:bg-gray-400"
                    >
                      🔄 Reagendar
                    </button>
                    <button
                      onClick={() => handleCancel(agendamento.id)}
                      disabled={cancelMutation.isPending}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 disabled:bg-gray-400"
                    >
                      🚫 Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Resumo */}
        {agendamentos.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {agendamentos.length} agendamento{agendamentos.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Receita</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalReceita.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <MobileFAB onClick={handleOpenModal} />

      {/* Modal de Criação de Agendamento */}
      <MobileAgendamentoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateAgendamento}
        servicos={servicos}
        clientes={clientes}
        loading={createMutation.isPending}
      />
    </MobileLayout>
    </MobileErrorBoundary>
  )
}

export default MobileAgendamentosPage
