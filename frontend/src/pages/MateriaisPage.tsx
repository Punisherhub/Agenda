import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { materiaisApi } from '../services/api'
import { Material } from '../types'
import MaterialModal from '../components/MaterialModal'
import { Trash2, Edit, Plus, AlertTriangle } from 'lucide-react'

const MateriaisPage: React.FC = () => {
  const [filtros, setFiltros] = useState({
    nome: '',
    ativo: true
  })

  // Estados dos modais
  const [materialModalOpen, setMaterialModalOpen] = useState(false)
  const [materialSelecionado, setMaterialSelecionado] = useState<Material | null>(null)

  const queryClient = useQueryClient()

  const { data: materiais, isLoading } = useQuery({
    queryKey: ['materiais', filtros],
    queryFn: () => materiaisApi.list(filtros)
  })

  const createMutation = useMutation({
    mutationFn: materiaisApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
      setMaterialModalOpen(false)
      setMaterialSelecionado(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => materiaisApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
      setMaterialModalOpen(false)
      setMaterialSelecionado(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: materiaisApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materiais'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-relatorios'] })
    }
  })

  const handleNovoMaterial = () => {
    setMaterialSelecionado(null)
    setMaterialModalOpen(true)
  }

  const handleEditarMaterial = async (material: Material) => {
    setMaterialSelecionado(material)
    setMaterialModalOpen(true)
  }

  const handleExcluirMaterial = async (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja desativar o material "${nome}"?`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Erro ao excluir material:', error)
        alert('Erro ao excluir material.')
      }
    }
  }

  const handleSalvarMaterial = async (data: any) => {
    try {
      if (materialSelecionado) {
        await updateMutation.mutateAsync({ id: materialSelecionado.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
    } catch (error) {
      console.error('Erro ao salvar material:', error)
      throw error
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

  const isEstoqueBaixo = (material: Material) => {
    if (!material.quantidade_minima) return false
    return material.quantidade_estoque <= material.quantidade_minima
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Materiais</h1>
        <button onClick={handleNovoMaterial} className="btn-primary px-4 py-2 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Material
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              className="input"
              placeholder="Filtrar por nome"
              value={filtros.nome}
              onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input"
              value={filtros.ativo.toString()}
              onChange={(e) => setFiltros({ ...filtros, ativo: e.target.value === 'true' })}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de materiais */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Lista de Materiais
            {materiais && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({materiais.total} total)
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <p className="text-gray-500">Carregando materiais...</p>
            </div>
          ) : materiais?.materiais?.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-500">Nenhum material encontrado</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo/Unidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca/Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materiais?.materiais?.map((material: Material) => (
                  <tr key={material.id} className={isEstoqueBaixo(material) ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isEstoqueBaixo(material) && (
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {material.nome}
                          </div>
                          {material.descricao && (
                            <div className="text-sm text-gray-500">
                              {material.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {Number(material.valor_custo).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        por {getUnidadeLabel(material.unidade_medida)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.quantidade_estoque} {getUnidadeLabel(material.unidade_medida)}
                      </div>
                      {material.quantidade_minima && (
                        <div className="text-xs text-gray-500">
                          Mín: {material.quantidade_minima} {getUnidadeLabel(material.unidade_medida)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {material.marca || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {material.fornecedor || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          material.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {material.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditarMaterial(material)}
                        className="btn-primary px-3 py-1 text-xs inline-flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      {material.is_active && (
                        <button
                          onClick={() => handleExcluirMaterial(material.id, material.nome)}
                          className="btn-danger px-3 py-1 text-xs inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Desativar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      <MaterialModal
        isOpen={materialModalOpen}
        onClose={() => {
          setMaterialModalOpen(false)
          setMaterialSelecionado(null)
        }}
        onSave={handleSalvarMaterial}
        material={materialSelecionado}
      />
    </div>
  )
}

export default MateriaisPage
