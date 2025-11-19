import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { relatoriosApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import {
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const MobileRelatoriosPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null)
  const [erro, setErro] = useState(false)

  // Calcular últimos 30 dias sem conversão de timezone
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

  // Buscar dashboard (igual desktop) com MÁXIMA proteção
  const dashboardQuery = useQuery({
    queryKey: ['dashboard-relatorios-mobile', dataInicio, dataFim],
    queryFn: async () => {
      try {
        const result = await relatoriosApi.getDashboard({
          data_inicio: dataInicio,
          data_fim: dataFim
        })
        return result
      } catch (error) {
        console.error('Erro dashboard relatorio:', error)
        setErro(true)
        return null
      }
    },
    retry: false,
    staleTime: 60000
  })

  // Atualizar estado quando query retornar
  useEffect(() => {
    if (dashboardQuery.data) {
      setDashboard(dashboardQuery.data)
    }
  }, [dashboardQuery.data])

  const isLoading = dashboardQuery.isLoading

  // Extrair métricas do dashboard (igual desktop)
  const getMetricas = () => {
    if (!dashboard || !dashboard.resumo_financeiro) {
      return {
        receitaTotal: 0,
        custoMateriais: 0,
        lucroBruto: 0,
        margemLucro: 0,
        totalAgendamentos: 0,
        agendamentosConcluidos: 0,
        taxaConversao: 0
      }
    }

    try {
      const resumo = dashboard.resumo_financeiro
      const taxaConversao = resumo.total_agendamentos > 0
        ? (resumo.total_agendamentos_concluidos / resumo.total_agendamentos * 100)
        : 0

      return {
        receitaTotal: resumo.total_receita || 0,
        custoMateriais: resumo.total_custos_materiais || 0,
        lucroBruto: resumo.lucro_bruto || 0,
        margemLucro: resumo.total_receita > 0
          ? ((resumo.lucro_bruto / resumo.total_receita) * 100)
          : 0,
        totalAgendamentos: resumo.total_agendamentos || 0,
        agendamentosConcluidos: resumo.total_agendamentos_concluidos || 0,
        taxaConversao
      }
    } catch (e) {
      console.error('Erro ao extrair métricas:', e)
      setErro(true)
      return {
        receitaTotal: 0,
        custoMateriais: 0,
        lucroBruto: 0,
        margemLucro: 0,
        totalAgendamentos: 0,
        agendamentosConcluidos: 0,
        taxaConversao: 0
      }
    }
  }

  const metricas = getMetricas()

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-600">Últimos 30 dias</p>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800">
              <ExclamationTriangleIcon className="w-4 h-4 inline" /> Erro ao carregar alguns dados
            </div>
          </div>
        )}

        {/* Receita Total */}
        <div className="bg-green-500 rounded-lg p-4 text-white">
          <div className="text-sm">Receita Total</div>
          <div className="text-3xl font-bold">
            {isLoading ? '...' : `R$ ${metricas.receitaTotal.toFixed(2)}`}
          </div>
          <div className="text-xs mt-1">Últimos 30 dias</div>
        </div>

        {/* Lucro e Margem */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Lucro Bruto</div>
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? '...' : `R$ ${metricas.lucroBruto.toFixed(2)}`}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Margem</div>
            <div className="text-2xl font-bold text-purple-600">
              {isLoading ? '...' : `${metricas.margemLucro.toFixed(1)}%`}
            </div>
          </div>
        </div>

        {/* Custo de Materiais */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Custo de Materiais</div>
          <div className="text-2xl font-bold text-orange-600">
            {isLoading ? '...' : `R$ ${metricas.custoMateriais.toFixed(2)}`}
          </div>
        </div>

        {/* Desempenho */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Desempenho</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Agendamentos</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : metricas.totalAgendamentos}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {metricas.agendamentosConcluidos} concluídos
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Taxa Conversão</div>
              <div className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : `${metricas.taxaConversao.toFixed(1)}%`}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm font-bold text-blue-900 flex items-center gap-1">
            <ChartBarIcon className="w-4 h-4" />
            Dados Reais
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Baseado em {metricas.totalAgendamentos} agendamentos dos últimos 30 dias
          </div>
        </div>
      </div>
    </MobileLayout>
  )
}

export default MobileRelatoriosPage
