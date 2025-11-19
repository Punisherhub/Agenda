import React, { useState } from 'react'
import MobileModal from './MobileModal'

interface Cliente {
  id: number
  nome: string
  telefone: string
}

interface Servico {
  id: number
  nome: string
  preco: number
  duracao_minutos: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  servicos: Servico[]
  clientes: Cliente[]
  loading?: boolean
}

const MobileAgendamentoModalSimple: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  servicos,
  clientes,
  loading = false
}) => {
  const [clienteId, setClienteId] = useState('')
  const [servicoId, setServicoId] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [horaInicio, setHoraInicio] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteId || !servicoId || !dataInicio || !horaInicio) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const servico = servicos.find(s => s.id === parseInt(servicoId))
      if (!servico) {
        alert('Serviço não encontrado')
        return
      }

      const dataInicioISO = new Date(`${dataInicio}T${horaInicio}:00`).toISOString()
      const dataFimDate = new Date(`${dataInicio}T${horaInicio}:00`)
      dataFimDate.setMinutes(dataFimDate.getMinutes() + servico.duracao_minutos)
      const dataFimISO = dataFimDate.toISOString()

      await onSave({
        cliente_id: parseInt(clienteId),
        servico_id: parseInt(servicoId),
        data_inicio: dataInicioISO,
        data_fim: dataFimISO,
        valor_desconto: 0,
        servico_personalizado: false
      })

      // Reset
      setClienteId('')
      setServicoId('')
      setDataInicio('')
      setHoraInicio('')
      onClose()
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar agendamento')
    }
  }

  if (!isOpen) return null

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Novo Agendamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </option>
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
          >
            <option value="">Selecione um serviço</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.nome} - R$ {Number(servico.preco || 0).toFixed(2)}
              </option>
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
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
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
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
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
            {loading ? 'Salvando...' : 'Criar'}
          </button>
        </div>
      </form>
    </MobileModal>
  )
}

export default MobileAgendamentoModalSimple
