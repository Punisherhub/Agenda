import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materiaisApi } from '../../services/api'
import { Material } from '../../types'
import MobileLayout from '../layouts/MobileLayout'
import MobileFAB from '../components/MobileFAB'
import MobileMaterialModal from '../components/MobileMaterialModal'

const MobileMateriaisPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [materiais, setMateriais] = useState<any[]>([])
  const [erro, setErro] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  // Buscar materiais com proteção máxima contra erros
  const query = useQuery({
    queryKey: ['materiais-mobile-safe'],
    queryFn: async () => {
      try {
        const result = await materiaisApi.list()
        return result
      } catch (error) {
        console.error('Erro materiais mobile:', error)
        setErro(true)
        return { materiais: [] }
      }
    },
    retry: false,
    staleTime: 30000
  })

  // Mutation criar material
  const createMutation = useMutation({
    mutationFn: materiaisApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais-mobile-safe'] })
      setIsModalOpen(false)
      setEditingMaterial(null)
      alert('✅ Material criado com sucesso!')
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao criar material:\n${errorMsg}`)
    }
  })

  // Mutation atualizar material
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      materiaisApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais-mobile-safe'] })
      setIsModalOpen(false)
      setEditingMaterial(null)
      alert('✅ Material atualizado com sucesso!')
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao atualizar material:\n${errorMsg}`)
    }
  })

  // Mutation deletar material
  const deleteMutation = useMutation({
    mutationFn: materiaisApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais-mobile-safe'] })
      alert('✅ Material deletado com sucesso!')
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail || error.message || 'Erro desconhecido'
      alert(`❌ Erro ao deletar material:\n${errorMsg}`)
    }
  })

  // Atualizar estado quando query retornar
  useEffect(() => {
    if (query.data && query.data.materiais) {
      setMateriais(query.data.materiais)
    }
  }, [query.data])

  const isLoading = query.isLoading

  // Handler para salvar material (criar ou editar)
  const handleSaveMaterial = (data: any) => {
    if (editingMaterial) {
      updateMutation.mutate({ id: editingMaterial.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Handler para editar
  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setIsModalOpen(true)
  }

  // Handler para deletar
  const handleDelete = (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja deletar o material "${nome}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  // Handler para abrir modal de criação
  const handleOpenModal = () => {
    setEditingMaterial(null)
    setIsModalOpen(true)
  }

  // Calcular estatísticas de forma segura
  const calcularEstatisticas = () => {
    if (!materiais || materiais.length === 0) {
      return {
        baixoEstoque: 0,
        valorTotal: 0
      }
    }

    try {
      const baixoEstoque = materiais.filter((m: any) => {
        const qtd = Number(m.quantidade_estoque) || 0
        const min = Number(m.quantidade_minima) || 0
        return qtd <= min
      }).length

      const valorTotal = materiais.reduce((sum: number, m: any) => {
        const qtd = Number(m.quantidade_estoque) || 0
        const custo = Number(m.valor_custo) || 0
        return sum + (qtd * custo)
      }, 0)

      return { baixoEstoque, valorTotal }
    } catch (e) {
      console.error('Erro ao calcular:', e)
      return { baixoEstoque: 0, valorTotal: 0 }
    }
  }

  const stats = calcularEstatisticas()

  const getStatusEstoque = (material: any) => {
    try {
      const qtd = Number(material.quantidade_estoque) || 0
      const min = Number(material.quantidade_minima) || 0  // CORRIGIDO

      if (qtd <= 0) {
        return { texto: 'Sem estoque', cor: 'bg-red-100 text-red-800' }
      }
      if (qtd <= min) {
        return { texto: 'Estoque baixo', cor: 'bg-yellow-100 text-yellow-800' }
      }
      return { texto: 'Em estoque', cor: 'bg-green-100 text-green-800' }
    } catch (e) {
      return { texto: 'N/A', cor: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materiais</h2>
          <p className="text-gray-600">Controle de estoque</p>
        </div>

        {/* Alerta de Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800">
              Erro ao carregar dados. Usando modo offline.
            </div>
          </div>
        )}

        {/* Alerta Estoque Baixo */}
        {stats.baixoEstoque > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div>
              <div className="font-bold text-yellow-800">
                {stats.baixoEstoque} {stats.baixoEstoque === 1 ? 'item' : 'itens'} com estoque baixo
              </div>
              <div className="text-sm text-yellow-700">Verifique e reponha</div>
            </div>
          </div>
        )}

        {/* Valor Total em Estoque */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600">Valor total em estoque</div>
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? '...' : `R$ ${stats.valorTotal.toFixed(2)}`}
          </div>
        </div>

        {/* Lista de Materiais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Carregando...' : `${materiais.length} ${materiais.length === 1 ? 'material' : 'materiais'}`}
            </p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : materiais.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Nenhum material encontrado
            </div>
          ) : (
            materiais.map((material: any) => {
              const status = getStatusEstoque(material)
              const qtd = Number(material.quantidade_estoque) || 0
              const custo = Number(material.valor_custo) || 0  // CORRIGIDO
              const min = Number(material.quantidade_minima) || 0  // CORRIGIDO
              const valorTotal = qtd * custo

              return (
                <div
                  key={material.id}
                  className="bg-white rounded-lg shadow-sm p-4 space-y-3"
                >
                  {/* Cabeçalho */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{material.nome}</h3>
                      {material.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{material.descricao}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${status.cor}`}>
                      {status.texto}
                    </span>
                  </div>

                  {/* Detalhes */}
                  <div className="border-t pt-2 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Estoque</p>
                      <p className="text-sm font-medium text-gray-900">
                        {qtd} {material.unidade_medida}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mínimo</p>
                      <p className="text-sm font-medium text-gray-900">
                        {min} {material.unidade_medida}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Custo Unitário</p>
                      <p className="text-sm font-medium text-gray-900">
                        R$ {custo.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Valor Total</p>
                      <p className="text-sm font-bold text-green-600">
                        R$ {valorTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleEdit(material)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(material.id, material.nome)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700"
                    >
                      Deletar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>

      {/* FAB para adicionar novo material */}
      <MobileFAB onClick={handleOpenModal} />

      {/* Modal de Material */}
      <MobileMaterialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMaterial(null)
        }}
        onSave={handleSaveMaterial}
        material={editingMaterial}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </MobileLayout>
  )
}

export default MobileMateriaisPage
