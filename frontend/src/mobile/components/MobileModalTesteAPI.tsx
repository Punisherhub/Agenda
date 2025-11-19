import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { servicosApi, clientesApi } from '../../services/api'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const MobileModalTesteAPI: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])
  }

  // Query de serviços
  const { data: servicosData, error: servicosError, isLoading: isLoadingServicos } = useQuery({
    queryKey: ['servicos-teste'],
    queryFn: async () => {
      addLog('🔄 Iniciando busca de serviços...')
      try {
        const result = await servicosApi.list()
        addLog(`✅ Serviços carregados: ${result?.servicos?.length || 0} itens`)
        return result
      } catch (error) {
        addLog(`❌ Erro ao buscar serviços: ${error}`)
        throw error
      }
    },
    enabled: isOpen,
    retry: false
  })

  // Query de clientes
  const { data: clientesData, error: clientesError, isLoading: isLoadingClientes } = useQuery({
    queryKey: ['clientes-teste'],
    queryFn: async () => {
      addLog('🔄 Iniciando busca de clientes...')
      try {
        const result = await clientesApi.list({ limit: 100 })
        addLog(`✅ Clientes carregados: ${result?.clientes?.length || 0} itens`)
        return result
      } catch (error) {
        addLog(`❌ Erro ao buscar clientes: ${error}`)
        throw error
      }
    },
    enabled: isOpen,
    retry: false
  })

  useEffect(() => {
    if (isOpen) {
      setLogs([])
      addLog('🚀 Modal aberto - iniciando testes...')
    }
  }, [isOpen])

  if (!isOpen) return null

  const servicos = servicosData?.servicos || []
  const clientes = clientesData?.clientes || []

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">🧪 Teste de APIs</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-purple-700 rounded-full text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Serviços */}
          <div className={`p-4 rounded-lg border-2 ${
            isLoadingServicos ? 'bg-yellow-50 border-yellow-500' :
            servicosError ? 'bg-red-50 border-red-500' :
            'bg-green-50 border-green-500'
          }`}>
            <div className="text-center">
              <div className="text-3xl mb-2">
                {isLoadingServicos ? '⏳' : servicosError ? '❌' : '✅'}
              </div>
              <div className="font-bold text-sm">Serviços</div>
              <div className="text-xs mt-1">
                {isLoadingServicos ? 'Carregando...' :
                 servicosError ? 'Erro!' :
                 `${servicos.length} itens`}
              </div>
            </div>
          </div>

          {/* Clientes */}
          <div className={`p-4 rounded-lg border-2 ${
            isLoadingClientes ? 'bg-yellow-50 border-yellow-500' :
            clientesError ? 'bg-red-50 border-red-500' :
            'bg-green-50 border-green-500'
          }`}>
            <div className="text-center">
              <div className="text-3xl mb-2">
                {isLoadingClientes ? '⏳' : clientesError ? '❌' : '✅'}
              </div>
              <div className="font-bold text-sm">Clientes</div>
              <div className="text-xs mt-1">
                {isLoadingClientes ? 'Carregando...' :
                 clientesError ? 'Erro!' :
                 `${clientes.length} itens`}
              </div>
            </div>
          </div>
        </div>

        {/* Erros Detalhados */}
        {servicosError && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2">❌ Erro em Serviços:</h3>
            <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
              {servicosError instanceof Error ? servicosError.message : String(servicosError)}
            </pre>
          </div>
        )}

        {clientesError && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2">❌ Erro em Clientes:</h3>
            <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto">
              {clientesError instanceof Error ? clientesError.message : String(clientesError)}
            </pre>
          </div>
        )}

        {/* Preview de Dados */}
        {!isLoadingServicos && !servicosError && servicos.length > 0 && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">✅ Primeiros Serviços:</h3>
            <div className="space-y-1 text-xs">
              {servicos.slice(0, 3).map((s: any) => (
                <div key={s.id} className="bg-white p-2 rounded">
                  {s.nome} - R$ {Number(s.preco || 0).toFixed(2)}
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoadingClientes && !clientesError && clientes.length > 0 && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">✅ Primeiros Clientes:</h3>
            <div className="space-y-1 text-xs">
              {clientes.slice(0, 3).map((c: any) => (
                <div key={c.id} className="bg-white p-2 rounded">
                  {c.nome}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log de Eventos */}
        <details className="bg-gray-100 rounded-lg p-3">
          <summary className="cursor-pointer font-semibold text-sm">📋 Log de Eventos ({logs.length})</summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={idx} className="text-xs text-gray-700 font-mono bg-white p-2 rounded">
                {log}
              </div>
            ))}
          </div>
        </details>

        {/* Botão de Ação */}
        <button
          onClick={onClose}
          className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold text-lg"
        >
          Fechar Teste
        </button>
      </div>
    </div>
  )
}

export default MobileModalTesteAPI
