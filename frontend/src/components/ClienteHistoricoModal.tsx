import React, { useEffect, useState } from 'react'
import { X, Calendar, Clock, DollarSign } from 'lucide-react'
import { clientesApi } from '../services/api'
import { Cliente, Agendamento } from '../types'

interface ClienteHistoricoModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'AGENDADO': 'Agendado',
    'CONFIRMADO': 'Confirmado',
    'EM_ANDAMENTO': 'Em Andamento',
    'CONCLUIDO': 'Concluído',
    'CANCELADO': 'Cancelado',
    'NAO_COMPARECEU': 'Não Compareceu'
  }
  return labels[status.toUpperCase()] || status
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'AGENDADO': 'bg-blue-100 text-blue-800',
    'CONFIRMADO': 'bg-green-100 text-green-800',
    'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-800',
    'CONCLUIDO': 'bg-emerald-100 text-emerald-800',
    'CANCELADO': 'bg-red-100 text-red-800',
    'NAO_COMPARECEU': 'bg-gray-100 text-gray-800'
  }
  return colors[status.toUpperCase()] || 'bg-gray-100 text-gray-800'
}

const ClienteHistoricoModal: React.FC<ClienteHistoricoModalProps> = ({
  isOpen,
  onClose,
  cliente
}) => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && cliente) {
      loadHistorico()
    }
  }, [isOpen, cliente])

  const loadHistorico = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await clientesApi.getHistory(cliente.id)
      setAgendamentos(response.agendamentos || [])
      setTotal(response.total || 0)
    } catch (err: any) {
      setError('Erro ao carregar histórico de agendamentos')
      console.error('Erro ao carregar histórico:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de Agendamentos
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {cliente.nome} • {total} agendamento{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Carregando histórico...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhum agendamento encontrado</p>
              <p className="text-gray-400 text-sm mt-2">
                Este cliente ainda não possui agendamentos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendamentos.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {agendamento.servico?.nome || 'Serviço'}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            agendamento.status
                          )}`}
                        >
                          {getStatusLabel(agendamento.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(agendamento.data_inicio).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {' - '}
                            {new Date(agendamento.data_fim).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">
                            R$ {Number(agendamento.valor_final).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {agendamento.observacoes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                          <strong>Observações:</strong> {agendamento.observacoes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button onClick={onClose} className="btn-primary px-6 py-2">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClienteHistoricoModal
