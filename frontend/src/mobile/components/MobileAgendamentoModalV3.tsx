import React, { useState, useEffect } from 'react'
import MobileModal from './MobileModal'
import MobileErrorBoundary from './MobileErrorBoundary'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  servicos: any[]
  clientes: any[]
  loading?: boolean
}

const MobileAgendamentoModalV3: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  servicos,
  clientes,
  loading = false
}) => {
  const [clienteId, setClienteId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      const info = [
        `Modal aberto: ${new Date().toLocaleTimeString()}`,
        `Servicos: ${servicos?.length || 0} itens`,
        `Clientes: ${clientes?.length || 0} itens`,
        `Servicos tipo: ${typeof servicos}`,
        `Clientes tipo: ${typeof clientes}`
      ]
      setDebugInfo(info)
      console.log('MobileAgendamentoModalV3 Debug:', info)
    }
  }, [isOpen, servicos, clientes])

  if (!isOpen) return null

  // Proteção contra arrays undefined
  const servicosArray = Array.isArray(servicos) ? servicos : []
  const clientesArray = Array.isArray(clientes) ? clientes : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteId || !servicoId || !data || !hora) {
      alert('Preencha todos os campos')
      return
    }

    try {
      const servico = servicosArray.find((s: any) => s.id === parseInt(servicoId))
      if (!servico) {
        alert('Serviço não encontrado')
        return
      }

      const dataInicioISO = new Date(`${data}T${hora}:00`).toISOString()
      const dataFimDate = new Date(`${data}T${hora}:00`)
      dataFimDate.setMinutes(dataFimDate.getMinutes() + (servico.duracao_minutos || 60))

      await onSave({
        cliente_id: parseInt(clienteId),
        servico_id: parseInt(servicoId),
        data_inicio: dataInicioISO,
        data_fim: dataFimDate.toISOString(),
        valor_desconto: 0,
        servico_personalizado: false
      })

      // Reset
      setClienteId('')
      setServicoId('')
      setData('')
      setHora('')
    } catch (error) {
      alert('Erro ao criar agendamento')
    }
  }

  return (
    <MobileErrorBoundary>
      <MobileModal isOpen={isOpen} onClose={onClose} title="Novo Agendamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debug Info */}
          <details className="bg-gray-100 rounded-lg p-3 text-xs">
            <summary className="cursor-pointer font-semibold">🔍 Debug Info (clique para ver)</summary>
            <div className="mt-2 space-y-1">
              {debugInfo.map((info, idx) => (
                <div key={idx} className="text-gray-700">{info}</div>
              ))}
            </div>
          </details>

          {/* Loading state */}
          {(servicosArray.length === 0 || clientesArray.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                {servicosArray.length === 0 && 'Carregando serviços...'}
                {clientesArray.length === 0 && servicosArray.length > 0 && 'Carregando clientes...'}
              </p>
            </div>
          )}

        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            disabled={clientesArray.length === 0}
          >
            <option value="">Selecione</option>
            {clientesArray.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Serviço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Serviço *
          </label>
          <select
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
            disabled={servicosArray.length === 0}
          >
            <option value="">Selecione</option>
            {servicosArray.map((s: any) => (
              <option key={s.id} value={s.id}>{s.nome} - R$ {Number(s.preco || 0).toFixed(2)}</option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data *
          </label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
          />
        </div>

        {/* Hora */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horário *
          </label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:bg-gray-400"
          >
            {loading ? 'Salvando...' : 'Criar'}
          </button>
        </div>
      </form>
    </MobileModal>
    </MobileErrorBoundary>
  )
}

export default MobileAgendamentoModalV3
