import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Settings, FileText, Users, Send, TestTube, CheckCircle, AlertCircle, ExternalLink, RefreshCw, QrCode, Smartphone, RotateCw } from 'lucide-react'
import { whatsappApi } from '../services/api'
import type { WhatsAppConfigCreate, WhatsAppConfigUpdate } from '../types'

type ActiveTab = 'config' | 'templates' | 'inativos'

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('config')
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste via Evolution API.')
  const queryClient = useQueryClient()

  // States para formulário
  const [formData, setFormData] = useState({
    evolution_api_url: '',
    evolution_api_key: '',
    evolution_instance_name: '',
    template_agendamento: '',
    template_lembrete: '',
    template_conclusao: '',
    template_cancelamento: '',
    template_reciclagem: '',
    template_aniversario: '',
    ativado: false,
    enviar_agendamento: true,
    enviar_lembrete: true,
    enviar_conclusao: true,
    enviar_cancelamento: true,
    enviar_reciclagem: false,
    enviar_aniversario: true,
    meses_inatividade: 3,
    link_agendamento: '',
  })

  // Query configuração
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      try {
        const configData = await whatsappApi.getConfig()
        if (configData) {
          setFormData({
            evolution_api_url: configData.evolution_api_url || '',
            evolution_api_key: configData.evolution_api_key || '',
            evolution_instance_name: configData.evolution_instance_name || '',
            template_agendamento: configData.template_agendamento || '',
            template_lembrete: configData.template_lembrete || '',
            template_conclusao: configData.template_conclusao || '',
            template_cancelamento: configData.template_cancelamento || '',
            template_reciclagem: configData.template_reciclagem || '',
            template_aniversario: configData.template_aniversario || '',
            ativado: configData.ativado,
            enviar_agendamento: configData.enviar_agendamento,
            enviar_lembrete: configData.enviar_lembrete,
            enviar_conclusao: configData.enviar_conclusao,
            enviar_cancelamento: configData.enviar_cancelamento,
            enviar_reciclagem: configData.enviar_reciclagem,
            enviar_aniversario: configData.enviar_aniversario,
            meses_inatividade: configData.meses_inatividade,
            link_agendamento: configData.link_agendamento || '',
          })
        }
        return configData
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
    retry: false,
  })

  // Query clientes inativos
  const { data: clientesInativos = [], isLoading: loadingInativos } = useQuery({
    queryKey: ['clientes-inativos'],
    queryFn: whatsappApi.getClientesInativos,
    enabled: activeTab === 'inativos',
  })

  // Query status de conexão WhatsApp
  const { data: connectionStatus, isLoading: loadingConnection, refetch: refetchConnection } = useQuery({
    queryKey: ['whatsapp-connection-status'],
    queryFn: whatsappApi.getConnectionStatus,
    enabled: !!config && activeTab === 'config',
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    retry: false,
  })

  // Mutation configuração
  const configMutation = useMutation({
    mutationFn: (data: WhatsAppConfigCreate | WhatsAppConfigUpdate) =>
      config
        ? whatsappApi.updateConfig(data)
        : whatsappApi.createConfig(data as WhatsAppConfigCreate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] })
      alert('Configuração salva com sucesso!')
    },
    onError: (error: any) => {
      console.error('Erro ao salvar configuração:', error)
      alert(`Erro ao salvar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  // Mutation teste
  const testMutation = useMutation({
    mutationFn: whatsappApi.sendTest,
    onSuccess: (response) => {
      if (response.sucesso) {
        alert(`Mensagem de teste enviada com sucesso para ${response.telefone_destino}!`)
      } else {
        alert(`Erro ao enviar mensagem: ${response.erro}`)
      }
    },
    onError: (error: any) => {
      console.error('Erro ao enviar teste:', error)
      alert(`Erro ao enviar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  // Mutation enviar reciclagem
  const reciclagemMutation = useMutation({
    mutationFn: whatsappApi.sendReciclagem,
    onSuccess: (response) => {
      if (response.sucesso) {
        alert('Mensagem de reciclagem enviada com sucesso!')
        queryClient.invalidateQueries({ queryKey: ['clientes-inativos'] })
      } else {
        alert(`Erro: ${response.erro}`)
      }
    },
    onError: (error: any) => {
      alert(`Erro ao enviar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  // Mutation resetar instância WhatsApp
  const resetInstanceMutation = useMutation({
    mutationFn: whatsappApi.logoutWahaSession,
    onSuccess: () => {
      alert('Instância WhatsApp resetada com sucesso! Escaneie o novo QR Code.')
      queryClient.invalidateQueries({ queryKey: ['whatsapp-connection-status'] })
      refetchConnection()
    },
    onError: (error: any) => {
      console.error('Erro ao resetar instância:', error)
      alert(`Erro ao resetar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    configMutation.mutate(formData)
  }

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone || !testMessage) {
      alert('Preencha o telefone e a mensagem de teste')
      return
    }
    testMutation.mutate({ telefone: testPhone, mensagem: testMessage })
  }

  const handleSendReciclagem = (clienteId: number) => {
    if (confirm('Enviar mensagem de reciclagem para este cliente?')) {
      reciclagemMutation.mutate(clienteId)
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-green-600" />
            WhatsApp via Evolution API
          </h1>
          <p className="text-gray-600 mt-1">
            Configure e gerencie notificações WhatsApp usando Evolution API
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-2">
            {config.ativado ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Ativo
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Inativo
              </span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <FileText className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('inativos')}
            className={`${
              activeTab === 'inativos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Users className="w-4 h-4" />
            Clientes Inativos
            {clientesInativos.length > 0 && (
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {clientesInativos.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Tab 1: Configurações */}
        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Credenciais Evolution API</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Importante:</strong> Você precisa hospedar o Evolution API separadamente.
                  Consulte a pasta <code className="bg-blue-100 px-1 rounded">evolution-api/</code> do projeto
                  para instruções de deploy no Render.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Evolution API <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.evolution_api_url}
                    onChange={(e) => setFormData({ ...formData, evolution_api_url: e.target.value })}
                    placeholder="https://evolution.onrender.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL do seu serviço Evolution API (ex: https://seu-servico.onrender.com)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.evolution_api_key}
                    onChange={(e) => setFormData({ ...formData, evolution_api_key: e.target.value })}
                    placeholder="Sua API Key da Evolution API"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Chave de autenticação configurada no Evolution API
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Instância <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.evolution_instance_name}
                    onChange={(e) => setFormData({ ...formData, evolution_instance_name: e.target.value })}
                    placeholder="agenda_onsell"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nome da instância WhatsApp criada no Evolution API
                  </p>
                </div>
              </div>
            </div>

            {/* Status de Conexão & QR Code */}
            {config && (
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Status de Conexão WhatsApp
                </h2>

                {loadingConnection ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : connectionStatus ? (
                  <div className="space-y-4">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {connectionStatus.connected ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                              <p className="font-medium text-gray-900">WhatsApp Conectado</p>
                              <p className="text-sm text-gray-600">Instância: {connectionStatus.instance}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-900">WhatsApp Desconectado</p>
                              <p className="text-sm text-gray-600">Escaneie o QR Code para conectar</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => refetchConnection()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Atualizar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Isso vai resetar a conexão WhatsApp. Deseja continuar?')) {
                              resetInstanceMutation.mutate()
                            }
                          }}
                          disabled={resetInstanceMutation.isPending}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <RotateCw className="w-4 h-4" />
                          {resetInstanceMutation.isPending ? 'Resetando...' : 'Reconectar'}
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    {!connectionStatus.connected && connectionStatus.qrcode && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex items-center gap-2 text-blue-900">
                            <QrCode className="w-5 h-5" />
                            <h3 className="font-semibold">Conectar WhatsApp</h3>
                          </div>

                          <div className="bg-white p-4 rounded-lg shadow-md">
                            <img
                              src={connectionStatus.qrcode.base64}
                              alt="QR Code WhatsApp"
                              className="w-64 h-64"
                            />
                          </div>

                          <div className="text-sm text-blue-800 text-center max-w-md">
                            <p className="font-medium mb-2">Como conectar:</p>
                            <ol className="text-left space-y-1">
                              <li>1. Abra o WhatsApp no seu celular</li>
                              <li>2. Toque em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                              <li>3. Toque em <strong>Conectar um aparelho</strong></li>
                              <li>4. Escaneie este QR Code</li>
                            </ol>
                          </div>

                          <p className="text-xs text-blue-600">
                            O QR Code expira após alguns minutos. Clique em "Atualizar" se necessário.
                          </p>
                        </div>
                      </div>
                    )}

                    {connectionStatus.connected && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-900 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          WhatsApp conectado e pronto para enviar mensagens!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-900">
                      Salve a configuração da Evolution API primeiro para verificar o status de conexão.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações Gerais</h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativado"
                    checked={formData.ativado}
                    onChange={(e) => setFormData({ ...formData, ativado: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="ativado" className="ml-2 text-sm font-medium text-gray-700">
                    Ativar WhatsApp (liga/desliga todas as notificações)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enviar_agendamento"
                      checked={formData.enviar_agendamento}
                      onChange={(e) => setFormData({ ...formData, enviar_agendamento: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enviar_agendamento" className="ml-2 text-sm text-gray-700">
                      Novo Agendamento
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enviar_conclusao"
                      checked={formData.enviar_conclusao}
                      onChange={(e) => setFormData({ ...formData, enviar_conclusao: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enviar_conclusao" className="ml-2 text-sm text-gray-700">
                      Conclusão
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enviar_lembrete"
                      checked={formData.enviar_lembrete}
                      onChange={(e) => setFormData({ ...formData, enviar_lembrete: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enviar_lembrete" className="ml-2 text-sm text-gray-700">
                      Lembrete 24h
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enviar_cancelamento"
                      checked={formData.enviar_cancelamento}
                      onChange={(e) => setFormData({ ...formData, enviar_cancelamento: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enviar_cancelamento" className="ml-2 text-sm text-gray-700">
                      Cancelamento
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enviar_reciclagem"
                      checked={formData.enviar_reciclagem}
                      onChange={(e) => setFormData({ ...formData, enviar_reciclagem: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enviar_reciclagem" className="ml-2 text-sm text-gray-700">
                      Reciclagem de Inativos
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enviar_aniversario"
                      checked={formData.enviar_aniversario}
                      onChange={(e) => setFormData({ ...formData, enviar_aniversario: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enviar_aniversario" className="ml-2 text-sm text-gray-700">
                      Aniversário
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meses para considerar cliente inativo
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.meses_inatividade}
                    onChange={(e) => setFormData({ ...formData, meses_inatividade: parseInt(e.target.value) })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Cliente sem agendamento há X meses será considerado inativo
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link de Agendamento (opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.link_agendamento}
                    onChange={(e) => setFormData({ ...formData, link_agendamento: e.target.value })}
                    placeholder="https://seusite.com/agendar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link incluído nas mensagens de reciclagem
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Teste de Envio
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-900">
                  Envie uma mensagem de teste para validar sua configuração antes de salvar.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone de Teste
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="11999999999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem
                  </label>
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendTest}
                disabled={testMutation.isPending || !testPhone || !testMessage}
                className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {testMutation.isPending ? 'Enviando...' : 'Enviar Teste'}
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <button
                type="submit"
                disabled={configMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {configMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Templates */}
        {activeTab === 'templates' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Placeholders Disponíveis (podem ser usados em qualquer template):</h3>
              <div className="grid grid-cols-3 gap-2 text-sm text-blue-800">
                <div><code className="bg-blue-100 px-1 rounded">{'{nome_cliente}'}</code> - Nome do cliente</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{data}'}</code> - Data (dd/mm/yyyy)</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{hora}'}</code> - Horário (HH:MM)</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{servico}'}</code> - Nome do serviço</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{vendedor}'}</code> - Nome do vendedor</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{valor}'}</code> - Valor (R$ XX,XX)</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{veiculo}'}</code> - Modelo e placa</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{nome_empresa}'}</code> - Nome da empresa</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{endereco}'}</code> - Endereço do estabelecimento</div>
                <div><code className="bg-blue-100 px-1 rounded">{'{link_agendamento}'}</code> - Link agendamento</div>
              </div>
              <div className="mt-3 pt-3 border-t border-blue-300">
                <p className="text-sm font-medium text-blue-900 mb-2">Extras (apenas reciclagem):</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
                  <div><code className="bg-purple-100 px-1 rounded">{'{meses_inativo}'}</code> - Meses sem visita</div>
                  <div><code className="bg-purple-100 px-1 rounded">{'{data_ultimo_servico}'}</code> - Data último serviço</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template: Novo Agendamento
                </label>
                <textarea
                  rows={4}
                  value={formData.template_agendamento}
                  onChange={(e) => setFormData({ ...formData, template_agendamento: e.target.value })}
                  placeholder="Olá {nome_cliente}! Seu agendamento foi confirmado para {data} às {hora}. Serviço: {servico}. Valor: {valor}."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template: Conclusão
                </label>
                <textarea
                  rows={4}
                  value={formData.template_conclusao}
                  onChange={(e) => setFormData({ ...formData, template_conclusao: e.target.value })}
                  placeholder="Olá {nome_cliente}! Seu serviço foi concluído com sucesso! Obrigado por sua preferência."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template: Lembrete 24h
                </label>
                <textarea
                  rows={4}
                  value={formData.template_lembrete}
                  onChange={(e) => setFormData({ ...formData, template_lembrete: e.target.value })}
                  placeholder="Olá {nome_cliente}! Lembrando: você tem um agendamento amanhã às {hora}. Serviço: {servico}. Te esperamos!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template: Cancelamento
                </label>
                <textarea
                  rows={4}
                  value={formData.template_cancelamento}
                  onChange={(e) => setFormData({ ...formData, template_cancelamento: e.target.value })}
                  placeholder="Olá {nome_cliente}! Seu agendamento de {data} às {hora} foi cancelado. Entre em contato para reagendar!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template: Reciclagem de Clientes Inativos
                </label>
                <textarea
                  rows={5}
                  value={formData.template_reciclagem}
                  onChange={(e) => setFormData({ ...formData, template_reciclagem: e.target.value })}
                  placeholder="Olá {nome_cliente}! Sentimos sua falta no {nome_empresa}. Já faz {meses_inativo} meses desde sua última visita. Agende agora: {link_agendamento}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template: Aniversário
                </label>
                <textarea
                  rows={5}
                  value={formData.template_aniversario}
                  onChange={(e) => setFormData({ ...formData, template_aniversario: e.target.value })}
                  placeholder="Parabéns, {nome_cliente}! Hoje é um dia especial! Nós da {nome_empresa} desejamos feliz aniversário! Venha nos visitar em {endereco}!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <button
                type="submit"
                disabled={configMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {configMutation.isPending ? 'Salvando...' : 'Salvar Templates'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Clientes Inativos */}
        {activeTab === 'inativos' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                Clientes que não agendaram serviços há <strong>{config?.meses_inatividade || 3} meses</strong> ou mais.
                Configure o período em "Configurações".
              </p>
            </div>

            {loadingInativos ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : clientesInativos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cliente inativo encontrado!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientesInativos.map((cliente: any) => (
                  <div key={cliente.cliente_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{cliente.nome}</h3>
                        <p className="text-sm text-gray-600">
                          Telefone: {cliente.telefone} • Inativo há {cliente.meses_inativo} meses
                        </p>
                        {cliente.ultimo_agendamento && (
                          <p className="text-xs text-gray-500 mt-1">
                            Último agendamento: {new Date(cliente.ultimo_agendamento).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleSendReciclagem(cliente.cliente_id)}
                        disabled={reciclagemMutation.isPending || !config?.ativado || !config?.enviar_reciclagem}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Enviar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Recursos Úteis
        </h3>
        <div className="space-y-1 text-sm text-blue-800">
          <div>
            • <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer" className="underline">
              Documentação Evolution API
            </a>
          </div>
          <div>
            • Pasta do projeto: <code className="bg-blue-100 px-1 rounded">evolution-api/README.md</code> para instruções de deploy
          </div>
        </div>
      </div>
    </div>
  )
}
