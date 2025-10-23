import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { relatoriosApi } from '../services/api'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Package, ShoppingCart } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { ReceitaDiaria, MaterialEstoque, ServicoLucro, MaterialConsumo } from '../types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

const RelatoriosPage: React.FC = () => {
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard-relatorios', dataInicio, dataFim],
    queryFn: () => relatoriosApi.getDashboard({
      data_inicio: dataInicio,
      data_fim: dataFim
    })
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Carregando relatórios...</div>
      </div>
    )
  }

  if (!dashboard) {
    return <div>Erro ao carregar relatórios</div>
  }

  const resumo = dashboard.resumo_financeiro
  const taxaConversao = resumo.total_agendamentos > 0
    ? (resumo.total_agendamentos_concluidos / resumo.total_agendamentos * 100).toFixed(1)
    : 0

  // Preparar dados para gráfico de receita diária
  const receitaDiariaData = dashboard.receita_diaria.map((item: ReceitaDiaria) => ({
    data: format(new Date(item.data), 'dd/MM'),
    Receita: item.receita,
    Custos: item.custos,
    Lucro: item.lucro
  }))

  // Preparar dados de estoque para gráfico
  const estoqueData = dashboard.estoque_materiais
    .slice(0, 10) // Top 10 materiais
    .map((item: MaterialEstoque) => ({
      nome: item.nome.length > 20 ? item.nome.substring(0, 17) + '...' : item.nome,
      valor: item.valor_total_estoque,
      quantidade: item.quantidade_estoque,
      unidade: item.unidade_medida
    }))

  // Preparar dados de serviços por lucro
  const servicosData = dashboard.servicos_lucro
    .sort((a: ServicoLucro, b: ServicoLucro) => b.lucro_total - a.lucro_total)
    .slice(0, 8)
    .map((item: ServicoLucro) => ({
      nome: item.servico_nome.length > 15 ? item.servico_nome.substring(0, 12) + '...' : item.servico_nome,
      lucro: item.lucro_total,
      receita: item.receita_total,
      custos: item.custo_materiais_total
    }))

  // Preparar dados de materiais mais consumidos
  const materiaisConsumoData = dashboard.materiais_consumo
    .sort((a: MaterialConsumo, b: MaterialConsumo) => b.custo_total - a.custo_total)
    .slice(0, 6)
    .map((item: MaterialConsumo) => ({
      nome: item.material_nome,
      value: item.custo_total
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>

        <div className="flex gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {resumo.total_receita.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {resumo.total_agendamentos_concluidos} agendamentos concluídos
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custos Materiais</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {resumo.total_custos_materiais.toFixed(2)}
              </p>
            </div>
            <Package className="w-10 h-10 text-orange-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Materiais consumidos
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Lucro Bruto</p>
              <p className={`text-2xl font-bold ${resumo.lucro_bruto >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                R$ {resumo.lucro_bruto.toFixed(2)}
              </p>
            </div>
            {resumo.lucro_bruto >= 0 ? (
              <TrendingUp className="w-10 h-10 text-blue-500" />
            ) : (
              <TrendingDown className="w-10 h-10 text-red-500" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Margem: {resumo.total_receita > 0 ? ((resumo.lucro_bruto / resumo.total_receita) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-purple-600">
                {taxaConversao}%
              </p>
            </div>
            <ShoppingCart className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {resumo.total_agendamentos} agendamentos total
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita Diária */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Receita Diária</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={receitaDiariaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Custos" stroke="#f97316" strokeWidth={2} />
              <Line type="monotone" dataKey="Lucro" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lucro por Serviço */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Lucro por Serviço</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={servicosData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="receita" fill="#10b981" name="Receita" />
              <Bar dataKey="custos" fill="#f97316" name="Custos" />
              <Bar dataKey="lucro" fill="#3b82f6" name="Lucro" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estoque de Materiais */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Quantidade em Estoque (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estoqueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip
                formatter={(value: number, _name: string, props: any) =>
                  `${value.toFixed(2)} ${props.payload.unidade?.toLowerCase() || ''}`
                }
              />
              <Bar dataKey="quantidade" fill="#8b5cf6" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de Custos por Material */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Custos por Material</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={materiaisConsumoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {materiaisConsumoData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabelas de Detalhamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Serviços */}
        <div className="card">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Top 5 Serviços Mais Lucrativos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lucro</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.servicos_lucro.slice(0, 5).map((servico: ServicoLucro, index: number) => (
                  <tr key={`servico-${servico.servico_id}-${servico.servico_nome}-${index}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {servico.servico_nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {servico.quantidade_vendida}x
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      R$ {servico.lucro_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Materiais Consumidos */}
        <div className="card">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Top 5 Materiais Mais Consumidos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboard.materiais_consumo.slice(0, 5).map((material: MaterialConsumo, index: number) => (
                  <tr key={`material-${material.material_id}-${index}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {material.material_nome}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {material.quantidade_consumida.toFixed(2)} {material.unidade_medida.toLowerCase()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                      R$ {material.custo_total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RelatoriosPage
