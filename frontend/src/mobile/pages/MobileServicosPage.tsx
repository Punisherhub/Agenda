import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicosApi } from '../../services/api'
import MobileLayout from '../layouts/MobileLayout'
import MobileFAB from '../components/MobileFAB'
import MobileModal from '../components/MobileModal'

const MobileServicosPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [showFilters, setShowFilters] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingServico, setEditingServico] = useState<any>(null)

  // Filtros
  const [filtros, setFiltros] = useState({
    categoria: '',
    ativo: true
  })

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    preco: '',
    duracao_minutos: '',
    cor: '#3B82F6'
  })

  // Buscar serviços
  const { data: servicosData, isLoading } = useQuery({
    queryKey: ['servicos', filtros],
    queryFn: () => servicosApi.list(filtros)
  })

  // Mutation criar
  const createMutation = useMutation({
    mutationFn: (data: any) => servicosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
      handleCloseModal()
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.detail
        ? JSON.stringify(error.response.data.detail)
        : error.message || 'Erro desconhecido'
      alert('Erro ao criar serviço: ' + errorMsg)
    }
  })

  // Mutation atualizar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      servicosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
      handleCloseModal()
    }
  })

  // Mutation deletar
  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    }
  })

  const servicos = servicosData?.servicos || []

  const handleOpenModal = (servico?: any) => {
    if (servico) {
      setEditingServico(servico)
      setFormData({
        nome: servico.nome,
        descricao: servico.descricao || '',
        categoria: servico.categoria || '',
        preco: servico.preco.toString(),
        duracao_minutos: servico.duracao_minutos.toString(),
        cor: servico.cor || '#3B82F6'
      })
    } else {
      setEditingServico(null)
      setFormData({
        nome: '',
        descricao: '',
        categoria: '',
        preco: '',
        duracao_minutos: '',
        cor: '#3B82F6'
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingServico(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Pegar estabelecimento_id do usuário logado
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const servicoData = {
      nome: formData.nome,
      descricao: formData.descricao || null,
      categoria: formData.categoria || null,
      preco: parseFloat(formData.preco),
      duracao_minutos: parseInt(formData.duracao_minutos),
      cor: formData.cor,
      estabelecimento_id: user.estabelecimento_id
    }

    if (editingServico) {
      updateMutation.mutate({ id: editingServico.id, data: servicoData })
    } else {
      createMutation.mutate(servicoData)
    }
  }

  const handleDelete = (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja desativar o serviço "${nome}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      categoria: '',
      ativo: true
    })
  }

  const hasActiveFilters = filtros.categoria

  return (
    <MobileLayout>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium active:bg-gray-200"
          >
            {showFilters ? '🔼 Filtros' : '🔽 Filtros'}
          </button>
        </div>

        {/* Filtros Colapsáveis */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtros</h3>
              {hasActiveFilters && (
                <button
                  onClick={limparFiltros}
                  className="text-sm text-blue-600 active:text-blue-800"
                >
                  Limpar
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                placeholder="Filtrar por categoria"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filtros.ativo.toString()}
                onChange={(e) => setFiltros({ ...filtros, ativo: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
        )}

        {/* Lista de Serviços */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? 'Carregando...' : `${servicos.length} serviço${servicos.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Carregando...
            </div>
          ) : servicos.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
              Nenhum serviço encontrado
            </div>
          ) : (
            servicos.map((servico: any) => (
              <div
                key={servico.id}
                className="bg-white rounded-lg shadow-sm p-4 space-y-3"
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Bolinha colorida */}
                    <div
                      className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: servico.cor || '#3B82F6' }}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{servico.nome}</h3>
                      {servico.descricao && (
                        <p className="text-sm text-gray-600 mt-1">{servico.descricao}</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      servico.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {servico.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Detalhes */}
                <div className="border-t pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Categoria</p>
                    <p className="text-sm font-medium text-gray-900">
                      {servico.categoria || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duração</p>
                    <p className="text-sm font-medium text-gray-900">
                      {servico.duracao_minutos} min
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Preço</p>
                    <p className="text-lg font-bold text-green-600">
                      R$ {Number(servico.preco).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(servico)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium active:bg-blue-700"
                  >
                    Editar
                  </button>
                  {servico.is_active && (
                    <button
                      onClick={() => handleDelete(servico.id, servico.nome)}
                      disabled={deleteMutation.isPending}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium active:bg-red-700 disabled:bg-gray-400"
                    >
                      Desativar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <MobileFAB onClick={() => handleOpenModal()} />

      {/* Modal Criar/Editar */}
      <MobileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingServico ? 'Editar Serviço' : 'Novo Serviço'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Serviço *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="Ex: Corte de Cabelo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="Descrição opcional do serviço"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
              placeholder="Ex: Cabelo, Barba, etc"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (min) *
              </label>
              <input
                type="number"
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                placeholder="60"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 active:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium active:bg-blue-700 disabled:bg-gray-400"
            >
              {(createMutation.isPending || updateMutation.isPending)
                ? 'Salvando...'
                : editingServico ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </MobileModal>
    </MobileLayout>
  )
}

export default MobileServicosPage
