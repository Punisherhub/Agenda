import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { agendamentosApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const MobileDashboardPage: React.FC = () => {
  const navigate = useNavigate()

  // Obter data de hoje em formato YYYY-MM-DD sem conversão de timezone
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = (hoje.getMonth() + 1).toString().padStart(2, '0')
  const dia = hoje.getDate().toString().padStart(2, '0')
  const dataHoje = `${ano}-${mes}-${dia}`

  // Função helper para formatar hora - Extrai do ISO string sem conversão de timezone
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

  // Buscar agendamentos de hoje (apenas não finalizados)
  const { data: agendamentosHoje, isLoading } = useQuery({
    queryKey: ['agendamentos', 'hoje', 'ativos'],
    queryFn: () => agendamentosApi.list({
      data_inicio: dataHoje,
      data_fim: dataHoje,
      limit: 10
    }),
    select: (data) => ({
      ...data,
      agendamentos: data.agendamentos?.filter((a: any) =>
        a.status !== 'CONCLUIDO' && a.status !== 'CANCELADO'
      ) || []
    })
  })

  return (
    <MobileLayout>
      <div className="p-4 space-y-4 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bem-vindo!</p>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-3">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/agendamentos')}
              className="bg-blue-600 text-white py-3 px-4 rounded-lg font-medium active:bg-blue-700 flex flex-col items-center gap-2"
            >
              <CalendarIcon className="w-8 h-8" />
              <span className="text-sm">Novo Agendamento</span>
            </button>
            <button
              onClick={() => navigate('/clientes')}
              className="bg-gray-600 text-white py-3 px-4 rounded-lg font-medium active:bg-gray-700 flex flex-col items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-8 h-8" />
              <span className="text-sm">Buscar Cliente</span>
            </button>
          </div>
        </div>

        {/* Card Agendamentos Hoje */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-2">Agendamentos Hoje</p>
          <p className="text-4xl font-bold text-blue-600">
            {isLoading ? '...' : agendamentosHoje?.agendamentos?.length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {agendamentosHoje?.agendamentos?.length === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>

        {/* Lista de Agendamentos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Agendamentos para Hoje</h2>
          </div>

          <div className="p-4">
            {isLoading ? (
              <p className="text-gray-500 text-center py-4">Carregando...</p>
            ) : agendamentosHoje?.agendamentos?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum agendamento para hoje</p>
            ) : (
              <div className="space-y-3">
                {agendamentosHoje?.agendamentos?.map((agendamento: any) => (
                  <div
                    key={agendamento.id}
                    className="bg-gray-50 rounded-lg p-3 active:bg-gray-100"
                    onClick={() => navigate('/agendamentos')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">
                          {agendamento.cliente?.nome || `Cliente #${agendamento.cliente_id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {agendamento.servico?.nome || (agendamento.servico_id ? `Serviço #${agendamento.servico_id}` : 'Serviço Personalizado')}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {formatHora(agendamento.data_inicio)} às{' '}
                          {formatHora(agendamento.data_fim)}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          agendamento.status === 'AGENDADO'
                            ? 'bg-blue-100 text-blue-800'
                            : agendamento.status === 'CONCLUIDO'
                            ? 'bg-emerald-100 text-emerald-800'
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
      </div>
    </MobileLayout>
  )
}

export default MobileDashboardPage
