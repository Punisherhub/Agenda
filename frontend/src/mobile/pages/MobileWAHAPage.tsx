import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PlayIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  WrenchScrewdriverIcon,
  PaperAirplaneIcon,
  BeakerIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import MobileLayout from '../layouts/MobileLayout'
import { whatsappApi } from '../../services/api'
import type { WhatsAppConfigCreate, WhatsAppConfigUpdate } from '../../types'

type ActiveTab = 'config' | 'templates' | 'inativos'

export default function MobileWAHAPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('config')
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste.')
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const queryClient = useQueryClient()

  // States para formulário
  const [formData, setFormData] = useState({
    waha_url: '',
    waha_api_key: '',
    waha_session_name: '',
    template_agendamento: '',
    template_lembrete: '',
    template_conclusao: '',
    template_cancelamento: '',
    template_reciclagem: '',
    ativado: false,
    enviar_agendamento: true,
    enviar_lembrete: true,
    enviar_conclusao: true,
    enviar_cancelamento: true,
    enviar_reciclagem: false,
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
            waha_url: configData.waha_url || '',
            waha_api_key: configData.waha_api_key || '',
            waha_session_name: configData.waha_session_name || '',
            template_agendamento: configData.template_agendamento || '',
            template_lembrete: configData.template_lembrete || '',
            template_conclusao: configData.template_conclusao || '',
            template_cancelamento: configData.template_cancelamento || '',
            template_reciclagem: configData.template_reciclagem || '',
            ativado: configData.ativado,
            enviar_agendamento: configData.enviar_agendamento,
            enviar_lembrete: configData.enviar_lembrete,
            enviar_conclusao: configData.enviar_conclusao,
            enviar_cancelamento: configData.enviar_cancelamento,
            enviar_reciclagem: configData.enviar_reciclagem,
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

  // Query status de conexão
  const { data: connectionStatus, isLoading: loadingConnection, refetch: refetchConnection } = useQuery({
    queryKey: ['waha-connection-status'],
    queryFn: async () => {
      try {
        const status = await whatsappApi.getWahaStatus()
        if (!status.connected && status.status === 'SCAN_QR_CODE') {
          try {
            const qr = await whatsappApi.getWahaQRCode()
            status.qrcode = { qr: qr.qr, code: null }
          } catch (e) {
            console.warn('QR Code não disponível ainda:', e)
          }
        }
        return status
      } catch (error) {
        return {
          connected: false,
          status: 'NOT_STARTED',
          qrcode: null,
        }
      }
    },
    enabled: !!config && activeTab === 'config',
    refetchInterval: 15000,
    retry: false,
  })

  // Mutations
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
      alert(`Erro ao salvar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  const startSessionMutation = useMutation({
    mutationFn: whatsappApi.startWahaSession,
    onSuccess: () => {
      alert('Sessão iniciada! Aguarde o QR Code...')
      setTimeout(() => refetchConnection(), 2000)
    },
    onError: (error: any) => {
      alert(`Erro ao iniciar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  const logoutSessionMutation = useMutation({
    mutationFn: whatsappApi.logoutWahaSession,
    onSuccess: () => {
      alert('Logout realizado! Escaneie o novo QR Code.')
      setTimeout(() => refetchConnection(), 2000)
    },
    onError: (error: any) => {
      alert(`Erro ao fazer logout: ${error?.response?.data?.detail || error.message}`)
    },
  })

  const testMutation = useMutation({
    mutationFn: whatsappApi.sendTest,
    onSuccess: (response) => {
      if (response.sucesso) {
        alert(`Mensagem enviada para ${response.telefone_destino}!`)
      } else {
        alert(`Erro: ${response.erro}`)
      }
    },
    onError: (error: any) => {
      alert(`Erro ao enviar: ${error?.response?.data?.detail || error.message}`)
    },
  })

  const reciclagemMutation = useMutation({
    mutationFn: whatsappApi.sendReciclagem,
    onSuccess: (response) => {
      if (response.sucesso) {
        alert('Mensagem de reciclagem enviada!')
        queryClient.invalidateQueries({ queryKey: ['clientes-inativos'] })
      } else {
        alert(`Erro: ${response.erro}`)
      }
    },
    onError: (error: any) => {
      alert(`Erro: ${error?.response?.data?.detail || error.message}`)
    },
  })

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault()
    configMutation.mutate(formData)
  }

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone || !testMessage) {
      alert('Preencha o telefone e a mensagem')
      return
    }
    testMutation.mutate({ telefone: testPhone, mensagem: testMessage })
  }

  if (loadingConfig) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <div className="pb-6">
        {/* Header */}
        <div className="bg-white shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600" />
              WhatsApp
            </h1>
            {config && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  config.ativado
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {config.ativado ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Ativo
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-4 h-4" />
                    Inativo
                  </>
                )}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">Notificações automáticas</p>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-1 ${
              activeTab === 'config'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 active:bg-gray-50'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Configuração
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 flex items-center justify-center gap-1 ${
              activeTab === 'templates'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 active:bg-gray-50'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('inativos')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 relative flex items-center justify-center gap-1 ${
              activeTab === 'inativos'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 active:bg-gray-50'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Inativos
            {clientesInativos.length > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {clientesInativos.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Tab 1: Configuração */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            {/* Informações do Servidor */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <WrenchScrewdriverIcon className="w-5 h-5 text-gray-700" />
                Servidor WhatsApp
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Servidor
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.waha_url}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave de Autenticação
                  </label>
                  <input
                    type="password"
                    disabled
                    value={formData.waha_api_key}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Sessão
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.waha_session_name}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Status e QR Code */}
            {config && (
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <DevicePhoneMobileIcon className="w-5 h-5 text-gray-700" />
                  Status da Conexão
                </h2>

                {loadingConnection ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                ) : connectionStatus ? (
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-3">
                        {connectionStatus.connected ? (
                          <>
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">WhatsApp Conectado</p>
                              <p className="text-xs text-gray-600">Sessão: {connectionStatus.session}</p>
                            </div>
                          </>
                        ) : connectionStatus.status === 'STARTING' ? (
                          <>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">Iniciando...</p>
                              <p className="text-xs text-amber-600">Aguarde 1-2 minutos</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">Desconectado</p>
                              <p className="text-xs text-gray-600">Status: {connectionStatus.status}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => refetchConnection()}
                          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg active:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          Atualizar
                        </button>

                        {connectionStatus.status === 'NOT_STARTED' || connectionStatus.status === 'STOPPED' ? (
                          <button
                            type="button"
                            onClick={() => startSessionMutation.mutate()}
                            disabled={startSessionMutation.isPending}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg active:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <PlayIcon className="w-4 h-4" />
                            Iniciar
                          </button>
                        ) : connectionStatus.status !== 'NOT_STARTED' && connectionStatus.status !== 'STOPPED' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Desconectar e gerar novo QR Code?')) {
                                logoutSessionMutation.mutate()
                              }
                            }}
                            disabled={logoutSessionMutation.isPending}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg active:bg-orange-700 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                            Reconectar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* QR Code */}
                    {!connectionStatus.connected && connectionStatus.qrcode && connectionStatus.qrcode.qr && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 text-green-900">
                            <QrCodeIcon className="w-5 h-5" />
                            <h3 className="font-semibold">Conectar WhatsApp</h3>
                          </div>

                          <div className="bg-white p-3 rounded-lg shadow-md">
                            <img
                              src={connectionStatus.qrcode.qr}
                              alt="QR Code WhatsApp"
                              className="w-64 h-64"
                            />
                          </div>

                          <div className="text-xs text-green-800 text-left w-full space-y-1">
                            <p className="font-medium">Como conectar:</p>
                            <ol className="space-y-1 ml-4">
                              <li>1. Abra o WhatsApp no celular</li>
                              <li>2. Toque em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                              <li>3. Toque em <strong>Conectar um aparelho</strong></li>
                              <li>4. Escaneie este QR Code</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}

                    {connectionStatus.connected && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-900 flex items-center gap-2">
                          <CheckCircleIcon className="w-4 h-4" />
                          WhatsApp conectado e pronto!
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900">
                      Salve a configuração primeiro.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Configurações Gerais */}
            <form onSubmit={handleSaveConfig} className="bg-white rounded-lg p-4 space-y-3">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5 text-gray-700" />
                Configurações
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3 active:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.ativado}
                    onChange={(e) => setFormData({ ...formData, ativado: e.target.checked })}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Ativar WhatsApp
                  </span>
                </label>

                <div className="pl-8 space-y-2">
                  <label className="flex items-center gap-3 active:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.enviar_agendamento}
                      onChange={(e) => setFormData({ ...formData, enviar_agendamento: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Novo agendamento</span>
                  </label>

                  <label className="flex items-center gap-3 active:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.enviar_lembrete}
                      onChange={(e) => setFormData({ ...formData, enviar_lembrete: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Lembrete 24h antes</span>
                  </label>

                  <label className="flex items-center gap-3 active:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.enviar_conclusao}
                      onChange={(e) => setFormData({ ...formData, enviar_conclusao: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Conclusão</span>
                  </label>

                  <label className="flex items-center gap-3 active:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.enviar_cancelamento}
                      onChange={(e) => setFormData({ ...formData, enviar_cancelamento: e.target.checked })}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Cancelamento</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={configMutation.isPending}
                className="w-full py-3 bg-green-600 text-white rounded-lg active:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {configMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </form>

            {/* Teste de Mensagem */}
            {config && config.ativado && (
              <form onSubmit={handleSendTest} className="bg-white rounded-lg p-4 space-y-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BeakerIcon className="w-5 h-5 text-gray-700" />
                  Teste
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={testMutation.isPending}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg active:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  {testMutation.isPending ? 'Enviando...' : 'Enviar Teste'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Templates */}
        {activeTab === 'templates' && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 flex items-start gap-2">
                <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Dica:</strong> Use placeholders como {'{nome_cliente}'}, {'{data}'}, {'{hora}'}, {'{servico}'}, {'{vendedor}'}, {'{valor}'}
                </span>
              </p>
            </div>

            {/* Botão Placeholders Disponíveis */}
            <button
              type="button"
              onClick={() => setShowPlaceholders(!showPlaceholders)}
              className="w-full bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between active:bg-blue-50 transition-colors"
            >
              <span className="font-medium text-blue-900 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5" />
                Placeholders Disponíveis
              </span>
              {showPlaceholders ? (
                <ChevronUpIcon className="w-5 h-5 text-blue-900" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-blue-900" />
              )}
            </button>

            {/* Lista de Placeholders (retrátil) */}
            {showPlaceholders && (
              <div className="bg-white border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{nome_cliente}'}</code>
                  <span className="ml-2 text-gray-600">Nome do cliente</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{data}'}</code>
                  <span className="ml-2 text-gray-600">Data (dd/mm/yyyy)</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{hora}'}</code>
                  <span className="ml-2 text-gray-600">Horário (HH:MM)</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{servico}'}</code>
                  <span className="ml-2 text-gray-600">Nome do serviço</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{vendedor}'}</code>
                  <span className="ml-2 text-gray-600">Nome do vendedor</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{valor}'}</code>
                  <span className="ml-2 text-gray-600">Valor (R$ XX,XX)</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{veiculo}'}</code>
                  <span className="ml-2 text-gray-600">Modelo e placa</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{nome_empresa}'}</code>
                  <span className="ml-2 text-gray-600">Nome da empresa</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900">{'{link_agendamento}'}</code>
                  <span className="ml-2 text-gray-600">Link agendamento</span>
                </div> 
                {/*
                <div className="text-sm text-gray-700 pt-2 border-t border-gray-200">
                  <strong className="text-gray-900">Extras (apenas reciclagem):</strong>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-900">{'{meses_inativo}'}</code>
                  <span className="ml-2 text-gray-600">Meses sem visita</span>
                </div>
                <div className="text-sm text-gray-700">
                  <code className="bg-purple-100 px-1.5 py-0.5 rounded text-purple-900">{'{data_ultimo_servico}'}</code>
                  <span className="ml-2 text-gray-600">Data último serviço</span>   
                </div>
                */}
              </div>
            )}

            {/* Template Agendamento */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-700" />
                Novo Agendamento
              </h3>
              <textarea
                value={formData.template_agendamento}
                onChange={(e) => setFormData({ ...formData, template_agendamento: e.target.value })}
                rows={6}
                placeholder="Olá {nome_cliente}! Seu agendamento..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            {/* Template Lembrete */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-700" />
                Lembrete 24h
              </h3>
              <textarea
                value={formData.template_lembrete}
                onChange={(e) => setFormData({ ...formData, template_lembrete: e.target.value })}
                rows={6}
                placeholder="Olá {nome_cliente}! Lembrete..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            {/* Template Conclusão */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                Conclusão
              </h3>
              <textarea
                value={formData.template_conclusao}
                onChange={(e) => setFormData({ ...formData, template_conclusao: e.target.value })}
                rows={6}
                placeholder="Olá {nome_cliente}! Agendamento confirmado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            {/* Template Cancelamento */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <XCircleIcon className="w-5 h-5 text-red-600" />
                Cancelamento
              </h3>
              <textarea
                value={formData.template_cancelamento}
                onChange={(e) => setFormData({ ...formData, template_cancelamento: e.target.value })}
                rows={6}
                placeholder="Olá {nome_cliente}! Agendamento cancelado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            {/* Template Reciclagem */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ArrowPathIcon className="w-5 h-5 text-blue-600" />
                Reciclagem
              </h3>
              <p className="text-xs text-gray-600">
                Placeholders extras: {'{meses_inativo}'}, {'{data_ultimo_servico}'}
              </p>
              <textarea
                value={formData.template_reciclagem}
                onChange={(e) => setFormData({ ...formData, template_reciclagem: e.target.value })}
                rows={6}
                placeholder="Olá {nome_cliente}! Sentimos sua falta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base"
              />
            </div>

            <button
              type="submit"
              disabled={configMutation.isPending}
              className="w-full py-3 bg-green-600 text-white rounded-lg active:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              {configMutation.isPending ? 'Salvando...' : 'Salvar Templates'}
            </button>
          </form>
        )}

        {/* Tab 3: Clientes Inativos */}
        {activeTab === 'inativos' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-gray-700" />
                Clientes sem agendamento
              </h2>

              {loadingInativos ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : clientesInativos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum cliente inativo encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {clientesInativos.map((cliente: any) => (
                    <div
                      key={cliente.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cliente.nome}</p>
                          <p className="text-sm text-gray-600">{cliente.telefone}</p>
                          {cliente.ultimo_agendamento && (
                            <p className="text-xs text-gray-500 mt-1">
                              Último: {new Date(cliente.ultimo_agendamento).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                          {cliente.dias_inativo} dias
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Enviar mensagem para ${cliente.nome}?`)) {
                            reciclagemMutation.mutate(cliente.id)
                          }
                        }}
                        disabled={reciclagemMutation.isPending}
                        className="w-full py-2 bg-green-600 text-white rounded-lg active:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        Enviar Mensagem
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </MobileLayout>
  )
}
