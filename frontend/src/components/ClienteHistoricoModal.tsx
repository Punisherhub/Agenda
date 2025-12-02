import React, { useEffect, useState } from 'react'
import { X, Eye } from 'lucide-react'
import { clientesApi } from '../services/api'
import { Cliente, Agendamento } from '../types'
import { format } from 'date-fns'
import AgendamentoDetailModal from './AgendamentoDetailModal'

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
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

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
              <p className="text-gray-500 text-lg">Nenhum agendamento encontrado</p>
              <p className="text-gray-400 text-sm mt-2">
                Este cliente ainda não possui agendamentos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agendamentos.map((agendamento) => (
                    <tr key={agendamento.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {agendamento.servico_personalizado
                          ? agendamento.servico_personalizado_nome
                          : agendamento.servico?.nome || 'Serviço não informado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(agendamento.data_inicio), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(agendamento.data_inicio), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        R$ {Number(agendamento.valor_final).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(agendamento.status)}`}>
                          {getStatusLabel(agendamento.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => {
                            setSelectedAgendamento(agendamento)
                            setShowDetailModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Modal de Detalhes do Agendamento */}
      {selectedAgendamento && (
        <AgendamentoDetailModal
          agendamento={selectedAgendamento}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedAgendamento(null)
          }}
        />
      )}
    </div>
  )
}

export default ClienteHistoricoModal
