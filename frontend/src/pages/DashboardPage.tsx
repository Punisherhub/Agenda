import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { agendamentosApi, relatoriosApi, materiaisApi } from '../services/api'
import { format, subDays } from 'date-fns'
import { formatBrazilTime } from '../utils/timezone'
import { CalendarPlus, Search, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdminOrManager = user.role === 'admin' || user.role === 'manager'

  const { data: agendamentosHoje, isLoading } = useQuery({
    queryKey: ['agendamentos', 'hoje'],
    queryFn: () => agendamentosApi.list({
      data_inicio: format(hoje, 'yyyy-MM-dd'),
      data_fim: format(hoje, 'yyyy-MM-dd'),
      limit: 10
    })
  })

  // Buscar estatísticas do mês (apenas para admin/manager)
  const { data: estatisticas } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => relatoriosApi.getDashboard({
      data_inicio: format(subDays(hoje, 30), 'yyyy-MM-dd'),
      data_fim: format(hoje, 'yyyy-MM-dd')
    }),
    enabled: isAdminOrManager // Só busca se for admin ou manager
  })

  // Buscar materiais com estoque baixo (apenas para admin/manager)
  const { data: materiais } = useQuery({
    queryKey: ['materiais-dashboard'],
    queryFn: () => materiaisApi.list({ ativo: true }),
    enabled: isAdminOrManager // Só busca se for admin ou manager
  })

  const handleNovoAgendamento = () => {
    navigate('/agendamentos')
  }

  const handleBuscarCliente = () => {
    navigate('/clientes')
  }

  // Calcular materiais com estoque baixo
  const materiaisBaixoEstoque = materiais?.materiais?.filter((m: any) =>
    m.quantidade_minima && m.quantidade_estoque <= m.quantidade_minima
  ) || []

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

      {/* Ações Rápidas */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleNovoAgendamento}
            className="btn-primary py-3 flex items-center justify-center gap-2"
          >
            <CalendarPlus className="w-5 h-5" />
            Novo Agendamento
          </button>
          <button
            onClick={handleBuscarCliente}
            className="btn-secondary py-3 flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Buscar Cliente
          </button>
        </div>
      </div>

      {/* Cards de Métricas: Agendamentos, Receita e Lucro */}
      {isAdminOrManager ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card de Agendamentos Hoje */}
          <div className="card p-6">
            <h3 className="text-sm font-medium text-gray-500">Agendamentos Hoje</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {isLoading ? '...' : agendamentosHoje?.agendamentos?.length || 0}
            </p>
          </div>

          {/* Card de Receita */}
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Receita (30 dias)</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {estatisticas?.resumo_financeiro?.total_receita?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Card de Lucro */}
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Lucro (30 dias)</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {estatisticas?.resumo_financeiro?.lucro_bruto?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Dashboard simplificado para vendedores - só mostra agendamentos
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Agendamentos Hoje</h3>
          <p className="text-4xl font-bold text-blue-600">
            {isLoading ? '...' : agendamentosHoje?.agendamentos?.length || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {agendamentosHoje?.agendamentos?.length === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>
      )}

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
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/agendamentos')}
                >
                  <div>
                    <p className="font-medium">
                      {agendamento.cliente?.nome || `Cliente #${agendamento.cliente_id}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {agendamento.servico?.nome || `Serviço #${agendamento.servico_id}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatBrazilTime(agendamento.data_inicio)} às{' '}
                      {formatBrazilTime(agendamento.data_fim)}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        agendamento.status === 'AGENDADO'
                          ? 'bg-blue-100 text-blue-800'
                          : agendamento.status === 'CONFIRMADO'
                          ? 'bg-green-100 text-green-800'
                          : agendamento.status === 'EM_ANDAMENTO'
                          ? 'bg-yellow-100 text-yellow-800'
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

      {/* Materiais com Estoque Baixo - Apenas para Admin/Manager */}
      {isAdminOrManager && materiaisBaixoEstoque.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Materiais com Estoque Baixo
              </h3>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              {materiaisBaixoEstoque.length} {materiaisBaixoEstoque.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="space-y-3">
            {materiaisBaixoEstoque.map((material: any) => (
              <div
                key={material.id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer"
                onClick={() => navigate('/materiais')}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">{material.nome}</p>
                    <p className="text-sm text-gray-600">
                      Mínimo: {material.quantidade_minima} {material.unidade_medida.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-yellow-700">
                    {material.quantidade_estoque} {material.unidade_medida.toLowerCase()}
                  </p>
                  <p className="text-xs text-yellow-600">Estoque atual</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage