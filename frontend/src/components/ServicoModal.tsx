import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Servico, ServicoCreate } from '../types'

interface ServicoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  servico?: Servico | null
}

const CORES_DISPONIVEIS = [
  { nome: 'Azul', valor: '#3788d8' },
  { nome: 'Verde', valor: '#22c55e' },
  { nome: 'Amarelo', valor: '#eab308' },
  { nome: 'Vermelho', valor: '#ef4444' },
  { nome: 'Roxo', valor: '#a855f7' },
  { nome: 'Rosa', valor: '#ec4899' },
  { nome: 'Laranja', valor: '#f97316' },
  { nome: 'Cinza', valor: '#6b7280' },
]

const ServicoModal: React.FC<ServicoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  servico
}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao_minutos: '60',
    categoria: '',
    cor: '#3788d8',
    requer_agendamento: true,
    estabelecimento_id: user.estabelecimento_id || 0
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (servico) {
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || '',
        preco: servico.preco.toString(),
        duracao_minutos: servico.duracao_minutos.toString(),
        categoria: servico.categoria || '',
        cor: servico.cor,
        requer_agendamento: servico.requer_agendamento,
        estabelecimento_id: servico.estabelecimento_id
      })
    } else {
      setFormData({
        nome: '',
        descricao: '',
        preco: '',
        duracao_minutos: '60',
        categoria: '',
        cor: '#3788d8',
        requer_agendamento: true,
        estabelecimento_id: user.estabelecimento_id || 0
      })
    }
    setError('')
  }, [servico, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!formData.preco || parseFloat(formData.preco) < 0) {
      setError('Preço deve ser um valor válido')
      return
    }

    if (!formData.duracao_minutos || parseInt(formData.duracao_minutos) < 15) {
      setError('Duração mínima é 15 minutos')
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        preco: parseFloat(formData.preco),
        duracao_minutos: parseInt(formData.duracao_minutos),
        categoria: formData.categoria || undefined,
        cor: formData.cor,
        requer_agendamento: formData.requer_agendamento,
        estabelecimento_id: formData.estabelecimento_id
      }
      await onSave(dataToSave)
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar serviço')
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
            {servico ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {/* Dados Básicos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do Serviço</h3>
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
                  placeholder="Ex: Corte de Cabelo, Alinhamento, Banho e Tosa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="input"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (minutos) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  step="15"
                  className="input"
                  value={formData.duracao_minutos}
                  onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                  placeholder="60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Cabelo, Barba, Estética"
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
                  placeholder="Descrição detalhada do serviço..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cor no Calendário
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor.valor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor: cor.valor })}
                      className={`w-full aspect-square rounded-lg border-2 transition-all ${
                        formData.cor === cor.valor
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requer_agendamento}
                    onChange={(e) => setFormData({ ...formData, requer_agendamento: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Requer agendamento
                  </span>
                </label>
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
              {loading ? 'Salvando...' : 'Salvar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServicoModal
