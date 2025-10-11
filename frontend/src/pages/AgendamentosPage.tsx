import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agendamentosApi, servicosApi, clientesApi } from '../services/api'
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns'
import Calendar from '../components/Calendar'
import AgendamentoModal from '../components/AgendamentoModal'
import AgendamentoDetailModal from '../components/AgendamentoDetailModal'
import { Calendar as CalendarIcon, List } from 'lucide-react'
import { Agendamento, AgendamentoCreate } from '../types'

const AgendamentosPage: React.FC = () => {
  const location = useLocation()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [currentDate] = useState(new Date())

  // Modals
  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [preSelectedClienteId, setPreSelectedClienteId] = useState<number | null>(null)

  const [filtros, setFiltros] = useState({
    data_inicio: '',
    data_fim: '',
    status: '',
    cliente_nome: '',
    servico_nome: ''
  })

  const queryClient = useQueryClient()

  // Dados para o calendário (mês atual + margem)
  const calendarStart = format(subDays(startOfMonth(currentDate), 7), 'yyyy-MM-dd')
  const calendarEnd = format(addDays(endOfMonth(currentDate), 7), 'yyyy-MM-dd')

  const { data: agendamentosRaw, isLoading, refetch } = useQuery({
    queryKey: ['agendamentos', view === 'calendar' ? { data_inicio: calendarStart, data_fim: calendarEnd } : filtros],
    queryFn: () => {
      const params = view === 'calendar'
        ? { data_inicio: calendarStart, data_fim: calendarEnd }
        : {
            data_inicio: filtros.data_inicio || undefined,
            data_fim: filtros.data_fim || undefined,
            status: filtros.status || undefined,
          }
      return agendamentosApi.list(params)
    }
  })

  // Filtrar por nome de cliente e serviço no frontend
  const agendamentos = React.useMemo(() => {
    if (!agendamentosRaw?.agendamentos) return agendamentosRaw

    let filtered = agendamentosRaw.agendamentos

    // Filtrar por nome do cliente
    if (filtros.cliente_nome && view === 'list') {
      const searchTerm = filtros.cliente_nome.toLowerCase()
      filtered = filtered.filter((ag: any) =>
        ag.cliente?.nome?.toLowerCase().includes(searchTerm)
      )
    }

    // Filtrar por nome do serviço
    if (filtros.servico_nome && view === 'list') {
      const searchTerm = filtros.servico_nome.toLowerCase()
      filtered = filtered.filter((ag: any) =>
        ag.servico?.nome?.toLowerCase().includes(searchTerm)
      )
    }

    return {
      ...agendamentosRaw,
      agendamentos: filtered,
      total: filtered.length
    }
  }, [agendamentosRaw, filtros.cliente_nome, filtros.servico_nome, view])

  const { data: servicos = [] } = useQuery({
    queryKey: ['servicos'],
    queryFn: () => servicosApi.list()
  })

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', 'agendamentos-page'],
    queryFn: () => clientesApi.list({ limit: 100 })
  })

  // Detectar se veio da página de clientes com cliente pré-selecionado
  useEffect(() => {
    const state = location.state as { openModal?: boolean; clienteId?: number } | null
    if (state?.openModal && state?.clienteId) {
      setPreSelectedClienteId(state.clienteId)
      setSelectedSlot(null)
      setSelectedAgendamento(null)
      setShowAgendamentoModal(true)
      // Limpar o state para não reabrir o modal ao voltar
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // Mutations
  const createMutation = useMutation({
    mutationFn: agendamentosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
      setShowAgendamentoModal(false)
      setSelectedSlot(null)
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      agendamentosApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: agendamentosApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: agendamentosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
    }
  })

  // Handlers
  const handleSlotSelect = (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end })
    setSelectedAgendamento(null)
    setShowAgendamentoModal(true)
  }

  const handleEventSelect = (event: any) => {
    setSelectedAgendamento(event.resource)
    setShowDetailModal(true)
  }

  const handleCreateAgendamento = (data: { start: Date; end: Date }) => {
    setSelectedSlot(data)
    setSelectedAgendamento(null)
    setShowAgendamentoModal(true)
  }

  const handleSaveAgendamento = async (data: AgendamentoCreate) => {
    await createMutation.mutateAsync(data)
  }

  const handleEditAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
    setShowDetailModal(false)
    setShowAgendamentoModal(true)
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    await updateStatusMutation.mutateAsync({ id, status })
  }

  const handleCancel = async (id: number) => {
    await cancelMutation.mutateAsync(id)
  }

  const handleDelete = async (id: number) => {
    console.log('handleDelete chamado com ID:', id)
    try {
      await deleteMutation.mutateAsync(id)
      console.log('Mutation executada com sucesso')
    } catch (error) {
      console.error('Erro na mutation:', error)
      throw error
    }
  }

  // Handlers para drag and drop no calendário
  const handleEventResize = async (data: { event: any; start: Date; end: Date }) => {
    const agendamento = data.event.resource
    const queryKey = ['agendamentos', view === 'calendar' ? { data_inicio: calendarStart, data_fim: calendarEnd } : filtros]

    // Snapshot do estado anterior para rollback
    const previousData = queryClient.getQueryData(queryKey)

    try {
      // 🚀 OPTIMISTIC UPDATE - Atualiza imediatamente a UI
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.agendamentos) return old

        return {
          ...old,
          agendamentos: old.agendamentos.map((a: Agendamento) =>
            a.id === agendamento.id
              ? { ...a, data_inicio: data.start.toISOString(), data_fim: data.end.toISOString() }
              : a
          )
        }
      })

      // Enviar para a API em background
      const agendamentoData = {
        cliente_id: agendamento.cliente_id,
        servico_id: agendamento.servico_id,
        data_inicio: data.start.toISOString(),
        data_fim: data.end.toISOString(),
        observacoes: agendamento.observacoes,
        valor_desconto: agendamento.valor_desconto
      }

      await agendamentosApi.update(agendamento.id, agendamentoData)

      // Revalidar dados em background (sem await)
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
    } catch (error) {
      console.error('Erro ao redimensionar agendamento:', error)

      // ⏪ ROLLBACK - Reverte para o estado anterior
      queryClient.setQueryData(queryKey, previousData)

      // Opcional: Mostrar notificação de erro ao usuário
      alert('Erro ao redimensionar agendamento. Tente novamente.')
    }
  }

  const handleEventDrop = async (data: { event: any; start: Date; end: Date }) => {
    const agendamento = data.event.resource
    const queryKey = ['agendamentos', view === 'calendar' ? { data_inicio: calendarStart, data_fim: calendarEnd } : filtros]

    // Snapshot do estado anterior para rollback
    const previousData = queryClient.getQueryData(queryKey)

    // Calcular nova data_fim mantendo a duração original
    const duracao = agendamento.data_fim
      ? new Date(agendamento.data_fim).getTime() - new Date(agendamento.data_inicio).getTime()
      : 60 * 60 * 1000 // 1 hora padrão

    const novaDataFim = new Date(data.start.getTime() + duracao)

    try {
      // 🚀 OPTIMISTIC UPDATE - Atualiza imediatamente a UI
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.agendamentos) return old

        return {
          ...old,
          agendamentos: old.agendamentos.map((a: Agendamento) =>
            a.id === agendamento.id
              ? { ...a, data_inicio: data.start.toISOString(), data_fim: novaDataFim.toISOString() }
              : a
          )
        }
      })

      // Enviar para a API em background
      const agendamentoData = {
        cliente_id: agendamento.cliente_id,
        servico_id: agendamento.servico_id,
        data_inicio: data.start.toISOString(),
        data_fim: novaDataFim.toISOString(),
        observacoes: agendamento.observacoes,
        valor_desconto: agendamento.valor_desconto
      }

      await agendamentosApi.update(agendamento.id, agendamentoData)

      // Revalidar dados em background (sem await)
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
    } catch (error) {
      console.error('Erro ao mover agendamento:', error)

      // ⏪ ROLLBACK - Reverte para o estado anterior
      queryClient.setQueryData(queryKey, previousData)

      // Opcional: Mostrar notificação de erro ao usuário
      alert('Erro ao mover agendamento. Tente novamente.')
    }
  }

  const handleUpdateStatusOld = async (id: number, novoStatus: string) => {
    try {
      await agendamentosApi.updateStatus(id, novoStatus)
      refetch()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  const handleCancelOld = async (id: number) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        await agendamentosApi.cancel(id)
        refetch()
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>

        <div className="flex items-center space-x-3">
          {/* Toggle View */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                view === 'calendar'
                  ? 'bg-white shadow-sm text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendário
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center ${
                view === 'list'
                  ? 'bg-white shadow-sm text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedSlot(null)
              setSelectedAgendamento(null)
              setShowAgendamentoModal(true)
            }}
            className="btn-primary px-4 py-2"
          >
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Filtros - só mostra na view de lista */}
      {view === 'list' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              className="input"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              className="input"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input"
              value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
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
              className="input"
              placeholder="Digite o nome"
              value={filtros.cliente_nome}
              onChange={(e) => setFiltros({ ...filtros, cliente_nome: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Serviço
            </label>
            <input
              type="text"
              className="input"
              placeholder="Digite o nome"
              value={filtros.servico_nome}
              onChange={(e) => setFiltros({ ...filtros, servico_nome: e.target.value })}
            />
          </div>
        </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      {view === 'calendar' ? (
        <Calendar
          agendamentos={agendamentos?.agendamentos || []}
          servicos={servicos?.servicos || []}
          clientes={clientes?.clientes || []}
          onSelectSlot={handleSlotSelect}
          onSelectEvent={handleEventSelect}
          onCreateAgendamento={handleCreateAgendamento}
          onEventResize={handleEventResize}
          onEventDrop={handleEventDrop}
          loading={isLoading}
        />
      ) : (
        /* Lista de agendamentos */
        <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Lista de Agendamentos
            {agendamentos && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({agendamentos.total} total)
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <p className="text-gray-500">Carregando agendamentos...</p>
            </div>
          ) : agendamentos?.agendamentos?.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-500">Nenhum agendamento encontrado</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agendamentos?.agendamentos?.map((agendamento: any) => (
                  <tr key={agendamento.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {agendamento.cliente?.nome || `Cliente #${agendamento.cliente_id}`}
                      </div>
                      {agendamento.cliente?.telefone && (
                        <div className="text-sm text-gray-500">
                          {agendamento.cliente.telefone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {agendamento.servico?.nome || `Serviço #${agendamento.servico_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(agendamento.data_inicio), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(agendamento.data_inicio), 'HH:mm')} às{' '}
                        {format(new Date(agendamento.data_fim), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          agendamento.status === 'AGENDADO'
                            ? 'bg-blue-100 text-blue-800'
                            : agendamento.status === 'CONFIRMADO'
                            ? 'bg-green-100 text-green-800'
                            : agendamento.status === 'EM_ANDAMENTO'
                            ? 'bg-yellow-100 text-yellow-800'
                            : agendamento.status === 'CONCLUIDO'
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : agendamento.status === 'CANCELADO'
                            ? 'bg-red-100 text-red-800'
                            : agendamento.status === 'NAO_COMPARECEU'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {agendamento.status === 'CONCLUIDO' && '✓ '}
                        {agendamento.status.replace('_', ' ')}
                        {agendamento.status === 'CONCLUIDO' && ' ✓'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {Number(agendamento.valor_final || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-1">
                      {agendamento.status === 'AGENDADO' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatusOld(agendamento.id, 'CONFIRMADO')}
                            className="btn-success px-2 py-1 text-xs"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleUpdateStatusOld(agendamento.id, 'NAO_COMPARECEU')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 text-xs rounded"
                          >
                            Não Compareceu
                          </button>
                          <button
                            onClick={() => handleCancelOld(agendamento.id)}
                            className="btn-danger px-2 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {agendamento.status === 'CONFIRMADO' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatusOld(agendamento.id, 'EM_ANDAMENTO')}
                            className="btn-primary px-2 py-1 text-xs"
                          >
                            Iniciar
                          </button>
                          <button
                            onClick={() => handleUpdateStatusOld(agendamento.id, 'NAO_COMPARECEU')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 text-xs rounded"
                          >
                            Não Compareceu
                          </button>
                          <button
                            onClick={() => handleCancelOld(agendamento.id)}
                            className="btn-danger px-2 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {agendamento.status === 'EM_ANDAMENTO' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatusOld(agendamento.id, 'CONCLUIDO')}
                            className="btn-success px-2 py-1 text-xs"
                          >
                            Finalizar
                          </button>
                          <button
                            onClick={() => handleCancelOld(agendamento.id)}
                            className="btn-danger px-2 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      {agendamento.status === 'NAO_COMPARECEU' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatusOld(agendamento.id, 'CONFIRMADO')}
                            className="btn-success px-2 py-1 text-xs"
                          >
                            Reagendar
                          </button>
                          <button
                            onClick={() => handleCancelOld(agendamento.id)}
                            className="btn-danger px-2 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      )}

      {/* Modals */}
      <AgendamentoModal
        isOpen={showAgendamentoModal}
        onClose={() => {
          setShowAgendamentoModal(false)
          setSelectedSlot(null)
          setSelectedAgendamento(null)
          setPreSelectedClienteId(null)
        }}
        onSave={handleSaveAgendamento}
        agendamento={selectedAgendamento}
        servicos={servicos?.servicos || []}
        clientes={clientes?.clientes || []}
        selectedDate={selectedSlot?.start}
        selectedEndDate={selectedSlot?.end}
        preSelectedClienteId={preSelectedClienteId}
        loading={createMutation.isPending}
      />

      <AgendamentoDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAgendamento(null)
        }}
        agendamento={selectedAgendamento}
        servicos={servicos?.servicos || []}
        clientes={clientes?.clientes || []}
        onEdit={handleEditAgendamento}
        onUpdateStatus={handleUpdateStatus}
        onCancel={handleCancel}
        onDelete={handleDelete}
        loading={updateStatusMutation.isPending || cancelMutation.isPending || deleteMutation.isPending}
      />
    </div>
  )
}

export default AgendamentosPage