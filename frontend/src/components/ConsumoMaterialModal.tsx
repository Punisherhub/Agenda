import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { materiaisApi } from '../services/api'
import { Material, ConsumoMaterialCreate } from '../types'

interface ConsumoMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (consumos: ConsumoMaterialCreate[]) => Promise<void>
}

interface ConsumoItem {
  material_id: number
  quantidade_consumida: number
}

const ConsumoMaterialModal: React.FC<ConsumoMaterialModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [consumos, setConsumos] = useState<ConsumoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: materiaisData } = useQuery({
    queryKey: ['materiais', { ativo: true }],
    queryFn: () => materiaisApi.list({ ativo: true }),
    enabled: isOpen
  })

  const materiais = materiaisData?.materiais || []

  useEffect(() => {
    if (isOpen) {
      setConsumos([])
      setError('')
    }
  }, [isOpen])

  const handleAddConsumo = () => {
    if (materiais.length > 0) {
      setConsumos([...consumos, { material_id: materiais[0].id, quantidade_consumida: 0 }])
    }
  }

  const handleRemoveConsumo = (index: number) => {
    setConsumos(consumos.filter((_, i) => i !== index))
  }

  const handleChangeConsumo = (index: number, field: keyof ConsumoItem, value: any) => {
    const newConsumos = [...consumos]
    newConsumos[index] = { ...newConsumos[index], [field]: value }
    setConsumos(newConsumos)
  }

  const getMaterialById = (id: number): Material | undefined => {
    return materiais.find((m: Material) => m.id === id)
  }

  const getUnidadeLabel = (unidade: string) => {
    switch (unidade) {
      case 'ML': return 'ml'
      case 'UNIDADE': return 'un'
      case 'GRAMA': return 'g'
      default: return unidade
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (consumos.length === 0) {
      setError('Adicione pelo menos um material')
      return
    }

    // Validar quantidades
    for (const consumo of consumos) {
      if (consumo.quantidade_consumida <= 0) {
        setError('Todas as quantidades devem ser maiores que zero')
        return
      }

      const material = getMaterialById(consumo.material_id)
      if (material && consumo.quantidade_consumida > material.quantidade_estoque) {
        setError(`Estoque insuficiente para ${material.nome}. Disponível: ${material.quantidade_estoque}`)
        return
      }
    }

    setLoading(true)
    try {
      await onSave(consumos)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao registrar consumo')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            Registrar Consumo de Materiais
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6" autoComplete="off">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Materiais Utilizados</h3>
              <button
                type="button"
                onClick={handleAddConsumo}
                className="btn-primary px-3 py-2 text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Material
              </button>
            </div>

            {consumos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum material adicionado. Clique em "Adicionar Material" para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {consumos.map((consumo, index) => {
                  const material = getMaterialById(consumo.material_id)
                  return (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Material
                        </label>
                        <select
                          className="input"
                          value={consumo.material_id}
                          onChange={(e) => handleChangeConsumo(index, 'material_id', parseInt(e.target.value))}
                          required
                        >
                          {materiais.map((mat: Material) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.nome} - Estoque: {mat.quantidade_estoque} {getUnidadeLabel(mat.unidade_medida)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade {material && `(${getUnidadeLabel(material.unidade_medida)})`}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="input"
                          value={consumo.quantidade_consumida}
                          onChange={(e) => handleChangeConsumo(index, 'quantidade_consumida', parseFloat(e.target.value))}
                          placeholder="0"
                          required
                        />
                      </div>

                      {material && (
                        <div className="w-32 pt-7">
                          <div className="text-sm text-gray-600">
                            Custo: R$ {(material.valor_custo * consumo.quantidade_consumida).toFixed(2)}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveConsumo(index)}
                        className="btn-danger p-2 mt-7"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {consumos.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    Custo Total: R$ {consumos.reduce((total, consumo) => {
                      const material = getMaterialById(consumo.material_id)
                      return total + (material ? material.valor_custo * consumo.quantidade_consumida : 0)
                    }, 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2"
              disabled={loading || consumos.length === 0}
            >
              {loading ? 'Registrando...' : 'Registrar Consumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConsumoMaterialModal
