import React, { useState } from 'react'
import { X, Calendar, Clock, User, Scissors, DollarSign, MessageSquare, MapPin, Phone, Mail, Edit3, Trash2, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Agendamento, Servico, Cliente, ConsumoMaterialCreate, ConsumoMaterial } from '../types'
import { useQuery } from '@tanstack/react-query'
import { materiaisApi } from '../services/api'
import ConsumoMaterialModal from './ConsumoMaterialModal'

interface AgendamentoDetailModalProps {
  isOpen: boolean
  onClose: () => void
  agendamento: Agendamento | null
  servicos: Servico[]
  clientes: Cliente[]
  onEdit: (agendamento: Agendamento) => void
  onUpdateStatus: (id: number, status: string) => Promise<void>
  onCancel: (id: number) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  loading?: boolean
}

const AgendamentoDetailModal: React.FC<AgendamentoDetailModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  servicos,
  clientes,
  onEdit,
  onUpdateStatus,
  onCancel,
  onDelete,
  // loading = false
}) => {
  const [updating, setUpdating] = useState(false)
  const [consumoModalOpen, setConsumoModalOpen] = useState(false)

  // Buscar consumos de materiais
  const { data: consumos, refetch: refetchConsumos } = useQuery({
    queryKey: ['consumos-materiais', agendamento?.id],
    queryFn: () => agendamento ? materiaisApi.listarConsumos(agendamento.id) : Promise.resolve([]),
    enabled: isOpen && !!agendamento && agendamento.status === 'CONCLUIDO'
  })

  if (!isOpen || !agendamento) return null

  const servico = servicos.find(s => s.id === agendamento.servico_id) || agendamento.servico
  const cliente = clientes.find(c => c.id === agendamento.cliente_id) || agendamento.cliente

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGENDADO':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CONFIRMADO':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CONCLUIDO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'CANCELADO':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NAO_COMPARECEU':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'AGENDADO':
        return 'Agendado'
      case 'CONFIRMADO':
        return 'Confirmado'
      case 'CONCLUIDO':
        return 'Concluído'
      case 'CANCELADO':
        return 'Cancelado'
      case 'NAO_COMPARECEU':
        return 'Não Compareceu'
      default:
        return status
    }
  }

  const getUnidadeLabel = (unidade: string) => {
    switch (unidade) {
      case 'ML':
        return 'ml'
      case 'UNIDADE':
        return 'un'
      case 'GRAMA':
        return 'g'
      default:
        return unidade
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      console.log('Atualizando status para:', newStatus)
      await onUpdateStatus(agendamento.id, newStatus)
      console.log('Status atualizado com sucesso')
      // Fechar modal após atualização bem-sucedida
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
          console.log('Excluindo agendamento:', agendamento.id)
          await onDelete(agendamento.id)
          console.log('Agendamento excluído com sucesso')
          onClose()
        } else {
          console.error('onDelete não está definido')
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
    // Abrir modal de consumo de materiais antes de concluir
    setConsumoModalOpen(true)
  }

  const handleConcluirSemConsumo = async () => {
    // Concluir sem registrar consumo de materiais
    await handleUpdateStatus('CONCLUIDO')
  }

  const handleSalvarConsumo = async (consumosData: ConsumoMaterialCreate[]) => {
    setUpdating(true)
    try {
      // Registrar consumo de materiais
      if (consumosData.length > 0) {
        await materiaisApi.registrarConsumo(agendamento.id, consumosData)
      }

      // Atualizar status para CONCLUIDO
      await onUpdateStatus(agendamento.id, 'CONCLUIDO')

      // Recarregar consumos
      await refetchConsumos()

      setConsumoModalOpen(false)
      onClose()
    } catch (error) {
      console.error('Erro ao registrar consumo:', error)
      throw error
    } finally {
      setUpdating(false)
    }
  }

  const canEdit = !['CONCLUIDO', 'CANCELADO'].includes(agendamento.status)
  const canCancel = !['CONCLUIDO', 'CANCELADO'].includes(agendamento.status)
  const canDelete = onDelete !== undefined // Sempre pode deletar se a função estiver disponível
  const canReativar = agendamento.status === 'NAO_COMPARECEU'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Detalhes do Agendamento</h2>
            <p className="text-sm text-gray-500 mt-1">#{agendamento.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(agendamento.status)}`}
              >
                {getStatusLabel(agendamento.status)}
              </span>
            </div>
            <div className="flex space-x-2">
              {canEdit && (
                <button
                  onClick={() => onEdit(agendamento)}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="flex items-center px-3 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={updating}
                  className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  title="Excluir agendamento permanentemente"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </button>
              )}
            </div>
          </div>

          {/* Cliente */}
          {cliente && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nome:</span> {cliente.nome}
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-1 text-gray-400" />
                  {cliente.telefone}
                </div>
                {cliente.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1 text-gray-400" />
                    {cliente.email}
                  </div>
                )}
                {cliente.endereco && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    {cliente.endereco}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Serviço */}
          {servico && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Scissors className="w-5 h-5 mr-2" />
                Serviço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Nome:</span> {servico.nome}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Duração:</span> {servico.duracao_minutos} minutos
                </div>
                <div>
                  <span className="font-medium text-gray-700">Preço:</span> R$ {Number(servico.preco).toFixed(2)}
                </div>
                {servico.categoria && (
                  <div>
                    <span className="font-medium text-gray-700">Categoria:</span> {servico.categoria}
                  </div>
                )}
                {servico.descricao && (
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Descrição:</span> {servico.descricao}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Data e Horário
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Data:</span>{' '}
                {format(new Date(agendamento.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-400" />
                {format(new Date(agendamento.data_inicio), 'HH:mm')} às{' '}
                {format(new Date(agendamento.data_fim), 'HH:mm')}
              </div>
              <div>
                <span className="font-medium text-gray-700">Agendado em:</span>{' '}
                {format(new Date(agendamento.data_agendamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Valores
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Valor do Serviço:</span><br />
                R$ {Number(agendamento.valor_servico).toFixed(2)}
              </div>
              {agendamento.valor_desconto > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Desconto:</span><br />
                  R$ {Number(agendamento.valor_desconto).toFixed(2)}
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Valor Final:</span><br />
                <span className="text-lg font-semibold text-green-600">
                  R$ {Number(agendamento.valor_final).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-yellow-200">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Forma de Pagamento:</span>{' '}
                {agendamento.forma_pagamento === 'pendente' ? (
                  <span className="text-orange-600">Pendente</span>
                ) : (
                  <span className="capitalize">{agendamento.forma_pagamento.replace('_', ' ')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          {agendamento.observacoes && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Observações
              </h3>
              <p className="text-sm text-gray-700">{agendamento.observacoes}</p>
            </div>
          )}

          {/* Materiais Consumidos */}
          {agendamento.status === 'CONCLUIDO' && consumos && consumos.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Materiais Utilizados
              </h3>
              <div className="space-y-2">
                {consumos.map((consumo: ConsumoMaterial) => (
                  <div key={consumo.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                    <div>
                      <span className="font-medium">
                        {consumo.material?.nome || `Material #${consumo.material_id}`}
                      </span>
                      <span className="text-gray-600 ml-2">
                        Qtd: {consumo.quantidade_consumida} {consumo.material ? getUnidadeLabel(consumo.material.unidade_medida) : ''}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        R$ {Number(consumo.valor_total).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        R$ {Number(consumo.valor_custo_unitario).toFixed(2)} / {consumo.material ? getUnidadeLabel(consumo.material.unidade_medida) : 'un'}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                  <span>Custo Total dos Materiais:</span>
                  <span className="text-orange-600">
                    R$ {consumos.reduce((total: number, c: ConsumoMaterial) => total + Number(c.valor_total), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ações por Status */}
          {!['CONCLUIDO', 'CANCELADO'].includes(agendamento.status) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Ações Disponíveis</h3>
              <div className="flex flex-wrap gap-2">
                {['AGENDADO', 'CONFIRMADO'].includes(agendamento.status) && (
                  <>
                    <button
                      onClick={handleConcluirComConsumo}
                      disabled={updating}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm inline-flex items-center justify-center"
                    >
                      {updating && <span className="inline-block animate-spin mr-2">⟳</span>}
                      {updating ? 'Atualizando...' : 'Concluir com Materiais'}
                    </button>
                    <button
                      onClick={handleConcluirSemConsumo}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm inline-flex items-center justify-center"
                    >
                      {updating && <span className="inline-block animate-spin mr-2">⟳</span>}
                      {updating ? 'Atualizando...' : 'Concluir sem Materiais'}
                    </button>
                  </>
                )}

                {['AGENDADO', 'CONFIRMADO'].includes(agendamento.status) && (
                  <button
                    onClick={() => handleUpdateStatus('NAO_COMPARECEU')}
                    disabled={updating}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm inline-flex items-center justify-center"
                  >
                    {updating && <span className="inline-block animate-spin mr-2">⟳</span>}
                    {updating ? 'Atualizando...' : 'Não Compareceu'}
                  </button>
                )}

                {canReativar && (
                  <button
                    onClick={() => handleUpdateStatus('CONFIRMADO')}
                    disabled={updating}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm inline-flex items-center justify-center"
                  >
                    {updating && <span className="inline-block animate-spin mr-2">⟳</span>}
                    {updating ? 'Atualizando...' : 'Reagendar / Confirmar'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Avaliação */}
          {agendamento.status === 'CONCLUIDO' && agendamento.avaliacao_nota && (
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Avaliação do Cliente</h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium">Nota:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= agendamento.avaliacao_nota! ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">({agendamento.avaliacao_nota}/5)</span>
              </div>
              {agendamento.avaliacao_comentario && (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Comentário:</span> {agendamento.avaliacao_comentario}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Modal de Consumo de Materiais */}
      <ConsumoMaterialModal
        isOpen={consumoModalOpen}
        onClose={() => setConsumoModalOpen(false)}
        onSave={handleSalvarConsumo}
      />
    </div>
  )
}

export default AgendamentoDetailModal