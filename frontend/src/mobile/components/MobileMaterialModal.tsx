import React, { useState, useEffect } from 'react'
import MobileModal from './MobileModal'
import { Material } from '../../types'
import { authApi } from '../../services/api'

interface MobileMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  material?: Material | null
  loading?: boolean
}

const MobileMaterialModal: React.FC<MobileMaterialModalProps> = ({
  isOpen,
  onClose,
  onSave,
  material,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valor_custo: '',
    unidade_medida: 'UNIDADE' as 'ML' | 'UNIDADE' | 'GRAMA' | 'CM',
    quantidade_estoque: '',
    quantidade_minima: '',
    marca: '',
    fornecedor: ''
  })

  useEffect(() => {
    if (material) {
      setFormData({
        nome: material.nome || '',
        descricao: material.descricao || '',
        valor_custo: String(material.valor_custo || ''),
        unidade_medida: material.unidade_medida || 'UNIDADE',
        quantidade_estoque: String(material.quantidade_estoque || ''),
        quantidade_minima: String(material.quantidade_minima || ''),
        marca: material.marca || '',
        fornecedor: material.fornecedor || ''
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
        fornecedor: ''
      })
    }
  }, [material, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!formData.nome.trim()) {
      alert('⚠️ Nome é obrigatório')
      return
    }

    if (!formData.valor_custo || Number(formData.valor_custo) < 0) {
      alert('⚠️ Valor custo deve ser maior ou igual a zero')
      return
    }

    if (!formData.quantidade_estoque || Number(formData.quantidade_estoque) < 0) {
      alert('⚠️ Quantidade em estoque deve ser maior ou igual a zero')
      return
    }

    // Obter estabelecimento_id do usuário via API
    let estabelecimento_id
    try {
      const currentUser = await authApi.me()
      estabelecimento_id = currentUser.estabelecimento_id

      if (!estabelecimento_id) {
        alert('⚠️ Erro: Usuário não possui estabelecimento vinculado')
        return
      }
    } catch (error) {
      alert('⚠️ Erro: Não foi possível obter dados do usuário. Faça login novamente.')
      return
    }

    // Preparar dados para enviar
    const dataToSend: any = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim() || undefined,
      valor_custo: Number(formData.valor_custo),
      unidade_medida: formData.unidade_medida,
      quantidade_estoque: Number(formData.quantidade_estoque),
      quantidade_minima: formData.quantidade_minima ? Number(formData.quantidade_minima) : undefined,
      marca: formData.marca.trim() || undefined,
      fornecedor: formData.fornecedor.trim() || undefined,
      estabelecimento_id: estabelecimento_id
    }

    onSave(dataToSend)
  }

  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={material ? 'Editar Material' : 'Novo Material'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            placeholder="Ex: Shampoo, Tesoura, etc"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            rows={2}
            placeholder="Opcional"
          />
        </div>

        {/* Unidade de Medida */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unidade de Medida *
          </label>
          <select
            value={formData.unidade_medida}
            onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            required
          >
            <option value="UNIDADE">Unidade</option>
            <option value="ML">Mililitro (ml)</option>
            <option value="GRAMA">Grama (g)</option>
            <option value="CM">Centímetro (cm)</option>
          </select>
        </div>

        {/* Grid: Valor e Quantidade */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor Custo *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.valor_custo}
              onChange={(e) => setFormData({ ...formData, valor_custo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estoque *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quantidade_estoque}
              onChange={(e) => setFormData({ ...formData, quantidade_estoque: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              placeholder="0"
              required
            />
          </div>
        </div>

        {/* Estoque Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estoque Mínimo
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.quantidade_minima}
            onChange={(e) => setFormData({ ...formData, quantidade_minima: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            placeholder="Opcional"
          />
          <p className="text-xs text-gray-500 mt-1">
            Alerta quando estoque ficar abaixo deste valor
          </p>
        </div>

        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marca
          </label>
          <input
            type="text"
            value={formData.marca}
            onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            placeholder="Opcional"
          />
        </div>

        {/* Fornecedor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fornecedor
          </label>
          <input
            type="text"
            value={formData.fornecedor}
            onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
            placeholder="Opcional"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium active:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </MobileModal>
  )
}

export default MobileMaterialModal
