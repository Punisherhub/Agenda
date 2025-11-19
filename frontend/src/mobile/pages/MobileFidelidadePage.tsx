import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fidelidadeApi } from '../../services/api'
import type { Premio, PremioCreate, ConfiguracaoFidelidadeCreate } from '../../types'
import MobileModal from '../components/MobileModal'

export default function MobileFidelidadePage() {
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
      alert('Configuração salva!')
    },
    onError: (error: any) => {
      alert(`Erro: ${error?.response?.data?.detail || error.message}`)
    },
  })

  // Mutation criar prêmio
  const createPremioMutation = useMutation({
    mutationFn: fidelidadeApi.createPremio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios'] })
      setIsModalOpen(false)
      alert('Prêmio criado!')
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
      alert('Prêmio atualizado!')
    },
  })

  // Mutation deletar prêmio
  const deletePremioMutation = useMutation({
    mutationFn: fidelidadeApi.deletePremio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premios'] })
      alert('Prêmio desativado!')
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
    if (confirm('Desativar este prêmio?')) {
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
    <div className="pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Fidelidade</h1>
        <p className="text-sm text-blue-100">Gerencie pontos e prêmios</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'config'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Configuração
        </button>
        <button
          onClick={() => setActiveTab('premios')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${
            activeTab === 'premios'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500'
          }`}
        >
          Prêmios ({premios.length})
        </button>
      </div>

      {/* Configuração Tab */}
      {activeTab === 'config' && (
        <div className="p-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Configuração de Pontos</h2>

            {loadingConfig ? (
              <p className="text-gray-500">Carregando...</p>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 100 = 1 ponto a cada R$ 100
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    id="config_ativo"
                    defaultChecked={config?.ativo !== false}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="config_ativo" className="ml-2 text-sm text-gray-700">
                    Sistema ativo
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={configMutation.isPending}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:opacity-50"
                >
                  {configMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Prêmios Tab */}
      {activeTab === 'premios' && (
        <div className="p-4 space-y-3">
          <button
            onClick={() => {
              setEditingPremio(null)
              setIsModalOpen(true)
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700"
          >
            + Novo Prêmio
          </button>

          {loadingPremios ? (
            <p className="text-gray-500 text-center py-8">Carregando...</p>
          ) : premios.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Nenhum prêmio cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {premios.map((premio) => (
                <div
                  key={premio.id}
                  className={`bg-white rounded-lg shadow p-4 ${
                    !premio.ativo ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold">{premio.nome}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingPremio(premio)
                          setIsModalOpen(true)
                        }}
                        className="text-blue-600 text-sm font-medium active:text-blue-800"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePremio(premio.id)}
                        className="text-red-600 text-sm font-medium active:text-red-800"
                      >
                        Deletar
                      </button>
                    </div>
                  </div>

                  {premio.descricao && (
                    <p className="text-sm text-gray-600 mb-3">{premio.descricao}</p>
                  )}

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pontos:</span>
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
                    <div className="pt-2 border-t mt-2">
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
        <MobileModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPremio(null)
          }}
          title={editingPremio ? 'Editar Prêmio' : 'Novo Prêmio'}
        >
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
                <option value="DESCONTO_PERCENTUAL">Desconto %</option>
                <option value="DESCONTO_FIXO">Desconto R$</option>
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
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium active:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createPremioMutation.isPending || updatePremioMutation.isPending}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:opacity-50"
              >
                {createPremioMutation.isPending || updatePremioMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </button>
            </div>
          </form>
        </MobileModal>
      )}
    </div>
  )
}
