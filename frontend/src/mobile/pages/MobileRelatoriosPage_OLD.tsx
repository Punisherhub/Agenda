import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { relatoriosApi, agendamentosApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import MobileAgendamentoDetailModal from '../components/MobileAgendamentoDetailModal'
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

  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [page, setPage] = useState(0)
  const limit = 10

  // Query Dashboard
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard-relatorios-mobile', dataInicio, dataFim],
    queryFn: async () => {
      try {
        return await relatoriosApi.getDashboard({
          data_inicio: dataInicio,
          data_fim: dataFim
        })
      } catch (error) {
        console.error('Erro ao buscar dashboard:', error)
        return null
      }
    }
  })

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

  // Formatar hora (PURE JS)
  const formatHora = (dateString: string) => {
    try {
      const timeMatch = dateString.match(/T(\d{2}):(\d{2})/)
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`
      }
      return '00:00'
    } catch {
      return '00:00'
    }
  }

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

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-gray-600">Carregando relatórios...</div>
        </div>
      </MobileLayout>
    )
  }

  const resumo = {
    total_receita: dashboard?.resumo_financeiro?.total_receita || 0,
    total_custos_materiais: dashboard?.resumo_financeiro?.total_custos_materiais || 0,
    lucro_bruto: dashboard?.resumo_financeiro?.lucro_bruto || 0,
    margem_lucro: dashboard?.resumo_financeiro?.margem_lucro || 0,
    total_agendamentos: dashboard?.resumo_financeiro?.total_agendamentos || 0,
    total_agendamentos_concluidos: dashboard?.resumo_financeiro?.total_agendamentos_concluidos || 0
  }

  const receitaDiaria = Array.isArray(dashboard?.receita_diaria) ? dashboard.receita_diaria : []
  const lucroPorServico = Array.isArray(dashboard?.lucro_por_servico) ? dashboard.lucro_por_servico : []

  const taxaConversao = resumo.total_agendamentos > 0
    ? (resumo.total_agendamentos_concluidos / resumo.total_agendamentos * 100)
    : 0

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

        {/* Cards Resumo */}
        <div className="space-y-3">
          {/* Receita Total */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
            <div className="text-sm opacity-90">💰 Receita Total</div>
            <div className="text-3xl font-bold">
              R$ {Number(resumo.total_receita).toFixed(2)}
            </div>
            <div className="text-xs mt-1 opacity-80">Últimos 30 dias</div>
          </div>

          {/* Lucro e Margem */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-xs text-gray-600">📈 Lucro Bruto</div>
              <div className="text-xl font-bold text-blue-600">
                R$ {Number(resumo.lucro_bruto).toFixed(2)}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-xs text-gray-600">📊 Margem</div>
              <div className="text-xl font-bold text-purple-600">
                {resumo.margem_lucro.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Custos */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="text-xs text-gray-600">💸 Custo de Materiais</div>
            <div className="text-xl font-bold text-orange-600">
              R$ {Number(resumo.total_custos_materiais).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Receita Diária - Tabela */}
        {receitaDiaria.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Receita Diária</h3>
            <div className="space-y-2">
              {receitaDiaria.slice(0, 7).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{item.data}</span>
                  <span className="text-sm font-bold text-green-600">
                    R$ {Number(item.receita || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lucro por Serviço - Tabela */}
        {lucroPorServico.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Lucro por Serviço</h3>
            <div className="space-y-2">
              {lucroPorServico.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{item.nome_servico}</span>
                  <span className="text-sm font-bold text-blue-600">
                    R$ {Number(item.lucro || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desempenho */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Desempenho</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">Agendamentos</div>
              <div className="text-2xl font-bold text-gray-900">
                {resumo.total_agendamentos}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {resumo.total_agendamentos_concluidos} concluídos
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600">Taxa Conversão</div>
              <div className="text-2xl font-bold text-gray-900">
                {taxaConversao.toFixed(1)}%
              </div>
            </div>
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
                    <button
                      key={agendamento.id}
                      onClick={() => {
                        setSelectedAgendamento(agendamento)
                        setShowDetailModal(true)
                      }}
                      className="w-full text-left bg-gray-50 rounded-lg p-3 active:bg-gray-100 transition-colors"
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
                            {agendamento.data_inicio ? `${formatData(agendamento.data_inicio)} às ${formatHora(agendamento.data_inicio)}` : 'Data não disponível'}
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
                    </button>
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

      {/* Modal de Detalhes */}
      <MobileAgendamentoDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAgendamento(null)
        }}
        agendamento={selectedAgendamento}
        servicos={[]}
        clientes={[]}
        onEdit={() => {}}
        onUpdateStatus={async () => {}}
        onCancel={async () => {}}
        onConcluirComMateriais={() => {}}
      />
    </MobileLayout>
  )
}

export default MobileRelatoriosPage
