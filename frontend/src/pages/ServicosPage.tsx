import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { servicosApi } from '../services/api'
import { Servico } from '../types'
import ServicoModal from '../components/ServicoModal'
import { Trash2, Edit, Plus } from 'lucide-react'

const ServicosPage: React.FC = () => {
  const [filtros, setFiltros] = useState({
    categoria: '',
    ativo: true
  })

  // Estados dos modais
  const [servicoModalOpen, setServicoModalOpen] = useState(false)
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null)

  const queryClient = useQueryClient()

  const { data: servicos, isLoading } = useQuery({
    queryKey: ['servicos', filtros],
    queryFn: () => servicosApi.list(filtros)
  })

  const createMutation = useMutation({
    mutationFn: servicosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
      setServicoModalOpen(false)
      setServicoSelecionado(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => servicosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
      setServicoModalOpen(false)
      setServicoSelecionado(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: servicosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    }
  })

  const handleNovoServico = () => {
    setServicoSelecionado(null)
    setServicoModalOpen(true)
  }

  const handleEditarServico = async (servico: Servico) => {
    setServicoSelecionado(servico)
    setServicoModalOpen(true)
  }

  const handleExcluirServico = async (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja desativar o serviço "${nome}"?`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Erro ao excluir serviço:', error)
        alert('Erro ao excluir serviço. Verifique se não existem agendamentos vinculados.')
      }
    }
  }

  const handleSalvarServico = async (data: any) => {
    try {
      if (servicoSelecionado) {
        await updateMutation.mutateAsync({ id: servicoSelecionado.id, data })
      } else {
        await createMutation.mutateAsync(data)
      }
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <button onClick={handleNovoServico} className="btn-primary px-4 py-2 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Novo Serviço
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <input
              type="text"
              className="input"
              placeholder="Filtrar por categoria"
              value={filtros.categoria}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
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

      {/* Lista de serviços */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Lista de Serviços
            {servicos && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({servicos.total} total)
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <p className="text-gray-500">Carregando serviços...</p>
            </div>
          ) : servicos?.servicos?.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-500">Nenhum serviço encontrado</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duração
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
                {servicos?.servicos?.map((servico: Servico) => (
                  <tr key={servico.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: servico.cor }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {servico.nome}
                          </div>
                          {servico.descricao && (
                            <div className="text-sm text-gray-500">
                              {servico.descricao}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {servico.categoria || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {Number(servico.preco).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {servico.duracao_minutos} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          servico.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {servico.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleEditarServico(servico)}
                        className="btn-primary px-3 py-1 text-xs inline-flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      {servico.is_active && (
                        <button
                          onClick={() => handleExcluirServico(servico.id, servico.nome)}
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
      <ServicoModal
        isOpen={servicoModalOpen}
        onClose={() => {
          setServicoModalOpen(false)
          setServicoSelecionado(null)
        }}
        onSave={handleSalvarServico}
        servico={servicoSelecionado}
      />
    </div>
  )
}

export default ServicosPage
