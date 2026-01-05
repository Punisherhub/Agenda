import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, Calendar, Clock, User, Scissors, DollarSign, MessageSquare, Gift } from 'lucide-react'
import { format, addMinutes } from 'date-fns'
import { Agendamento, AgendamentoCreate, Servico, Cliente, PremioDisponivel } from '../types'
import { fidelidadeApi } from '../services/api'

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
  const [isServicoPersonalizado, setIsServicoPersonalizado] = useState(false)
  const [premiosDisponiveis, setPremiosDisponiveis] = useState<PremioDisponivel[]>([])
  const [premioSelecionado, setPremioSelecionado] = useState<number | null>(null)
  const [loadingPremios, setLoadingPremios] = useState(false)

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
    data_fim_time: string
  }>({
    defaultValues: {
      servico_personalizado: false
    }
  })

  const watchServicoId = watch('servico_id')
  const watchDataInicio = watch('data_inicio_date')
  const watchHoraInicio = watch('data_inicio_time')
  const watchHoraFim = watch('data_fim_time')
  const watchServicoPersonalizado = watch('servico_personalizado')
  const watchValorServicoPersonalizado = watch('valor_servico_personalizado')

  // Reset form quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      if (agendamento) {
        // Editando agendamento existente
        const dataInicio = new Date(agendamento.data_inicio)
        const dataFim = new Date(agendamento.data_fim)

        const isPersonalizado = agendamento.servico_personalizado || false
        setIsServicoPersonalizado(isPersonalizado)

        reset({
          cliente_id: agendamento.cliente_id,
          servico_id: agendamento.servico_id || undefined,
          data_inicio_date: format(dataInicio, 'yyyy-MM-dd'),
          data_inicio_time: format(dataInicio, 'HH:mm'),
          data_fim_time: format(dataFim, 'HH:mm'),
          observacoes: agendamento.observacoes || '',
          veiculo: agendamento.veiculo || '',
          valor_desconto: agendamento.valor_desconto || 0,
          servico_personalizado: isPersonalizado,
          servico_personalizado_nome: agendamento.servico_personalizado_nome || '',
          servico_personalizado_descricao: agendamento.servico_personalizado_descricao || '',
          valor_servico_personalizado: agendamento.valor_servico || undefined
        })
      } else {
        // Novo agendamento
        const dataDefault = selectedDate || new Date()
        const dataFimDefault = selectedEndDate || addMinutes(dataDefault, 60)

        setIsServicoPersonalizado(false)
        reset({
          cliente_id: 0,
          servico_id: undefined,
          data_inicio_date: format(dataDefault, 'yyyy-MM-dd'),
          data_inicio_time: format(dataDefault, 'HH:mm'),
          data_fim_time: format(dataFimDefault, 'HH:mm'),
          observacoes: '',
          veiculo: '',
          valor_desconto: 0,
          servico_personalizado: false,
          servico_personalizado_nome: '',
          servico_personalizado_descricao: '',
          valor_servico_personalizado: undefined
        })
      }

      // Limpar estado de prêmios
      setPremiosDisponiveis([])
      setPremioSelecionado(null)
      setLoadingPremios(false)
    }
  }, [isOpen, agendamento, selectedDate, selectedEndDate, reset])

  // Atualizar serviço selecionado
  useEffect(() => {
    if (watchServicoId && !isServicoPersonalizado) {
      const servico = servicos.find(s => s.id === Number(watchServicoId))
      setServicoSelecionado(servico || null)
    } else {
      setServicoSelecionado(null)
    }
  }, [watchServicoId, servicos, isServicoPersonalizado])

  // Sincronizar estado do checkbox com o form
  useEffect(() => {
    const isPersonalizado = watchServicoPersonalizado || false
    setIsServicoPersonalizado(isPersonalizado)

    // Limpar campos quando alternar entre personalizado e não personalizado
    if (isPersonalizado) {
      setValue('servico_id', undefined)
    } else {
      setValue('servico_personalizado_nome', '')
      setValue('servico_personalizado_descricao', '')
      setValue('valor_servico_personalizado', undefined)
    }
  }, [watchServicoPersonalizado, setValue])

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

  // Carregar prêmios disponíveis quando cliente é selecionado
  const watchClienteId = watch('cliente_id')
  useEffect(() => {
    const loadPremios = async () => {
      if (!watchClienteId || watchClienteId === 0) {
        setPremiosDisponiveis([])
        setPremioSelecionado(null)
        return
      }

      setLoadingPremios(true)
      try {
        const premios = await fidelidadeApi.listarPremiosDisponiveis(watchClienteId)
        setPremiosDisponiveis(premios)
      } catch (error) {
        console.error('Erro ao carregar prêmios:', error)
        setPremiosDisponiveis([])
      } finally {
        setLoadingPremios(false)
      }
    }

    loadPremios()
  }, [watchClienteId])

  // Calcular e aplicar desconto automaticamente quando prêmio é selecionado
  useEffect(() => {
    if (!premioSelecionado) {
      // Se nenhum prêmio selecionado, limpar desconto
      setValue('valor_desconto', 0)
      return
    }

    const premio = premiosDisponiveis.find(p => p.premio.id === premioSelecionado)?.premio
    if (!premio) {
      setValue('valor_desconto', 0)
      return
    }

    // Calcular valor base do serviço
    let valorBase = 0
    if (isServicoPersonalizado) {
      valorBase = Number(watchValorServicoPersonalizado) || 0
    } else if (servicoSelecionado) {
      valorBase = servicoSelecionado.preco
    }

    if (valorBase === 0) {
      setValue('valor_desconto', 0)
      return
    }

    // Calcular desconto baseado no tipo de prêmio
    let valorDesconto = 0

    if (premio.tipo_premio === 'DESCONTO_PERCENTUAL' && premio.valor_desconto) {
      // Desconto percentual: ex: 10% de R$ 100 = R$ 10
      valorDesconto = (valorBase * Number(premio.valor_desconto)) / 100
    } else if (premio.tipo_premio === 'DESCONTO_FIXO' && premio.valor_desconto) {
      // Desconto fixo: ex: R$ 20 de desconto
      valorDesconto = Number(premio.valor_desconto)
    } else if (premio.tipo_premio === 'SERVICO_GRATIS') {
      // Serviço grátis: desconto = valor total
      valorDesconto = valorBase
    }

    // Aplicar desconto no formulário (não pode ser maior que o valor base)
    const descontoFinal = Math.min(valorDesconto, valorBase)
    setValue('valor_desconto', descontoFinal)

    console.log(`[PREMIO] Desconto calculado: R$ ${Number(descontoFinal).toFixed(2)} (Tipo: ${premio.tipo_premio}, Base: R$ ${Number(valorBase).toFixed(2)})`)

  }, [premioSelecionado, premiosDisponiveis, isServicoPersonalizado, watchValorServicoPersonalizado, servicoSelecionado, setValue])

  // Calcular duração em minutos
  const calcularDuracao = () => {
    if (!watchDataInicio || !watchHoraInicio || !watchHoraFim) {
      return ''
    }

    try {
      const [horaIni, minIni] = watchHoraInicio.split(':').map(Number)
      const [horaFim, minFim] = watchHoraFim.split(':').map(Number)

      const minutosTotaisIni = horaIni * 60 + minIni
      const minutosTotaisFim = horaFim * 60 + minFim

      const duracao = minutosTotaisFim - minutosTotaisIni

      if (duracao <= 0) {
        return 'Horário de término deve ser após o início'
      }

      const horas = Math.floor(duracao / 60)
      const minutos = duracao % 60

      if (horas > 0 && minutos > 0) {
        return `${horas}h ${minutos}min`
      } else if (horas > 0) {
        return `${horas}h`
      } else {
        return `${minutos}min`
      }
    } catch {
      return ''
    }
  }

  const calcularValorTotal = () => {
    let valorBase = 0

    if (isServicoPersonalizado) {
      valorBase = Number(watchValorServicoPersonalizado) || 0
    } else if (servicoSelecionado) {
      valorBase = servicoSelecionado.preco
    }

    const valorDesconto = watch('valor_desconto') || 0
    return Math.max(0, valorBase - valorDesconto)
  }

  const onSubmit = async (data: any) => {
    try {
      // Validar que hora fim > hora início
      const [horaIni, minIni] = data.data_inicio_time.split(':').map(Number)
      const [horaFim, minFim] = data.data_fim_time.split(':').map(Number)
      const minutosTotaisIni = horaIni * 60 + minIni
      const minutosTotaisFim = horaFim * 60 + minFim

      if (minutosTotaisFim <= minutosTotaisIni) {
        alert('Horário de término deve ser após o horário de início')
        return
      }

      // IMPORTANTE: Enviar datetime SEM timezone (naive)
      // Backend vai assumir que é hora do Brasil e adicionar timezone correto
      const dataInicioISO = `${data.data_inicio_date}T${data.data_inicio_time}:00`
      const dataFimISO = `${data.data_inicio_date}T${data.data_fim_time}:00`

      const agendamentoData: any = {
        cliente_id: Number(data.cliente_id),
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        observacoes: data.observacoes || undefined,
        veiculo: data.veiculo || undefined,
        valor_desconto: Number(data.valor_desconto) || 0
      }

      // Adicionar campos específicos baseado no tipo de serviço
      if (isServicoPersonalizado) {
        agendamentoData.servico_id = null  // Enviar null explicitamente
        agendamentoData.servico_personalizado = true
        agendamentoData.servico_personalizado_nome = data.servico_personalizado_nome
        agendamentoData.servico_personalizado_descricao = data.servico_personalizado_descricao || undefined
        agendamentoData.valor_servico_personalizado = Number(data.valor_servico_personalizado)
      } else {
        agendamentoData.servico_id = Number(data.servico_id)
        agendamentoData.servico_personalizado = false
      }

      console.log('Dados sendo enviados:', JSON.stringify(agendamentoData, null, 2)) // Debug
      await onSave(agendamentoData)

      // Se há prêmio selecionado, resgatar automaticamente
      if (premioSelecionado && Number(data.cliente_id)) {
        try {
          console.log('Resgatando prêmio:', premioSelecionado)
          await fidelidadeApi.resgatarPremio({
            cliente_id: Number(data.cliente_id),
            premio_id: premioSelecionado,
            pontos_utilizados: premiosDisponiveis.find(p => p.premio.id === premioSelecionado)?.premio.pontos_necessarios || 0
          })
          console.log('Prêmio resgatado com sucesso!')
        } catch (premioError: any) {
          console.error('Erro ao resgatar prêmio:', premioError)
          // Não bloqueia o agendamento se o resgate falhar
          alert(`Agendamento criado com sucesso, mas houve um erro ao resgatar o prêmio: ${premioError.response?.data?.detail || 'Erro desconhecido'}`)
        }
      }

      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error)
      console.error('Detalhes do erro:', JSON.stringify(error.response?.data, null, 2)) // Ver detalhes do erro 422

      // Mostrar erro para o usuário
      if (error.response?.data?.detail) {
        const errorMsg = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join('\n')
          : error.response.data.detail
        alert(`Erro ao criar agendamento:\n${errorMsg}`)
      }
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6" autoComplete="off">
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
                autoComplete="off"
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

          {/* Toggle Serviço Personalizado */}
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="servico_personalizado"
              {...register('servico_personalizado')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="servico_personalizado" className="text-sm font-medium text-gray-700 cursor-pointer">
              Serviço Personalizado
            </label>
            <span className="text-xs text-gray-500">(Marque para criar um serviço específico)</span>
          </div>

          {/* Serviço Predefinido */}
          {!isServicoPersonalizado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scissors className="w-4 h-4 inline mr-1" />
                Serviço *
              </label>
              <select
                {...register('servico_id', { required: !isServicoPersonalizado, min: 1 })}
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
          )}

          {/* Campos de Serviço Personalizado */}
          {isServicoPersonalizado && (
            <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900">Detalhes do Serviço Personalizado</h4>

              {/* Nome do Serviço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  {...register('servico_personalizado_nome', {
                    required: isServicoPersonalizado ? 'Nome do serviço é obrigatório' : false
                  })}
                  className="input w-full"
                  placeholder="Ex: Corte especial, Tratamento customizado..."
                  autoComplete="off"
                />
                {errors.servico_personalizado_nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.servico_personalizado_nome.message}</p>
                )}
              </div>

              {/* Descrição do Serviço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (Opcional)
                </label>
                <textarea
                  {...register('servico_personalizado_descricao')}
                  className="input w-full"
                  rows={2}
                  placeholder="Descreva o serviço personalizado..."
                />
              </div>

              {/* Valor do Serviço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Valor do Serviço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor_servico_personalizado', {
                    required: isServicoPersonalizado ? 'Valor do serviço é obrigatório' : false,
                    min: { value: 0, message: 'Valor deve ser maior ou igual a zero' }
                  })}
                  className="input w-full"
                  placeholder="0.00"
                  autoComplete="off"
                />
                {errors.valor_servico_personalizado && (
                  <p className="text-red-500 text-sm mt-1">{errors.valor_servico_personalizado.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Veículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Veículo (Modelo e Placa)
            </label>
            <input
              type="text"
              {...register('veiculo')}
              className="input w-full"
              placeholder="Ex: Honda Civic - ABC1234"
            />
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
                Horário Término *
              </label>
              <input
                type="time"
                {...register('data_fim_time', { required: true })}
                className="input w-full"
              />
              {errors.data_fim_time && (
                <p className="text-red-500 text-sm mt-1">Selecione um horário</p>
              )}
              {calcularDuracao() && !calcularDuracao().includes('deve ser') && (
                <p className="text-sm text-gray-600 mt-1">
                  Duração: {calcularDuracao()}
                </p>
              )}
              {calcularDuracao().includes('deve ser') && (
                <p className="text-sm text-red-600 mt-1">
                  {calcularDuracao()}
                </p>
              )}
            </div>
          </div>

          {/* Informações do Serviço */}
          {(servicoSelecionado || (isServicoPersonalizado && watchValorServicoPersonalizado)) && (
            <div className={`border rounded-lg p-4 ${isServicoPersonalizado ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
              <h4 className={`font-medium mb-2 ${isServicoPersonalizado ? 'text-purple-900' : 'text-blue-900'}`}>
                Resumo do Serviço
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={isServicoPersonalizado ? 'text-purple-700' : 'text-blue-700'}>Preço base:</span> R${' '}
                  {isServicoPersonalizado
                    ? Number(watchValorServicoPersonalizado || 0).toFixed(2)
                    : Number(servicoSelecionado?.preco || 0).toFixed(2)}
                </div>
                {!isServicoPersonalizado && servicoSelecionado?.categoria && (
                  <div>
                    <span className="text-blue-700">Categoria:</span> {servicoSelecionado.categoria}
                  </div>
                )}
                {!isServicoPersonalizado && servicoSelecionado?.descricao && (
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
              {premioSelecionado && (
                <span className="ml-2 text-xs text-green-600 font-medium">
                  (Aplicado via prêmio)
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('valor_desconto')}
              className={`input w-full ${premioSelecionado ? 'bg-green-50 border-green-300' : ''}`}
              placeholder="0.00"
              autoComplete="off"
              readOnly={!!premioSelecionado}
            />
            {premioSelecionado && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Desconto automático aplicado pelo prêmio selecionado
              </p>
            )}
            {(servicoSelecionado || (isServicoPersonalizado && watchValorServicoPersonalizado)) && (
              <p className="text-sm text-gray-900 font-medium mt-1">
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

          {/* Prêmios de Fidelidade */}
          {watchClienteId && watchClienteId !== 0 && (
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Gift className="w-4 h-4 inline mr-1" />
                Prêmios de Fidelidade
              </label>

              {loadingPremios ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Carregando prêmios...</span>
                </div>
              ) : premiosDisponiveis.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-gray-600">Cliente não possui pontos suficientes para resgatar prêmios no momento.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {premiosDisponiveis.map((premioDisp) => {
                    const premio = premioDisp.premio
                    const podResgatar = premioDisp.pode_resgatar
                    const pontosFaltantes = premioDisp.pontos_faltantes

                    return (
                      <div
                        key={premio.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          premioSelecionado === premio.id
                            ? 'border-blue-500 bg-blue-50'
                            : podResgatar
                            ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (podResgatar) {
                            setPremioSelecionado(premioSelecionado === premio.id ? null : premio.id)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h5 className="font-medium text-gray-900">{premio.nome}</h5>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                podResgatar ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {podResgatar ? 'Disponível' : `Faltam ${pontosFaltantes} pts`}
                              </span>
                            </div>
                            {premio.descricao && (
                              <p className="text-sm text-gray-600 mt-1">{premio.descricao}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <span className="text-gray-700">
                                <strong>{premio.pontos_necessarios}</strong> pontos
                              </span>
                              {premio.tipo_premio === 'DESCONTO_PERCENTUAL' && premio.valor_desconto && (
                                <span className="text-blue-600 font-medium">
                                  {premio.valor_desconto}% de desconto
                                </span>
                              )}
                              {premio.tipo_premio === 'DESCONTO_FIXO' && premio.valor_desconto && (
                                <span className="text-blue-600 font-medium">
                                  R$ {Number(premio.valor_desconto).toFixed(2)} de desconto
                                </span>
                              )}
                              {premio.tipo_premio === 'SERVICO_GRATIS' && (
                                <span className="text-green-600 font-medium">
                                  Serviço grátis
                                </span>
                              )}
                            </div>
                          </div>
                          {premioSelecionado === premio.id && podResgatar && (
                            <div className="ml-4">
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {premioSelecionado && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Prêmio selecionado - Desconto aplicado automaticamente
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    O prêmio será resgatado ao criar o agendamento e os pontos serão deduzidos do cliente
                  </p>
                </div>
              )}
            </div>
          )}

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