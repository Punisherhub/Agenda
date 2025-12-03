import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { agendamentosApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import { Agendamento } from '../../types'

const MobileRelatoriosPage: React.FC = () => {
  // Calcular últimos 30 dias
  const hoje = new Date()
  const anoHoje = hoje.getFullYear()
  const mesHoje = (hoje.getMonth() + 1).toString().padStart(2, '0')
  const diaHoje = hoje.getDate().toString().padStart(2, '0')
  const dataFim = `${anoHoje}-${mesHoje}-${diaHoje}`

  const trintaDiasAtras = new Date(hoje)
  trintaDiasAtras.setDate(hoje.getDate() - 30)
  const ano30 = trintaDiasAtras.getFullYear()
  const mes30 = (trintaDiasAtras.getMonth() + 1).toString().padStart(2, '0')
  const dia30 = trintaDiasAtras.getDate().toString().padStart(2, '0')
  const dataInicio = `${ano30}-${mes30}-${dia30}`

  const [page, setPage] = useState(0)
  const limit = 10

  // Query Agendamentos Concluídos
  const { data: agendamentosData, isLoading: isLoadingAgendamentos } = useQuery({
    queryKey: ['agendamentos-concluidos-mobile', dataInicio, dataFim, page],
    queryFn: async () => {
      try {
        const result = await agendamentosApi.list({
          data_inicio: dataInicio,
          data_fim: dataFim,
          status: 'CONCLUIDO',
          skip: page * limit,
          limit
        })
        return result
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error)
        return { agendamentos: [], total: 0 }
      }
    }
  })

  const agendamentos = agendamentosData?.agendamentos || []
  const totalAgendamentos = agendamentosData?.total || 0

  // Formatar data (PURE JS)
  const formatData = (dateString: string) => {
    try {
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (dateMatch) {
        const ano = dateMatch[1]
        const mes = dateMatch[2]
        const dia = dateMatch[3]
        return `${dia}/${mes}/${ano}`
      }
      return ''
    } catch {
      return ''
    }
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-4 pb-24">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-sm text-gray-600">
            {formatData(dataInicio)} até {formatData(dataFim)}
          </p>
        </div>

        {/* Cards Resumo - Mock Data */}
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
            <div className="text-sm opacity-90">Receita Total</div>
            <div className="text-3xl font-bold">R$ 0,00</div>
            <div className="text-xs mt-1 opacity-80">Últimos 30 dias</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-xs text-gray-600">Lucro Bruto</div>
              <div className="text-xl font-bold text-blue-600">R$ 0,00</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-xs text-gray-600">Margem</div>
              <div className="text-xl font-bold text-purple-600">0%</div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="text-xs text-gray-600">Custo de Materiais</div>
            <div className="text-xl font-bold text-orange-600">R$ 0,00</div>
          </div>
        </div>

        {/* Histórico de Agendamentos */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Histórico de Agendamentos Concluídos
          </h3>

          {isLoadingAgendamentos ? (
            <div className="text-center py-8 text-gray-500">
              Carregando...
            </div>
          ) : agendamentos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum agendamento concluído no período
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {agendamentos.map((agendamento: any) => {
                  if (!agendamento || !agendamento.id) return null

                  return (
                    <div
                      key={agendamento.id}
                      className="w-full bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {agendamento.cliente?.nome || 'Cliente não informado'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {agendamento.servico?.nome || 'Serviço Personalizado'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {agendamento.data_inicio ? formatData(agendamento.data_inicio) : 'Data não disponível'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            R$ {Number(agendamento.valor_final || agendamento.valor_total || 0).toFixed(2)}
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Concluído
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Paginação */}
              {totalAgendamentos > limit && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {page + 1} de {Math.ceil(totalAgendamentos / limit)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= totalAgendamentos}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:bg-gray-100"
                  >
                    Próximo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  )
}

export default MobileRelatoriosPage
