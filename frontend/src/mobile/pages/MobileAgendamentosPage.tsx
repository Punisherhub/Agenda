import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agendamentosApi, servicosApi, clientesApi, materiaisApi } from '../../services/api'
import { Agendamento } from '../../types'
import MobileLayout from '../layouts/MobileLayout'
import MobileFAB from '../components/MobileFAB'
import MobileAgendamentoModal from '../components/MobileAgendamentoModal'
import MobileAgendamentoDetailModal from '../components/MobileAgendamentoDetailModal'
import MobileConsumoMaterialModal from '../components/MobileConsumoMaterialModal'
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isConsumoModalOpen, setIsConsumoModalOpen] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

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
    queryFn: async () => {
      const params: any = {}
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio
      else if (!filtros.data_fim) params.data_inicio = selectedDate

      if (filtros.data_fim) params.data_fim = filtros.data_fim
      else if (!filtros.data_inicio) params.data_fim = selectedDate

      if (filtros.status) params.status = filtros.status

      const result = await agendamentosApi.list(params)
      return result
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

  // Mutation deletar
  const deleteMutation = useMutation({
    mutationFn: agendamentosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    }
  })

  // Mutation atualizar agendamento
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => agendamentosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['agendamentos-calendario'] })
      setIsModalOpen(false)
      setIsEditMode(false)
      setSelectedAgendamento(null)
      alert('✅ Agendamento atualizado com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar agendamento:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao atualizar agendamento:\n${errorMsg}`)
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

  // Handler para criar/atualizar agendamento
  const handleCreateAgendamento = async (data: any) => {
    try {
      console.log('=== DEBUG AGENDAMENTO ===')
      console.log('isEditMode:', isEditMode)
      console.log('selectedAgendamento:', selectedAgendamento)
      console.log('Data recebida:', data)

      if (isEditMode && selectedAgendamento) {
        console.log('🔄 MODO EDICAO: Atualizando agendamento ID:', selectedAgendamento.id)
        console.log('Dados para UPDATE:', data)
        await updateMutation.mutateAsync({ id: selectedAgendamento.id, data })
      } else {
        console.log('➕ MODO CRIACAO: Criando novo agendamento')
        console.log('Dados para CREATE:', data)
        await createMutation.mutateAsync(data)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error)
      // Erro já tratado no onError da mutation
    }
  }

  // Handler para deletar
  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id)
  }

  // Handler para editar
  const handleEdit = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
    setIsEditMode(true)
    setIsDetailModalOpen(false)
    setIsModalOpen(true)
  }

  // Handler para abrir modal de detalhes
  const handleOpenDetail = (agendamento: any) => {
    setSelectedAgendamento(agendamento)
    setIsDetailModalOpen(true)
  }

  // Handler para concluir com materiais
  const handleConcluirComMateriais = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
    setIsDetailModalOpen(false)
    setIsConsumoModalOpen(true)
  }

  // Handler para salvar consumo de materiais
  const handleSalvarConsumo = async (consumosData: any[]) => {
    if (!selectedAgendamento) return

    try {
      // Registrar consumo de materiais
      if (consumosData.length > 0) {
        await materiaisApi.registrarConsumo(selectedAgendamento.id, consumosData)
      }

      // Atualizar status para CONCLUIDO
      await handleUpdateStatus(selectedAgendamento.id, 'CONCLUIDO')

      setIsConsumoModalOpen(false)
      setSelectedAgendamento(null)
      alert('✅ Agendamento concluído com sucesso!')
    } catch (error) {
      console.error('Erro ao registrar consumo:', error)
      throw error
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

  // Handler para abrir modal de criação
  const handleOpenModal = () => {
    setSelectedAgendamento(null)
    setIsEditMode(false)
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
                onClick={() => handleOpenDetail(agendamento)}
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

                {/* Botão de Ver Detalhes */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenDetail(agendamento)
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
                >
                  👁️ Ver Detalhes e Ações
                </button>
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

      {/* Modal de Criação/Edição de Agendamento */}
      <MobileAgendamentoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setIsEditMode(false)
          setSelectedAgendamento(null)
        }}
        onSave={handleCreateAgendamento}
        agendamento={isEditMode ? selectedAgendamento : null}
        servicos={servicos}
        clientes={clientes}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modal de Detalhes do Agendamento */}
      <MobileAgendamentoDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedAgendamento(null)
        }}
        agendamento={selectedAgendamento}
        servicos={servicos}
        clientes={clientes}
        onEdit={handleEdit}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onConcluirComMateriais={handleConcluirComMateriais}
        loading={updateStatusMutation.isPending || cancelMutation.isPending || deleteMutation.isPending}
      />

      {/* Modal de Consumo de Materiais */}
      <MobileConsumoMaterialModal
        isOpen={isConsumoModalOpen}
        onClose={() => {
          setIsConsumoModalOpen(false)
          setSelectedAgendamento(null)
        }}
        onSave={handleSalvarConsumo}
      />
    </MobileLayout>
    </MobileErrorBoundary>
  )
}

export default MobileAgendamentosPage
