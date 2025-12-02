import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Material } from '../types'

interface MaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  material?: Material | null
}

const UNIDADES_MEDIDA = [
  { value: 'ML', label: 'Mililitros (ml)' },
  { value: 'UNIDADE', label: 'Unidade' },
  { value: 'GRAMA', label: 'Gramas (g)' },
  { value: 'CM', label: 'Centímetros (cm)' },
]

const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  material
}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor_custo: '',
    unidade_medida: 'UNIDADE' as 'ML' | 'UNIDADE' | 'GRAMA' | 'CM',
    quantidade_estoque: '',
    quantidade_minima: '',
    marca: '',
    fornecedor: '',
    estabelecimento_id: user.estabelecimento_id || 0
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (material) {
      setFormData({
        nome: material.nome,
        descricao: material.descricao || '',
        valor_custo: material.valor_custo.toString(),
        unidade_medida: material.unidade_medida,
        quantidade_estoque: material.quantidade_estoque.toString(),
        quantidade_minima: material.quantidade_minima?.toString() || '',
        marca: material.marca || '',
        fornecedor: material.fornecedor || '',
        estabelecimento_id: material.estabelecimento_id
      })
    } else {
      setFormData({
        nome: '',
        descricao: '',
        valor_custo: '',
        unidade_medida: 'UNIDADE',
        quantidade_estoque: '',
        quantidade_minima: '',
        marca: '',
        fornecedor: '',
        estabelecimento_id: user.estabelecimento_id || 0
      })
    }
    setError('')
  }, [material, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!formData.valor_custo || parseFloat(formData.valor_custo) <= 0) {
      setError('Valor de custo deve ser maior que zero')
      return
    }

    if (!formData.quantidade_estoque || parseFloat(formData.quantidade_estoque) < 0) {
      setError('Quantidade em estoque deve ser um valor válido')
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        valor_custo: parseFloat(formData.valor_custo),
        unidade_medida: formData.unidade_medida,
        quantidade_estoque: parseFloat(formData.quantidade_estoque),
        quantidade_minima: formData.quantidade_minima ? parseFloat(formData.quantidade_minima) : undefined,
        marca: formData.marca || undefined,
        fornecedor: formData.fornecedor || undefined,
        estabelecimento_id: formData.estabelecimento_id
      }
      await onSave(dataToSave)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar material')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {material ? 'Editar Material' : 'Novo Material'}
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

          {/* Dados Básicos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do Material</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Shampoo Profissional, Óleo de Motor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor de Custo (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  className="input"
                  value={formData.valor_custo}
                  onChange={(e) => setFormData({ ...formData, valor_custo: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade de Medida <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="input"
                  value={formData.unidade_medida}
                  onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value as any })}
                >
                  {UNIDADES_MEDIDA.map((unidade) => (
                    <option key={unidade.value} value={unidade.value}>
                      {unidade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade em Estoque <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.quantidade_estoque}
                  onChange={(e) => setFormData({ ...formData, quantidade_estoque: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade Mínima (Alerta)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.quantidade_minima}
                  onChange={(e) => setFormData({ ...formData, quantidade_minima: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.marca}
                  onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                  placeholder="Ex: Loreal, Mobil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                  placeholder="Ex: Distribuidora ABC"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do material..."
                />
              </div>
            </div>
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
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MaterialModal
