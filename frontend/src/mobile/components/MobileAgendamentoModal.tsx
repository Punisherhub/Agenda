import React, { useState, useEffect } from 'react'
import MobileModal from './MobileModal'
import { Agendamento, Cliente, Servico, PremioDisponivel } from '../../types'
import { fidelidadeApi } from '../../services/api'
import {
  UserIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface MobileAgendamentoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  agendamento?: Agendamento | null
  servicos: Servico[]
  clientes: Cliente[]
  loading?: boolean
  clientePreSelecionado?: Cliente | null
}

const MobileAgendamentoModal: React.FC<MobileAgendamentoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agendamento = null,
  servicos,
  clientes,
  loading = false,
  clientePreSelecionado = null
}) => {
  // Form state
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [clienteBusca, setClienteBusca] = useState('')
  const [showClienteList, setShowClienteList] = useState(false)
  const [servicoId, setServicoId] = useState<number | null>(null)
  const [isServicoPersonalizado, setIsServicoPersonalizado] = useState(false)
  const [servicoPersonalizadoNome, setServicoPersonalizadoNome] = useState('')
  const [servicoPersonalizadoDescricao, setServicoPersonalizadoDescricao] = useState('')
  const [valorServicoPersonalizado, setValorServicoPersonalizado] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [valorDesconto, setValorDesconto] = useState('0')
  const [observacoes, setObservacoes] = useState('')

  // Fidelidade
  const [premiosDisponiveis, setPremiosDisponiveis] = useState<PremioDisponivel[]>([])
  const [premioSelecionado, setPremioSelecionado] = useState<number | null>(null)
  const [pontosCliente, setPontosCliente] = useState<number>(0)

  // Estado derivado
  const servicoSelecionado = servicos.find(s => s.id === servicoId)
  const clientesFiltrados = clienteBusca.length >= 2
    ? clientes.filter(c =>
        c.nome.toLowerCase().includes(clienteBusca.toLowerCase()) ||
        c.telefone.includes(clienteBusca) ||
        (c.email && c.email.toLowerCase().includes(clienteBusca.toLowerCase()))
      )
    : []

  // Reset form quando modal abre ou agendamento muda
  useEffect(() => {
    if (isOpen) {
      try {
        console.log('MOBILE MODAL - useEffect executado')
        console.log('  agendamento recebido:', agendamento)

        if (agendamento) {
          console.log('MODO EDICAO - Preenchendo com dados do agendamento ID:', agendamento.id)
          // Modo edição - preencher com dados do agendamento
          const cliente = clientes.find(c => c.id === agendamento.cliente_id)
          setClienteId(agendamento.cliente_id)
          setClienteBusca(cliente?.nome || '')
          setServicoId(agendamento.servico_id)

          // Extrair data e hora do ISO string
          const dataInicioMatch = agendamento.data_inicio.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
          const dataFimMatch = agendamento.data_fim.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)

          if (dataInicioMatch) {
            setDataInicio(`${dataInicioMatch[1]}-${dataInicioMatch[2]}-${dataInicioMatch[3]}`)
            setHoraInicio(`${dataInicioMatch[4]}:${dataInicioMatch[5]}`)
          }

          if (dataFimMatch) {
            setHoraFim(`${dataFimMatch[4]}:${dataFimMatch[5]}`)
          }

          setValorDesconto(agendamento.valor_desconto.toString())
          setObservacoes(agendamento.observacoes || '')
          setIsServicoPersonalizado(false)
        } else {
          // Modo criação - preencher com valores padrão (usando horário local, não UTC)
          const hoje = new Date()
          const ano = hoje.getFullYear()
          const mes = (hoje.getMonth() + 1).toString().padStart(2, '0')
          const dia = hoje.getDate().toString().padStart(2, '0')
          const dataHoje = `${ano}-${mes}-${dia}`
          const horas = hoje.getHours().toString().padStart(2, '0')
          const minutos = hoje.getMinutes().toString().padStart(2, '0')
          const horaAtual = `${horas}:${minutos}`

          // Se há cliente pré-selecionado, usar ele
          if (clientePreSelecionado) {
            setClienteId(clientePreSelecionado.id)
            setClienteBusca(clientePreSelecionado.nome)
          } else {
            setClienteId(null)
            setClienteBusca('')
          }
          setServicoId(null)
          setIsServicoPersonalizado(false)
          setServicoPersonalizadoNome('')
          setServicoPersonalizadoDescricao('')
          setValorServicoPersonalizado('')
          setDataInicio(dataHoje)
          setHoraInicio(horaAtual)
          setHoraFim('')
          setValorDesconto('0')
          setObservacoes('')
        }
        setShowClienteList(false)
      } catch (error) {
        console.error('Erro ao resetar form:', error)
      }
    }
  }, [isOpen, agendamento, clientes, clientePreSelecionado])

  // Buscar prêmios disponíveis quando cliente for selecionado
  useEffect(() => {
    const fetchPremios = async () => {
      if (clienteId) {
        try {
          const premios = await fidelidadeApi.listarPremiosDisponiveis(clienteId)
          setPremiosDisponiveis(premios)
          // Buscar pontos do cliente
          const clienteSelecionado = clientes.find(c => c.id === clienteId)
          setPontosCliente(clienteSelecionado?.pontos || 0)
        } catch (error) {
          console.error('Erro ao buscar prêmios:', error)
          setPremiosDisponiveis([])
          setPontosCliente(0)
        }
      } else {
        setPremiosDisponiveis([])
        setPontosCliente(0)
        setPremioSelecionado(null)
      }
    }

    fetchPremios()
  }, [clienteId, clientes])

  // Aplicar desconto do prêmio
  useEffect(() => {
    if (!premioSelecionado || premiosDisponiveis.length === 0) {
      return
    }

    const premio = premiosDisponiveis.find(p => p.premio.id === premioSelecionado)?.premio
    if (!premio) {
      return
    }

    let valorBase = 0
    if (isServicoPersonalizado) {
      valorBase = Number(valorServicoPersonalizado) || 0
    } else if (servicoSelecionado) {
      valorBase = Number(servicoSelecionado.preco) || 0
    }

    let descontoFinal = 0

    if (premio.tipo_premio === 'DESCONTO_PERCENTUAL' && premio.valor_desconto) {
      const descontoCalculado = (valorBase * Number(premio.valor_desconto)) / 100
      descontoFinal = Math.min(descontoCalculado, valorBase)
    } else if (premio.tipo_premio === 'DESCONTO_FIXO' && premio.valor_desconto) {
      const descontoCalculado = Number(premio.valor_desconto)
      descontoFinal = Math.min(descontoCalculado, valorBase)
    } else if (premio.tipo_premio === 'SERVICO_GRATIS') {
      descontoFinal = valorBase
    }

    setValorDesconto(descontoFinal.toString())
  }, [premioSelecionado, premiosDisponiveis, isServicoPersonalizado, valorServicoPersonalizado, servicoSelecionado])

  // Calcular duração
  const calcularDuracao = () => {
    if (!dataInicio || !horaInicio || !horaFim) return ''

    try {
      const [horaIni, minIni] = horaInicio.split(':').map(Number)
      const [horaFimNum, minFim] = horaFim.split(':').map(Number)

      if (isNaN(horaIni) || isNaN(minIni) || isNaN(horaFimNum) || isNaN(minFim)) return ''

      const minutosTotaisIni = horaIni * 60 + minIni
      const minutosTotaisFim = horaFimNum * 60 + minFim

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
    } catch (error) {
      console.error('Erro ao calcular duração:', error)
      return ''
    }
  }

  // Calcular valor total
  const calcularValorTotal = () => {
    try {
      let valorBase = 0

      if (isServicoPersonalizado) {
        valorBase = parseFloat(valorServicoPersonalizado) || 0
      } else if (servicoSelecionado) {
        valorBase = Number(servicoSelecionado.preco) || 0
      }

      const desconto = parseFloat(valorDesconto) || 0
      return Math.max(0, valorBase - desconto)
    } catch (error) {
      console.error('Erro ao calcular valor total:', error)
      return 0
    }
  }

  // Selecionar cliente
  const selecionarCliente = (cliente: Cliente) => {
    setClienteId(cliente.id)
    setClienteBusca(cliente.nome)
    setShowClienteList(false)
  }

  // Selecionar serviço
  const handleServicoChange = (id: string) => {
    const servicoId = parseInt(id)
    setServicoId(servicoId)

    // Auto-preencher hora fim baseado no serviço
    const servico = servicos.find(s => s.id === servicoId)
    if (servico && horaInicio) {
      const [horas, minutos] = horaInicio.split(':').map(Number)
      const totalMinutos = horas * 60 + minutos + servico.duracao_minutos
      const horasFim = Math.floor(totalMinutos / 60)
      const minutosFim = totalMinutos % 60
      const horaFimStr = `${horasFim.toString().padStart(2, '0')}:${minutosFim.toString().padStart(2, '0')}`
      setHoraFim(horaFimStr)
    }
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação básica
    if (!clienteId) {
      alert('Selecione um cliente')
      return
    }

    if (!isServicoPersonalizado && !servicoId) {
      alert('Selecione um serviço ou marque "Serviço Personalizado"')
      return
    }

    if (isServicoPersonalizado && !servicoPersonalizadoNome) {
      alert('Preencha o nome do serviço personalizado')
      return
    }

    if (isServicoPersonalizado && !valorServicoPersonalizado) {
      alert('Preencha o valor do serviço personalizado')
      return
    }

    if (!dataInicio || !horaInicio) {
      alert('Preencha data e horário')
      return
    }

    // Construir data de início e fim SEM timezone (naive datetime)
    // O backend vai assumir que é hora do Brasil e adicionar o timezone correto
    // Removido parsing de data pois não está sendo usado

    // Parse hora início e fim
    const [horaIniNum, minIniNum] = horaInicio.split(':').map(Number)
    const [horaFimNum, minFimNum] = horaFim.split(':').map(Number)

    // Validar que hora fim > hora início
    const minutosTotaisIni = horaIniNum * 60 + minIniNum
    const minutosTotaisFim = horaFimNum * 60 + minFimNum

    if (minutosTotaisFim <= minutosTotaisIni) {
      alert('Horário de término deve ser após o horário de início')
      return
    }

    // Formatar como ISO SEM timezone (naive datetime)
    // Backend vai interpretar como hora do Brasil
    const dataInicioISO = `${dataInicio}T${horaInicio}:00`
    const dataFimISO = `${dataInicio}T${horaFim}:00`

    console.log('MOBILE MODAL - Datas sendo enviadas:')
    console.log('  dataInicio:', dataInicio, 'horaInicio:', horaInicio)
    console.log('  dataInicioISO (naive):', dataInicioISO)
    console.log('  horaFim:', horaFim)
    console.log('  dataFimISO (naive):', dataFimISO)

    // Construir payload
    const agendamentoData: any = {
      cliente_id: clienteId,
      data_inicio: dataInicioISO,
      data_fim: dataFimISO,
      observacoes: observacoes || undefined,
      valor_desconto: parseFloat(valorDesconto) || 0
    }

    if (isServicoPersonalizado) {
      // Não enviar servico_id quando for personalizado
      agendamentoData.servico_personalizado = true
      agendamentoData.servico_personalizado_nome = servicoPersonalizadoNome
      agendamentoData.servico_personalizado_descricao = servicoPersonalizadoDescricao || undefined
      agendamentoData.valor_servico_personalizado = parseFloat(valorServicoPersonalizado)
    } else {
      agendamentoData.servico_id = servicoId
      agendamentoData.servico_personalizado = false
    }

    try {
      await onSave(agendamentoData)

      // Resgatar prêmio se selecionado (apenas na criação, não na edição)
      if (premioSelecionado && clienteId && !agendamento) {
        try {
          await fidelidadeApi.resgatarPremio({
            cliente_id: clienteId,
            premio_id: premioSelecionado,
            pontos_utilizados: premiosDisponiveis.find(p => p.premio.id === premioSelecionado)?.premio.pontos_necessarios || 0
          })
        } catch (premioError) {
          console.error('Erro ao resgatar prêmio:', premioError)
          alert('Agendamento criado, mas houve erro ao resgatar o prêmio.')
        }
      }

      onClose()
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error)

      if (error.response?.data?.detail) {
        const errorMsg = Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join('\n')
          : error.response.data.detail
        alert(`Erro ao criar agendamento:\n${errorMsg}`)
      } else {
        alert('Erro ao criar agendamento. Tente novamente.')
      }
    }
  }

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Agendamento"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <UserIcon className="w-4 h-4 inline mr-1" />
            Cliente *
          </label>
          <div className="relative">
            <input
              type="text"
              value={clienteBusca}
              onChange={(e) => {
                setClienteBusca(e.target.value)
                setShowClienteList(true)
              }}
              onFocus={() => setShowClienteList(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="Buscar por nome, telefone ou email..."
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-3 text-gray-400" />

            {/* Lista de clientes */}
            {showClienteList && clientesFiltrados.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => selecionarCliente(cliente)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-gray-200 border-b last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{cliente.nome}</div>
                    <div className="text-sm text-gray-500">
                      {cliente.telefone} {cliente.email && `• ${cliente.email}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {clienteId && (
            <p className="text-sm text-green-600 mt-1">✓ Cliente selecionado</p>
          )}
        </div>

        {/* Fidelidade - Pontos e Prêmios */}
        {clienteId && premiosDisponiveis.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 text-sm">Programa de Fidelidade</h4>
              <span className="text-sm font-bold text-yellow-600">{pontosCliente} pontos</span>
            </div>

            {premiosDisponiveis.filter(p => p.pode_resgatar).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usar Prêmio
                </label>
                <select
                  value={premioSelecionado || ''}
                  onChange={(e) => setPremioSelecionado(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white"
                >
                  <option value="">Nenhum prêmio</option>
                  {premiosDisponiveis
                    .filter(p => p.pode_resgatar)
                    .map((p) => (
                      <option key={p.premio.id} value={p.premio.id}>
                        {p.premio.nome} ({p.premio.pontos_necessarios} pts)
                      </option>
                    ))
                  }
                </select>
                {premioSelecionado && (
                  <p className="text-xs text-gray-600 mt-1">
                    {premiosDisponiveis.find(p => p.premio.id === premioSelecionado)?.premio.descricao}
                  </p>
                )}
              </div>
            )}

            {premiosDisponiveis.filter(p => !p.pode_resgatar).length > 0 && (
              <p className="text-xs text-gray-500">
                Acumule mais {premiosDisponiveis.filter(p => !p.pode_resgatar)[0]?.premio.pontos_necessarios - pontosCliente} pontos para resgatar prêmios
              </p>
            )}
          </div>
        )}

        {/* Toggle Serviço Personalizado */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="servico_personalizado"
            checked={isServicoPersonalizado}
            onChange={(e) => {
              setIsServicoPersonalizado(e.target.checked)
              if (e.target.checked) {
                setServicoId(null)
              } else {
                setServicoPersonalizadoNome('')
                setServicoPersonalizadoDescricao('')
                setValorServicoPersonalizado('')
              }
            }}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="servico_personalizado" className="text-sm font-medium text-gray-700">
            Serviço Personalizado
          </label>
        </div>

        {/* Serviço Predefinido */}
        {!isServicoPersonalizado && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <WrenchScrewdriverIcon className="w-4 h-4 inline mr-1" />
              Serviço *
            </label>
            <select
              value={servicoId || ''}
              onChange={(e) => handleServicoChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            >
              <option value="">Selecione um serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome} - R$ {Number(servico.preco || 0).toFixed(2)}
                  {servico.categoria && ` (${servico.categoria})`}
                </option>
              ))}
            </select>
            {servicoSelecionado && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Preço:</strong> R$ {Number(servicoSelecionado.preco || 0).toFixed(2)}
                </p>
                {servicoSelecionado.descricao && (
                  <p className="text-sm text-blue-900 mt-1">
                    <strong>Descrição:</strong> {servicoSelecionado.descricao}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Serviço Personalizado */}
        {isServicoPersonalizado && (
          <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900">Detalhes do Serviço Personalizado</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Serviço *
              </label>
              <input
                type="text"
                value={servicoPersonalizadoNome}
                onChange={(e) => setServicoPersonalizadoNome(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                placeholder="Ex: Corte especial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                value={servicoPersonalizadoDescricao}
                onChange={(e) => setServicoPersonalizadoDescricao(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                rows={2}
                placeholder="Descrição do serviço..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorServicoPersonalizado}
                onChange={(e) => setValorServicoPersonalizado(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Data e Hora */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Data *
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClockIcon className="w-4 h-4 inline mr-1" />
              Horário *
            </label>
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            />
          </div>
        </div>

        {/* Horário Término */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ClockIcon className="w-4 h-4 inline mr-1" />
            Horário Término *
          </label>
          <input
            type="time"
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
          />
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

        {/* Desconto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
            Desconto (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valorDesconto}
            onChange={(e) => setValorDesconto(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            placeholder="0.00"
          />
          {(servicoSelecionado || (isServicoPersonalizado && valorServicoPersonalizado)) && (
            <p className="text-sm text-gray-600 mt-1">
              Valor final: R$ {calcularValorTotal().toFixed(2)}
            </p>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            rows={3}
            placeholder="Observações sobre o agendamento..."
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 active:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Salvando...' : 'Criar Agendamento'}
          </button>
        </div>
      </form>
    </MobileModal>
  )
}

export default MobileAgendamentoModal
