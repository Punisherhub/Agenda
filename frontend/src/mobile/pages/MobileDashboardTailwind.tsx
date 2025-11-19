import React from 'react'
import { useNavigate } from 'react-router-dom'
import MobileLayoutTailwind from '../layouts/MobileLayoutTailwind'

const MobileDashboardTailwind: React.FC = () => {
  const navigate = useNavigate()

  console.log('MobileDashboardTailwind rendering...')

  const stats = {
    agendamentos_hoje: 8,
    clientes_total: 45,
    receita_mes: 12500,
    materiais_baixo: 3
  }

  const quickActions = [
    { emoji: '📅', label: 'Novo Agendamento', color: 'bg-blue-500', path: '/agendamentos' },
    { emoji: '👤', label: 'Novo Cliente', color: 'bg-green-500', path: '/clientes' }
  ]

  return (
    <MobileLayoutTailwind>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Painel</h2>
          <p className="text-gray-600">Bem-vindo ao Agenda OnSell</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.agendamentos_hoje}</div>
            <div className="text-sm text-gray-600">Agendamentos Hoje</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">{stats.clientes_total}</div>
            <div className="text-sm text-gray-600">Clientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-purple-600">R$ {stats.receita_mes.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Receita do Mês</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.materiais_baixo}</div>
            <div className="text-sm text-gray-600">Materiais Baixos</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`${action.color} text-white rounded-lg p-4 flex flex-col items-center justify-center space-y-2 active:opacity-80 transition-opacity`}
              >
                <div className="text-3xl">{action.emoji}</div>
                <span className="text-sm font-medium text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Próximos Agendamentos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Próximos Agendamentos</h3>
          <div className="bg-white rounded-lg shadow-sm divide-y">
            <div className="p-4 active:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">João Silva</p>
                  <p className="text-sm text-gray-600">Corte de Cabelo</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">14:00</p>
                  <p className="text-xs text-gray-500">Hoje</p>
                </div>
              </div>
            </div>
            <div className="p-4 active:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Maria Santos</p>
                  <p className="text-sm text-gray-600">Barba</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">15:30</p>
                  <p className="text-xs text-gray-500">Hoje</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/agendamentos')}
              className="w-full p-3 text-center text-blue-600 font-medium active:bg-gray-50"
            >
              Ver Todos
            </button>
          </div>
        </div>
      </div>
    </MobileLayoutTailwind>
  )
}

export default MobileDashboardTailwind
