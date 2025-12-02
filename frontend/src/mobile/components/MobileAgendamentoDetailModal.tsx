import React, { useState } from 'react'
import { Agendamento, Servico, Cliente } from '../../types'
import { useQuery } from '@tanstack/react-query'
import { materiaisApi } from '../../services/api'

interface MobileAgendamentoDetailModalProps {
  isOpen: boolean
  onClose: () => void
  agendamento: Agendamento | null
  servicos: Servico[]
  clientes: Cliente[]
  onEdit: (agendamento: Agendamento) => void
  onUpdateStatus: (id: number, status: string) => Promise<void>
  onCancel: (id: number) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  onConcluirComMateriais: (agendamento: Agendamento) => void
  loading?: boolean
}

const MobileAgendamentoDetailModal: React.FC<MobileAgendamentoDetailModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  servicos,
  clientes,
  onEdit,
  onUpdateStatus,
  onCancel,
  onDelete,
  onConcluirComMateriais,
  loading = false
}) => {
  const [updating, setUpdating] = useState(false)

  // Buscar consumos de materiais
  const { data: consumos } = useQuery({
    queryKey: ['consumos-materiais', agendamento?.id],
    queryFn: () => agendamento ? materiaisApi.listarConsumos(agendamento.id) : Promise.resolve([]),
    enabled: isOpen && !!agendamento && agendamento.status === 'CONCLUIDO'
  })

  if (!isOpen || !agendamento) return null

  const servico = servicos.find(s => s.id === agendamento.servico_id) || agendamento.servico
  const cliente = clientes.find(c => c.id === agendamento.cliente_id) || agendamento.cliente

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO':
        return 'bg-blue-100 text-blue-800'
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-800'
      case 'EM_ANDAMENTO':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONCLUIDO':
        return 'bg-emerald-100 text-emerald-800'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800'
      case 'NAO_COMPARECEU':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADO': return 'Agendado'
      case 'CONFIRMADO': return 'Confirmado'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDO': return 'Concluído'
      case 'CANCELADO': return 'Cancelado'
      case 'NAO_COMPARECEU': return 'Não Compareceu'
      default: return status
    }
  }

  const getUnidadeLabel = (unidade: string) => {
    switch (unidade) {
      case 'ML': return 'ml'
      case 'UNIDADE': return 'un'
      case 'GRAMA': return 'g'
      default: return unidade
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      await onUpdateStatus(agendamento.id, newStatus)
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status: ' + (error as any)?.response?.data?.detail || (error as Error).message)
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      setUpdating(true)
      try {
        await onCancel(agendamento.id)
        onClose()
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleDelete = async () => {
    const isCanceladoOuNaoCompareceu = ['CANCELADO', 'NAO_COMPARECEU'].includes(agendamento.status)

    const mensagem = isCanceladoOuNaoCompareceu
      ? '⚠️ Tem certeza que deseja EXCLUIR PERMANENTEMENTE este agendamento?\n\nEsta ação NÃO PODE ser desfeita!'
      : '⚠️ ATENÇÃO: Este agendamento NÃO está cancelado!\n\nVocê está prestes a EXCLUIR PERMANENTEMENTE um agendamento ativo.\nEsta ação NÃO PODE ser desfeita!\n\nRecomendamos CANCELAR antes de excluir.\n\nDeseja continuar mesmo assim?'

    if (confirm(mensagem)) {
      setUpdating(true)
      try {
        if (onDelete) {
          await onDelete(agendamento.id)
          onClose()
        }
      } catch (error) {
        console.error('Erro ao excluir agendamento:', error)
        alert('Erro ao excluir agendamento: ' + (error as any)?.response?.data?.detail || (error as Error).message)
      } finally {
        setUpdating(false)
      }
    }
  }

  const handleConcluirComConsumo = () => {
    onConcluirComMateriais(agendamento)
  }

  const handleConcluirSemConsumo = async () => {
    await handleUpdateStatus('CONCLUIDO')
  }

  const canEdit = !['CONCLUIDO', 'CANCELADO'].includes(agendamento.status)
  const canCancel = !['CONCLUIDO', 'CANCELADO'].includes(agendamento.status)
  const canDelete = onDelete !== undefined
  const canReativar = agendamento.status === 'NAO_COMPARECEU'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-white w-full h-full overflow-y-auto">
        {/* Header Fixo */}
        <div className="sticky top-0 bg-blue-600 text-white p-4 shadow-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold">Detalhes</h2>
              <p className="text-sm opacity-90">#{agendamento.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 active:bg-blue-700 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-4">
          {/* Status */}
          <div>
            <span className={`px-3 py-2 text-sm font-bold rounded-full inline-block ${getStatusColor(agendamento.status)}`}>
              {getStatusLabel(agendamento.status)}
            </span>
          </div>

          {/* Cliente */}
          {cliente && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">👤</span>
                Cliente
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Nome:</span> {cliente.nome}
                </div>
                <div className="flex items-center">
                  <span className="text-lg mr-2">📞</span>
                  {cliente.telefone}
                </div>
                {cliente.email && (
                  <div className="flex items-center">
                    <span className="text-lg mr-2">✉️</span>
                    {cliente.email}
                  </div>
                )}
                {cliente.endereco && (
                  <div className="flex items-center">
                    <span className="text-lg mr-2">📍</span>
                    {cliente.endereco}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Serviço */}
          {servico && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">✂️</span>
                Serviço
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Nome:</span> {servico.nome}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Duração:</span> {servico.duracao_minutos} minutos
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Preço:</span> R$ {Number(servico.preco).toFixed(2)}
                </div>
                {servico.categoria && (
                  <div>
                    <span className="font-semibold text-gray-700">Categoria:</span> {servico.categoria}
                  </div>
                )}
                {servico.descricao && (
                  <div>
                    <span className="font-semibold text-gray-700">Descrição:</span> {servico.descricao}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-xl mr-2">📅</span>
              Data e Horário
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Data:</span>{' '}
                {formatData(agendamento.data_inicio)}
              </div>
              <div className="flex items-center">
                <span className="text-lg mr-2">🕐</span>
                {formatHora(agendamento.data_inicio)} às {formatHora(agendamento.data_fim)}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center">
              <span className="text-xl mr-2">💰</span>
              Valores
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Valor do Serviço:</span><br />
                R$ {Number(agendamento.valor_servico).toFixed(2)}
              </div>
              {agendamento.valor_desconto > 0 && (
                <div>
                  <span className="font-semibold text-gray-700">Desconto:</span><br />
                  R$ {Number(agendamento.valor_desconto).toFixed(2)}
                </div>
              )}
              <div className="pt-2 border-t">
                <span className="font-semibold text-gray-700">Valor Final:</span><br />
                <span className="text-2xl font-bold text-green-600">
                  R$ {Number(agendamento.valor_final).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          {agendamento.observacoes && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">💬</span>
                Observações
              </h3>
              <p className="text-sm text-gray-700">{agendamento.observacoes}</p>
            </div>
          )}

          {/* Materiais Consumidos */}
          {agendamento.status === 'CONCLUIDO' && consumos && consumos.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <span className="text-xl mr-2">📦</span>
                Materiais Utilizados
              </h3>
              <div className="space-y-2">
                {consumos.map((consumo: any) => (
                  <div key={consumo.id} className="flex justify-between items-center text-sm bg-white p-3 rounded-lg">
                    <div>
                      <span className="font-semibold">
                        {consumo.material?.nome || `Material #${consumo.material_id}`}
                      </span>
                      <div className="text-gray-600 text-xs">
                        Qtd: {consumo.quantidade_consumida} {consumo.material ? getUnidadeLabel(consumo.material.unidade_medida) : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        R$ {Number(consumo.valor_total).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        R$ {Number(consumo.valor_custo_unitario).toFixed(2)} / {consumo.material ? getUnidadeLabel(consumo.material.unidade_medida) : 'un'}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                  <span>Custo Total:</span>
                  <span className="text-orange-600">
                    R$ {consumos.reduce((total: number, c: any) => total + Number(c.valor_total), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ações Disponíveis */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">Ações Disponíveis</h3>
            <div className="space-y-2">
              {/* Ações de conclusão (apenas para status não finalizados) */}
              {!['CONCLUIDO', 'CANCELADO'].includes(agendamento.status) && (
                <>
                  {['AGENDADO', 'CONFIRMADO', 'EM_ANDAMENTO'].includes(agendamento.status) && (
                    <>
                      <button
                        onClick={handleConcluirComConsumo}
                        disabled={updating || loading}
                        className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold active:bg-emerald-700 disabled:bg-gray-400"
                      >
                        {updating || loading ? '⟳ Processando...' : '✅ Concluir com Materiais'}
                      </button>
                      <button
                        onClick={handleConcluirSemConsumo}
                        disabled={updating || loading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold active:bg-blue-700 disabled:bg-gray-400"
                      >
                        {updating || loading ? '⟳ Processando...' : '✅ Concluir sem Materiais'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('NAO_COMPARECEU')}
                        disabled={updating || loading}
                        className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-semibold active:bg-gray-700 disabled:bg-gray-400"
                      >
                        {updating || loading ? '⟳ Processando...' : '❌ Não Compareceu'}
                      </button>
                    </>
                  )}

                  {canReativar && (
                    <button
                      onClick={() => handleUpdateStatus('CONFIRMADO')}
                      disabled={updating || loading}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold active:bg-green-700 disabled:bg-gray-400"
                    >
                      {updating || loading ? '⟳ Processando...' : '🔄 Reagendar / Confirmar'}
                    </button>
                  )}
                </>
              )}

              {/* Editar (sempre disponível para não concluídos/cancelados) */}
              {canEdit && (
                <button
                  onClick={() => {
                    onEdit(agendamento)
                    onClose()
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold active:bg-blue-700"
                >
                  ✏️ Editar Agendamento
                </button>
              )}

              {/* Cancelar e Excluir */}
              <div className="flex gap-2">
                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={updating || loading}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-semibold active:bg-orange-700 disabled:bg-gray-400"
                  >
                    🚫 Cancelar
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    disabled={updating || loading}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold active:bg-red-700 disabled:bg-gray-400"
                  >
                    🗑️ Excluir
                  </button>
                )}
              </div>

              {/* Mensagem para agendamentos finalizados */}
              {['CONCLUIDO', 'CANCELADO'].includes(agendamento.status) && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 italic">
                    {agendamento.status === 'CONCLUIDO'
                      ? 'Agendamento concluído. Apenas exclusão disponível.'
                      : 'Agendamento cancelado. Apenas exclusão disponível.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileAgendamentoDetailModal
