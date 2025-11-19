import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clientesApi } from '../services/api'
import { Cliente, ClienteCreate } from '../types'
import ClienteModal from '../components/ClienteModal'
import ClienteHistoricoModal from '../components/ClienteHistoricoModal'
import { formatCPF, formatTelefone } from '../utils/formatters'

const ClientesPage: React.FC = () => {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [filtros, setFiltros] = useState({
    nome: '',
    telefone: '',
    email: ''
  })

  // Estados dos modais
  const [clienteModalOpen, setClienteModalOpen] = useState(false)
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)

  const { data: clientes, isLoading, refetch } = useQuery({
    queryKey: ['clientes', filtros],
    queryFn: () => clientesApi.list(filtros)
  })

  const { data: clientesBusca, isLoading: loadingBusca } = useQuery({
    queryKey: ['clientes', 'busca', busca],
    queryFn: () => clientesApi.search(busca),
    enabled: busca.length >= 2
  })

  const handleNovoCliente = () => {
    setClienteSelecionado(null)
    setClienteModalOpen(true)
  }

  const handleEditarCliente = async (id: number) => {
    try {
      const cliente = await clientesApi.get(id)
      setClienteSelecionado(cliente)
      setClienteModalOpen(true)
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      alert('Erro ao carregar dados do cliente')
    }
  }

  const handleHistoricoCliente = async (id: number) => {
    try {
      const cliente = await clientesApi.get(id)
      setClienteSelecionado(cliente)
      setHistoricoModalOpen(true)
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      alert('Erro ao carregar dados do cliente')
    }
  }

  const handleAgendarServico = async (id: number) => {
    try {
      const cliente = await clientesApi.get(id)
      // Navega para a página de agendamentos com o cliente pré-selecionado
      navigate('/agendamentos', {
        state: {
          openModal: true,
          clienteId: cliente.id
        }
      })
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      alert('Erro ao carregar dados do cliente')
    }
  }

  const handleSalvarCliente = async (data: ClienteCreate) => {
    try {
      if (clienteSelecionado) {
        await clientesApi.update(clienteSelecionado.id, data)
      } else {
        await clientesApi.create(data)
      }
      refetch()
      setClienteModalOpen(false)
      setClienteSelecionado(null)
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={handleNovoCliente} className="btn-primary px-4 py-2">
          Novo Cliente
        </button>
      </div>

      {/* Busca rápida */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Busca Rápida</h3>
        <div className="flex gap-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Buscar por nome, telefone ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button
            onClick={() => setBusca('')}
            className="btn-secondary px-4 py-2"
          >
            Limpar
          </button>
        </div>

        {/* Resultados da busca */}
        {busca.length >= 2 && (
          <div className="mt-4">
            {loadingBusca ? (
              <p className="text-gray-500">Buscando...</p>
            ) : clientesBusca?.clientes?.length === 0 ? (
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Resultados da busca ({clientesBusca?.clientes?.length}):
                </p>
                {clientesBusca?.clientes?.map((cliente: any) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{cliente.nome}</p>
                        {cliente.pontos > 0 && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                            ⭐ {cliente.pontos} pts
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatTelefone(cliente.telefone)} • {cliente.email || 'Sem email'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAgendarServico(cliente.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded"
                      >
                        Agendar
                      </button>
                      <button
                        onClick={() => handleEditarCliente(cliente.id)}
                        className="btn-primary px-2 py-1 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleHistoricoCliente(cliente.id)}
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        Histórico
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              className="input"
              placeholder="Nome do cliente"
              value={filtros.nome}
              onChange={(e) => setFiltros({ ...filtros, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone
            </label>
            <input
              type="text"
              className="input"
              placeholder="Telefone"
              value={filtros.telefone}
              onChange={(e) => setFiltros({ ...filtros, telefone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input"
              placeholder="Email"
              value={filtros.email}
              onChange={(e) => setFiltros({ ...filtros, email: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">
            Lista de Clientes
            {clientes && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({clientes.total} total)
              </span>
            )}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6">
              <p className="text-gray-500">Carregando clientes...</p>
            </div>
          ) : clientes?.clientes?.length === 0 ? (
            <div className="p-6">
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes?.clientes?.map((cliente: any) => (
                  <tr key={cliente.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {cliente.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {cliente.id}
                          {cliente.cpf && ` • CPF: ${formatCPF(cliente.cpf)}`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTelefone(cliente.telefone)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cliente.email || 'Sem email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-yellow-700">
                        ⭐ {cliente.pontos || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleAgendarServico(cliente.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs rounded"
                      >
                        Agendar
                      </button>
                      <button
                        onClick={() => handleEditarCliente(cliente.id)}
                        className="btn-primary px-2 py-1 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleHistoricoCliente(cliente.id)}
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        Histórico
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modais */}
      <ClienteModal
        isOpen={clienteModalOpen}
        onClose={() => {
          setClienteModalOpen(false)
          setClienteSelecionado(null)
        }}
        onSave={handleSalvarCliente}
        cliente={clienteSelecionado}
      />

      {clienteSelecionado && (
        <ClienteHistoricoModal
          isOpen={historicoModalOpen}
          onClose={() => {
            setHistoricoModalOpen(false)
            setClienteSelecionado(null)
          }}
          cliente={clienteSelecionado}
        />
      )}
    </div>
  )
}

export default ClientesPage