import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { materiaisApi } from '../../services/api'
import { Material, ConsumoMaterialCreate } from '../../types'

interface MobileConsumoMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (consumos: ConsumoMaterialCreate[]) => Promise<void>
}

interface ConsumoItem {
  material_id: number
  quantidade_consumida: number
}

const MobileConsumoMaterialModal: React.FC<MobileConsumoMaterialModalProps> = ({
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-white w-full h-full overflow-y-auto">
        {/* Header Fixo */}
        <div className="sticky top-0 bg-green-600 text-white p-4 shadow-md z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold">Materiais</h2>
              <p className="text-sm opacity-90">Registrar consumo</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 active:bg-green-700 rounded-full"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-32" autoComplete="off">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Materiais Utilizados</h3>
              <button
                type="button"
                onClick={handleAddConsumo}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold active:bg-green-700"
              >
                ➕ Adicionar
              </button>
            </div>

            {consumos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-3xl mb-2">📦</p>
                <p>Nenhum material adicionado</p>
                <p className="text-sm mt-1">Clique em "Adicionar" para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consumos.map((consumo, index) => {
                  const material = getMaterialById(consumo.material_id)
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-900">Material #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => handleRemoveConsumo(index)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm active:bg-red-700"
                        >
                          🗑️ Remover
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Material
                        </label>
                        <select
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
                          value={consumo.material_id}
                          onChange={(e) => handleChangeConsumo(index, 'material_id', parseInt(e.target.value))}
                          required
                        >
                          {materiais.map((mat: Material) => (
                            <option key={mat.id} value={mat.id}>
                              {mat.nome} (Estoque: {mat.quantidade_estoque} {getUnidadeLabel(mat.unidade_medida)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Quantidade {material && `(${getUnidadeLabel(material.unidade_medida)})`}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base"
                          value={consumo.quantidade_consumida || ''}
                          onChange={(e) => handleChangeConsumo(index, 'quantidade_consumida', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          required
                        />
                      </div>

                      {material && consumo.quantidade_consumida > 0 && (
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Custo unitário:</span>
                            <span className="font-semibold">R$ {Number(material.valor_custo).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t">
                            <span className="text-sm font-bold text-gray-900">Custo total:</span>
                            <span className="font-bold text-green-600">
                              R$ {(material.valor_custo * consumo.quantidade_consumida).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {consumos.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Custo Total de Materiais:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    R$ {consumos.reduce((total, consumo) => {
                      const material = getMaterialById(consumo.material_id)
                      return total + (material ? material.valor_custo * consumo.quantidade_consumida : 0)
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer Fixo com Ações */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 space-y-2 shadow-lg">
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-bold text-lg active:bg-green-700 disabled:bg-gray-400"
            disabled={loading || consumos.length === 0}
          >
            {loading ? '⟳ Registrando...' : '✅ Concluir Agendamento'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold active:bg-gray-300"
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileConsumoMaterialModal
