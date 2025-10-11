import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { agendamentosApi } from '../services/api'
import { format } from 'date-fns'
import { CalendarPlus, Search } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const { data: agendamentosHoje, isLoading } = useQuery({
    queryKey: ['agendamentos', 'hoje'],
    queryFn: () => agendamentosApi.list({
      data_inicio: format(hoje, 'yyyy-MM-dd'),
      data_fim: format(hoje, 'yyyy-MM-dd'),
      limit: 10
    })
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleNovoAgendamento = () => {
    navigate('/agendamentos')
  }

  const handleBuscarCliente = () => {
    navigate('/clientes')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user.full_name}!
        </h1>
        <p className="text-gray-600">
          {format(hoje, "dd/MM/yyyy")}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Agendamentos Hoje</h3>
          <p className="text-2xl font-bold text-blue-600">
            {isLoading ? '...' : agendamentosHoje?.agendamentos?.length || 0}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Status</h3>
          <p className="text-2xl font-bold text-green-600">
            {user.estabelecimento_id ? 'Ativo' : 'Inativo'}
          </p>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Seu Papel</h3>
          <p className="text-2xl font-bold text-purple-600 capitalize">
            {user.role || 'N/A'}
          </p>
        </div>
      </div>

      {/* Agendamentos de hoje */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Agendamentos de Hoje</h2>
        </div>

        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-500">Carregando...</p>
          ) : agendamentosHoje?.agendamentos?.length === 0 ? (
            <p className="text-gray-500">Nenhum agendamento para hoje</p>
          ) : (
            <div className="space-y-4">
              {agendamentosHoje?.agendamentos?.map((agendamento: any) => (
                <div
                  key={agendamento.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {agendamento.cliente?.nome || `Cliente #${agendamento.cliente_id}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {agendamento.servico?.nome || `Serviço #${agendamento.servico_id}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(agendamento.data_inicio), 'HH:mm')} às{' '}
                      {format(new Date(agendamento.data_fim), 'HH:mm')}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        agendamento.status === 'agendado'
                          ? 'bg-blue-100 text-blue-800'
                          : agendamento.status === 'confirmado'
                          ? 'bg-green-100 text-green-800'
                          : agendamento.status === 'em_andamento'
                          ? 'bg-yellow-100 text-yellow-800'
                          : agendamento.status === 'concluido'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {agendamento.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          <div className="space-y-3">
            <button
              onClick={handleNovoAgendamento}
              className="btn-primary w-full py-2 flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-5 h-5" />
              Novo Agendamento
            </button>
            <button
              onClick={handleBuscarCliente}
              className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Buscar Cliente
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Estabelecimento:</span>
              <span className="font-medium">#{user.estabelecimento_id}</span>
            </div>
            <div className="flex justify-between">
              <span>Última atualização:</span>
              <span className="font-medium">Agora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage