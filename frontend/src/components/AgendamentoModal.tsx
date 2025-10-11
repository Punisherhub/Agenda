import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Calendar, Clock, User, Scissors, DollarSign, MessageSquare } from 'lucide-react'
import { format, addMinutes } from 'date-fns'
import { Agendamento, AgendamentoCreate, Servico, Cliente } from '../types'

interface AgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: AgendamentoCreate) => Promise<void>
  agendamento?: Agendamento | null
  servicos: Servico[]
  clientes: Cliente[]
  selectedDate?: Date
  selectedEndDate?: Date
  preSelectedClienteId?: number | null
  loading?: boolean
}

const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agendamento,
  servicos,
  clientes,
  selectedDate,
  selectedEndDate,
  preSelectedClienteId = null,
  loading = false
}) => {
  const [clienteBusca, setClienteBusca] = useState('')
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([])
  // const [mostrarClienteForm, setMostrarClienteForm] = useState(false)
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AgendamentoCreate & {
    data_inicio_date: string
    data_inicio_time: string
    duracao_personalizada?: number
  }>()

  const watchServicoId = watch('servico_id')
  const watchDataInicio = watch('data_inicio_date')
  const watchHoraInicio = watch('data_inicio_time')

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (agendamento) {
        // Editando agendamento existente
        const dataInicio = new Date(agendamento.data_inicio)
        const dataFim = new Date(agendamento.data_fim)
        const duracaoMinutos = Math.round((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60))

        reset({
          cliente_id: agendamento.cliente_id,
          servico_id: agendamento.servico_id,
          data_inicio_date: format(dataInicio, 'yyyy-MM-dd'),
          data_inicio_time: format(dataInicio, 'HH:mm'),
          duracao_personalizada: duracaoMinutos,
          observacoes: agendamento.observacoes || '',
          valor_desconto: agendamento.valor_desconto || 0
        })
      } else {
        // Novo agendamento
        const dataDefault = selectedDate || new Date()
        const dataFimDefault = selectedEndDate || addMinutes(dataDefault, 60)
        const duracaoMinutos = selectedEndDate
          ? Math.round((dataFimDefault.getTime() - dataDefault.getTime()) / (1000 * 60))
          : 60

        reset({
          cliente_id: 0,
          servico_id: 0,
          data_inicio_date: format(dataDefault, 'yyyy-MM-dd'),
          data_inicio_time: format(dataDefault, 'HH:mm'),
          duracao_personalizada: duracaoMinutos,
          observacoes: '',
          valor_desconto: 0
        })
      }
    }
  }, [isOpen, agendamento, selectedDate, reset])

  // Atualizar serviço selecionado
  useEffect(() => {
    if (watchServicoId) {
      const servico = servicos.find(s => s.id === Number(watchServicoId))
      setServicoSelecionado(servico || null)
    }
  }, [watchServicoId, servicos])

  // Filtrar clientes baseado na busca
  useEffect(() => {
    if (clienteBusca.length >= 2) {
      const filtrados = clientes.filter(cliente =>
        cliente.nome.toLowerCase().includes(clienteBusca.toLowerCase()) ||
        cliente.telefone.includes(clienteBusca) ||
        (cliente.email && cliente.email.toLowerCase().includes(clienteBusca.toLowerCase()))
      )
      setClientesFiltrados(filtrados)
    } else {
      setClientesFiltrados([])
    }
  }, [clienteBusca, clientes])

  // Pré-selecionar cliente quando vem da página de clientes
  useEffect(() => {
    if (preSelectedClienteId && clientes.length > 0 && isOpen) {
      const cliente = clientes.find(c => c.id === preSelectedClienteId)
      if (cliente) {
        setValue('cliente_id', cliente.id)
        setClienteBusca(cliente.nome)
      }
    }
  }, [preSelectedClienteId, clientes, isOpen, setValue])

  const calcularDataFim = () => {
    if (!watchDataInicio || !watchHoraInicio) {
      return ''
    }

    const duracaoPersonalizada = watch('duracao_personalizada')
    if (!duracaoPersonalizada) {
      return ''
    }

    const dataInicio = new Date(`${watchDataInicio}T${watchHoraInicio}`)
    const dataFim = addMinutes(dataInicio, duracaoPersonalizada)
    return format(dataFim, 'HH:mm')
  }

  const calcularValorTotal = () => {
    if (!servicoSelecionado) return 0
    const valorDesconto = watch('valor_desconto') || 0
    return Math.max(0, servicoSelecionado.preco - valorDesconto)
  }

  const onSubmit = async (data: any) => {
    try {
      const dataInicio = new Date(`${data.data_inicio_date}T${data.data_inicio_time}`)
      const duracaoMinutos = Number(data.duracao_personalizada) || 60
      const dataFim = addMinutes(dataInicio, duracaoMinutos)

      const agendamentoData: AgendamentoCreate = {
        cliente_id: Number(data.cliente_id),
        servico_id: Number(data.servico_id),
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        observacoes: data.observacoes || undefined,
        valor_desconto: Number(data.valor_desconto) || undefined
      }

      await onSave(agendamentoData)
      onClose()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
    }
  }

  const selecionarCliente = (cliente: Cliente) => {
    setValue('cliente_id', cliente.id)
    setClienteBusca(cliente.nome)
    setClientesFiltrados([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {agendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Cliente *
            </label>
            <div className="relative">
              <input
                type="text"
                className="input w-full"
                placeholder="Buscar cliente por nome, telefone ou email..."
                value={clienteBusca}
                onChange={(e) => setClienteBusca(e.target.value)}
              />

              {/* Lista de clientes filtrados */}
              {clientesFiltrados.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                  {clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => selecionarCliente(cliente)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      <div className="font-medium">{cliente.nome}</div>
                      <div className="text-sm text-gray-500">
                        {cliente.telefone} {cliente.email && `• ${cliente.email}`}
                        {cliente.is_vip && <span className="text-yellow-600 ml-2">⭐ VIP</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Campo hidden para cliente_id */}
            <input type="hidden" {...register('cliente_id', { required: true, min: 1 })} />
            {errors.cliente_id && (
              <p className="text-red-500 text-sm mt-1">Selecione um cliente</p>
            )}
          </div>

          {/* Serviço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Scissors className="w-4 h-4 inline mr-1" />
              Serviço *
            </label>
            <select
              {...register('servico_id', { required: true, min: 1 })}
              className="input w-full"
            >
              <option value="">Selecione um serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome} - R$ {Number(servico.preco).toFixed(2)}
                  {servico.categoria && ` (${servico.categoria})`}
                </option>
              ))}
            </select>
            {errors.servico_id && (
              <p className="text-red-500 text-sm mt-1">Selecione um serviço</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                {...register('data_inicio_date', { required: true })}
                className="input w-full"
              />
              {errors.data_inicio_date && (
                <p className="text-red-500 text-sm mt-1">Selecione uma data</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário Início *
              </label>
              <input
                type="time"
                {...register('data_inicio_time', { required: true })}
                className="input w-full"
              />
              {errors.data_inicio_time && (
                <p className="text-red-500 text-sm mt-1">Selecione um horário</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duração (minutos) *
              </label>
              <input
                type="number"
                min="15"
                step="15"
                {...register('duracao_personalizada', { required: true, min: 15 })}
                className="input w-full"
                placeholder="60"
              />
              {errors.duracao_personalizada && (
                <p className="text-red-500 text-sm mt-1">Mínimo 15 minutos</p>
              )}
              {calcularDataFim() && (
                <p className="text-sm text-gray-600 mt-1">
                  Termina às: {calcularDataFim()}
                </p>
              )}
            </div>
          </div>

          {/* Informações do Serviço */}
          {servicoSelecionado && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Detalhes do Serviço</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Preço base:</span> R$ {Number(servicoSelecionado.preco).toFixed(2)}
                </div>
                {servicoSelecionado.categoria && (
                  <div>
                    <span className="text-blue-700">Categoria:</span> {servicoSelecionado.categoria}
                  </div>
                )}
                {servicoSelecionado.descricao && (
                  <div className="col-span-2">
                    <span className="text-blue-700">Descrição:</span> {servicoSelecionado.descricao}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desconto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Desconto (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('valor_desconto')}
              className="input w-full"
              placeholder="0.00"
            />
            {servicoSelecionado && (
              <p className="text-sm text-gray-600 mt-1">
                Valor final: R$ {calcularValorTotal().toFixed(2)}
              </p>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Observações
            </label>
            <textarea
              {...register('observacoes')}
              className="input w-full"
              rows={3}
              placeholder="Observações sobre o agendamento..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {agendamento ? 'Atualizar' : 'Criar'} Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgendamentoModal