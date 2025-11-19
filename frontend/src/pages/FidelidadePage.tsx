import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gift, Settings, Plus, Edit2, Trash2, Award } from 'lucide-react'
import { fidelidadeApi } from '../services/api'
import type { Premio, PremioCreate, ConfiguracaoFidelidadeCreate } from '../types'

export default function FidelidadePage() {
  const [activeTab, setActiveTab] = useState<'config' | 'premios'>('config')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPremio, setEditingPremio] = useState<Premio | null>(null)
  const queryClient = useQueryClient()

  // Query configuração
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['fidelidade-config'],
    queryFn: async () => {
      try {
        return await fidelidadeApi.getConfiguracao()
      } catch (error: any) {
        // Se não existe configuração (404), retorna null
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    retry: false,
  })

  // Query prêmios
  const { data: premios = [], isLoading: loadingPremios } = useQuery({
    queryKey: ['premios'],
    queryFn: () => fidelidadeApi.listPremios(false),
  })

  // Mutation configuração
  const configMutation = useMutation({
    mutationFn: (data: ConfiguracaoFidelidadeCreate) =>
      config
        ? fidelidadeApi.updateConfiguracao(data)
        : fidelidadeApi.createConfiguracao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fidelidade-config'] })
      alert('Configuração salva com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao salvar configuração:', error)
      alert(`Erro ao salvar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  // Mutation criar prêmio
  const createPremioMutation = useMutation({
    mutationFn: fidelidadeApi.createPremio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios'] })
      setIsModalOpen(false)
      alert('Prêmio criado com sucesso!')
    },
  })

  // Mutation atualizar prêmio
  const updatePremioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PremioCreate> }) =>
      fidelidadeApi.updatePremio(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios'] })
      setIsModalOpen(false)
      setEditingPremio(null)
      alert('Prêmio atualizado com sucesso!')
    },
  })

  // Mutation deletar prêmio
  const deletePremioMutation = useMutation({
    mutationFn: fidelidadeApi.deletePremio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios'] })
      alert('Prêmio desativado com sucesso!')
    },
  })

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      reais_por_ponto: Number(formData.get('reais_por_ponto')),
      ativo: formData.get('ativo') === 'on',
    }
    configMutation.mutate(data)
  }

  const handleSavePremio = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data: PremioCreate = {
      nome: formData.get('nome') as string,
      descricao: formData.get('descricao') as string || undefined,
      pontos_necessarios: Number(formData.get('pontos_necessarios')),
      tipo_premio: formData.get('tipo_premio') as any,
      valor_desconto: formData.get('valor_desconto')
        ? Number(formData.get('valor_desconto'))
        : undefined,
      servico_id: formData.get('servico_id')
        ? Number(formData.get('servico_id'))
        : undefined,
      ativo: formData.get('ativo') !== 'off',
    }

    if (editingPremio) {
      updatePremioMutation.mutate({ id: editingPremio.id, data })
    } else {
      createPremioMutation.mutate(data)
    }
  }

  const handleDeletePremio = (id: number) => {
    if (confirm('Deseja realmente desativar este prêmio?')) {
      deletePremioMutation.mutate(id)
    }
  }

  const getTipoPremioLabel = (tipo: string) => {
    const labels = {
      DESCONTO_PERCENTUAL: 'Desconto %',
      DESCONTO_FIXO: 'Desconto R$',
      SERVICO_GRATIS: 'Serviço Grátis',
      PRODUTO: 'Produto',
    }
    return labels[tipo as keyof typeof labels] || tipo
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Gift className="w-8 h-8" />
          Programa de Fidelidade
        </h1>
        <p className="text-gray-600 mt-2">
          Configure pontos e prêmios para seus clientes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Settings className="w-5 h-5" />
            Configuração
          </button>
          <button
            onClick={() => setActiveTab('premios')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'premios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Award className="w-5 h-5" />
            Prêmios ({premios.length})
          </button>
        </nav>
      </div>

      {/* Configuração Tab */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Configuração de Pontos</h2>

          {loadingConfig ? (
            <p>Carregando...</p>
          ) : (
            <form onSubmit={handleSaveConfig} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor em Reais por Ponto
                </label>
                <input
                  type="number"
                  name="reais_por_ponto"
                  step="0.01"
                  min="0.01"
                  defaultValue={config?.reais_por_ponto || 100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ex: 100 = Cliente ganha 1 ponto a cada R$ 100,00 gastos
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  id="config_ativo"
                  defaultChecked={config?.ativo !== false}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="config_ativo" className="ml-2 text-sm text-gray-700">
                  Sistema de fidelidade ativo
                </label>
              </div>

              <button
                type="submit"
                disabled={configMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {configMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Prêmios Tab */}
      {activeTab === 'premios' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Catálogo de Prêmios</h2>
            <button
              onClick={() => {
                setEditingPremio(null)
                setIsModalOpen(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Novo Prêmio
            </button>
          </div>

          {loadingPremios ? (
            <p>Carregando prêmios...</p>
          ) : premios.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum prêmio cadastrado ainda.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {premios.map((premio) => (
                <div
                  key={premio.id}
                  className={`bg-white rounded-lg shadow p-6 ${
                    !premio.ativo ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold">{premio.nome}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPremio(premio)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePremio(premio.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {premio.descricao && (
                    <p className="text-sm text-gray-600 mb-3">{premio.descricao}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pontos necessários:</span>
                      <span className="font-semibold">{premio.pontos_necessarios}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-semibold">
                        {getTipoPremioLabel(premio.tipo_premio)}
                      </span>
                    </div>
                    {premio.valor_desconto && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor:</span>
                        <span className="font-semibold">
                          {premio.tipo_premio === 'DESCONTO_PERCENTUAL'
                            ? `${premio.valor_desconto}%`
                            : `R$ ${Number(premio.valor_desconto).toFixed(2)}`}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          premio.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {premio.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Prêmio */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingPremio ? 'Editar Prêmio' : 'Novo Prêmio'}
              </h3>

              <form onSubmit={handleSavePremio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <input
                    type="text"
                    name="nome"
                    defaultValue={editingPremio?.nome}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Descrição</label>
                  <textarea
                    name="descricao"
                    defaultValue={editingPremio?.descricao || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Pontos Necessários *
                  </label>
                  <input
                    type="number"
                    name="pontos_necessarios"
                    min="1"
                    defaultValue={editingPremio?.pontos_necessarios || 10}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <select
                    name="tipo_premio"
                    defaultValue={editingPremio?.tipo_premio || 'DESCONTO_PERCENTUAL'}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="DESCONTO_PERCENTUAL">Desconto Percentual</option>
                    <option value="DESCONTO_FIXO">Desconto Fixo (R$)</option>
                    <option value="SERVICO_GRATIS">Serviço Grátis</option>
                    <option value="PRODUTO">Produto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Valor do Desconto</label>
                  <input
                    type="number"
                    name="valor_desconto"
                    step="0.01"
                    min="0"
                    defaultValue={editingPremio?.valor_desconto || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para % ou R$ de desconto
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    id="premio_ativo"
                    defaultChecked={editingPremio?.ativo !== false}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="premio_ativo" className="ml-2 text-sm">
                    Prêmio ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      setEditingPremio(null)
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createPremioMutation.isPending || updatePremioMutation.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createPremioMutation.isPending || updatePremioMutation.isPending
                      ? 'Salvando...'
                      : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
