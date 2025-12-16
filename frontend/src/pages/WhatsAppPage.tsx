import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircle, Settings, FileText, Users, Send, TestTube, CheckCircle, AlertCircle } from 'lucide-react'
import { whatsappApi } from '../services/api'
import type { WhatsAppConfigCreate, WhatsAppConfigUpdate } from '../types'

type ActiveTab = 'config' | 'templates' | 'meta-approval' | 'inativos'

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('config')
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste do AgendaOnSell.')
  const queryClient = useQueryClient()

  // Query configuração
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async () => {
      try {
        return await whatsappApi.getConfig()
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

  // Mutation enviar teste
  const testMutation = useMutation({
    mutationFn: () => whatsappApi.sendTest({ telefone_destino: testPhone, mensagem: testMessage }),
    onSuccess: (data) => {
      if (data.sucesso) {
        alert(`Mensagem de teste enviada com sucesso! ID: ${data.mensagem_id}`)
        setTestPhone('')
      } else {
        alert(`Erro ao enviar: ${data.erro}`)
      }
    },
    onError: (error: any) => {
      alert(`Erro: ${error?.response?.data?.detail || error.message}`)
    },
  })

  // Mutation enviar reciclagem
  const reciclagemMutation = useMutation({
    mutationFn: whatsappApi.sendReciclagem,
    onSuccess: (data, clienteId) => {
      if (data.sucesso) {
        alert(`Mensagem enviada com sucesso para cliente ${clienteId}!`)
      } else {
        alert(`Erro ao enviar: ${data.erro}`)
      }
    },
  })

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      meta_token: formData.get('meta_token') as string,
      telefone_id: formData.get('telefone_id') as string,
      ativado: formData.get('ativado') === 'on',
      enviar_agendamento: formData.get('enviar_agendamento') === 'on',
      enviar_lembrete: formData.get('enviar_lembrete') === 'on',
      enviar_confirmacao: formData.get('enviar_confirmacao') === 'on',
      enviar_cancelamento: formData.get('enviar_cancelamento') === 'on',
      enviar_reciclagem: formData.get('enviar_reciclagem') === 'on',
      meses_inatividade: Number(formData.get('meses_inatividade')),
      link_agendamento: formData.get('link_agendamento') as string || undefined,
    }

    configMutation.mutate(data)
  }

  const handleSaveTemplates = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      template_agendamento: formData.get('template_agendamento') as string || undefined,
      template_lembrete: formData.get('template_lembrete') as string || undefined,
      template_confirmacao: formData.get('template_confirmacao') as string || undefined,
      template_cancelamento: formData.get('template_cancelamento') as string || undefined,
      template_reciclagem: formData.get('template_reciclagem') as string || undefined,
      meta_template_agendamento: formData.get('meta_template_agendamento') as string || undefined,
      meta_template_lembrete: formData.get('meta_template_lembrete') as string || undefined,
      meta_template_confirmacao: formData.get('meta_template_confirmacao') as string || undefined,
      meta_template_cancelamento: formData.get('meta_template_cancelamento') as string || undefined,
      meta_template_reciclagem: formData.get('meta_template_reciclagem') as string || undefined,
    }

    configMutation.mutate(data)
  }

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testPhone) {
      alert('Digite um telefone para testar')
      return
    }
    testMutation.mutate()
  }

  const TemplateHelp = ({ placeholders }: { placeholders: string[] }) => (
    <div className="text-xs text-gray-500 mt-1 space-y-1">
      <p className="font-medium">Placeholders disponíveis:</p>
      <div className="flex flex-wrap gap-2">
        {placeholders.map((p) => (
          <code key={p} className="bg-gray-100 px-2 py-0.5 rounded">
            {p}
          </code>
        ))}
      </div>
    </div>
  )

  const RoutingIndicator = ({ metaTemplateName }: { metaTemplateName?: string | null }) => {
    if (metaTemplateName) {
      return (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">🟢 Modo: Produção (HSM)</p>
            <p className="text-xs text-green-700 mt-1">
              Mensagens serão enviadas usando o template aprovado pela Meta: <strong>{metaTemplateName}</strong>
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-2">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800">🔴 Modo: Fallback/Customizado</p>
          <p className="text-xs text-yellow-700 mt-1">
            <strong>⚠️ NÃO RECOMENDADO para produção.</strong> Este modo usa texto simples e está sujeito a bloqueio pela Meta.
            Configure um template aprovado na seção "Aprovação Meta" para garantir 100% de entrega.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-green-600" />
          WhatsApp - Mensagens Automáticas
        </h1>
        <p className="text-gray-600 mt-2">
          Configure notificações via WhatsApp Business Cloud API
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('config')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'config'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Settings className="w-5 h-5" />
            Configuração
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'templates'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <FileText className="w-5 h-5" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('meta-approval')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'meta-approval'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <CheckCircle className="w-5 h-5" />
            Aprovação Meta
          </button>
          <button
            onClick={() => setActiveTab('inativos')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'inativos'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Users className="w-5 h-5" />
            Clientes Inativos ({clientesInativos.length})
          </button>
        </nav>
      </div>

      {/* Configuração Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Credenciais Meta WhatsApp Business</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Como obter credenciais:</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal space-y-1">
                <li>Acesse <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline">Meta Business Manager</a></li>
                <li>Vá em "WhatsApp Business" → "Configurações da API"</li>
                <li>Copie o "Token de Acesso" (meta_token)</li>
                <li>Copie o "Phone Number ID" (telefone_id)</li>
              </ol>
            </div>

            {loadingConfig ? (
              <p>Carregando...</p>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Token (Access Token) *
                    </label>
                    <input
                      type="text"
                      name="meta_token"
                      defaultValue={config?.meta_token}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="EAAxxxxxxxxxxxxxxxx"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone ID (Phone Number ID) *
                    </label>
                    <input
                      type="text"
                      name="telefone_id"
                      defaultValue={config?.telefone_id}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="123456789012345"
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Notificações Ativas</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="ativado"
                        id="ativado"
                        defaultChecked={config?.ativado !== false}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label htmlFor="ativado" className="ml-2 text-sm font-medium text-gray-700">
                        🟢 Sistema WhatsApp Ativado (Master)
                      </label>
                    </div>

                    <div className="ml-6 space-y-2 border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enviar_agendamento"
                          id="enviar_agendamento"
                          defaultChecked={config?.enviar_agendamento !== false}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="enviar_agendamento" className="ml-2 text-sm text-gray-700">
                          Novo Agendamento (envio imediato)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enviar_lembrete"
                          id="enviar_lembrete"
                          defaultChecked={config?.enviar_lembrete !== false}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="enviar_lembrete" className="ml-2 text-sm text-gray-700">
                          Lembrete 24h Antes (cron job a cada hora)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enviar_confirmacao"
                          id="enviar_confirmacao"
                          defaultChecked={config?.enviar_confirmacao !== false}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="enviar_confirmacao" className="ml-2 text-sm text-gray-700">
                          Confirmação de Agendamento (envio imediato)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enviar_cancelamento"
                          id="enviar_cancelamento"
                          defaultChecked={config?.enviar_cancelamento !== false}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="enviar_cancelamento" className="ml-2 text-sm text-gray-700">
                          Cancelamento (envio imediato)
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="enviar_reciclagem"
                          id="enviar_reciclagem"
                          defaultChecked={config?.enviar_reciclagem !== false}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <label htmlFor="enviar_reciclagem" className="ml-2 text-sm text-gray-700">
                          Reciclagem de Clientes Inativos (cron job diário)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Configuração de Reciclagem</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meses de Inatividade
                      </label>
                      <input
                        type="number"
                        name="meses_inatividade"
                        min="1"
                        max="24"
                        defaultValue={config?.meses_inatividade || 3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Clientes sem agendamento há X meses recebem mensagem
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link de Agendamento (opcional)
                      </label>
                      <input
                        type="url"
                        name="link_agendamento"
                        defaultValue={config?.link_agendamento || ''}
                        placeholder="https://seusite.com/agendar"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Será enviado no template de reciclagem como {'{link_agendamento}'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={configMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {configMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </form>
            )}
          </div>

          {/* Test Message */}
          {config && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TestTube className="w-6 h-6" />
                Enviar Mensagem de Teste
              </h2>
              <form onSubmit={handleSendTest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone de Destino
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="5511999999999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: código do país + DDD + número (ex: 5511999999999)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={testMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {testMutation.isPending ? 'Enviando...' : 'Enviar Teste'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Seção 1: Nomes dos Templates HSM (Meta) - PRODUÇÃO */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">🟢 Nomes dos Templates HSM (Meta) - PRODUÇÃO</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure os nomes exatos dos templates aprovados no Meta Business Manager. Consulte a aba "Aprovação Meta" para criar os templates.
            </p>

            {loadingConfig ? (
              <p>Carregando...</p>
            ) : (
              <form onSubmit={handleSaveTemplates} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Novo Agendamento
                    </label>
                    <input
                      type="text"
                      name="meta_template_agendamento"
                      defaultValue={config?.meta_template_agendamento || ''}
                      placeholder="confirmacao_servico_saas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <RoutingIndicator metaTemplateName={config?.meta_template_agendamento} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lembrete 24h Antes
                    </label>
                    <input
                      type="text"
                      name="meta_template_lembrete"
                      defaultValue={config?.meta_template_lembrete || ''}
                      placeholder="lembrete_24h_saas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <RoutingIndicator metaTemplateName={config?.meta_template_lembrete} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmação
                    </label>
                    <input
                      type="text"
                      name="meta_template_confirmacao"
                      defaultValue={config?.meta_template_confirmacao || ''}
                      placeholder="confirmacao_servico_saas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <RoutingIndicator metaTemplateName={config?.meta_template_confirmacao} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancelamento
                    </label>
                    <input
                      type="text"
                      name="meta_template_cancelamento"
                      defaultValue={config?.meta_template_cancelamento || ''}
                      placeholder="cancelamento_servico_saas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <RoutingIndicator metaTemplateName={config?.meta_template_cancelamento} />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reciclagem de Clientes Inativos
                    </label>
                    <input
                      type="text"
                      name="meta_template_reciclagem"
                      defaultValue={config?.meta_template_reciclagem || ''}
                      placeholder="aviso_inatividade_personalizado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <RoutingIndicator metaTemplateName={config?.meta_template_reciclagem} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={configMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {configMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
                </button>
              </form>
            )}
          </div>

          {/* Seção 2: Templates Customizados (Referência/Fallback) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Templates Customizados (Referência/Fallback)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Estes templates são usados apenas para referência ou como fallback (não recomendado para produção).
            </p>

            {loadingConfig ? (
              <p>Carregando...</p>
            ) : (
              <form onSubmit={handleSaveTemplates} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template: Novo Agendamento
                  </label>
                  <textarea
                    name="template_agendamento"
                    rows={4}
                    defaultValue={config?.template_agendamento || ''}
                    placeholder="Olá {nome_cliente}! Seu agendamento foi confirmado para {data} às {hora}. Serviço: {servico}. Até lá!"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <TemplateHelp placeholders={['{nome_cliente}', '{data}', '{hora}', '{servico}', '{vendedor}', '{valor}']} />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template: Lembrete 24h Antes
                </label>
                <textarea
                  name="template_lembrete"
                  rows={4}
                  defaultValue={config?.template_lembrete || ''}
                  placeholder="Olá {nome_cliente}! Lembramos que você tem agendamento amanhã às {hora}. Serviço: {servico}. Aguardamos você!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <TemplateHelp placeholders={['{nome_cliente}', '{data}', '{hora}', '{hora_fim}', '{servico}', '{vendedor}']} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template: Confirmação de Agendamento
                </label>
                <textarea
                  name="template_confirmacao"
                  rows={4}
                  defaultValue={config?.template_confirmacao || ''}
                  placeholder="Olá {nome_cliente}! Seu agendamento para {data} às {hora} foi CONFIRMADO. Nos vemos em breve!"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <TemplateHelp placeholders={['{nome_cliente}', '{data}', '{hora}', '{servico}', '{vendedor}']} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template: Cancelamento
                </label>
                <textarea
                  name="template_cancelamento"
                  rows={4}
                  defaultValue={config?.template_cancelamento || ''}
                  placeholder="Olá {nome_cliente}. Informamos que seu agendamento de {data} às {hora} foi cancelado. Entre em contato para reagendar."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <TemplateHelp placeholders={['{nome_cliente}', '{data}', '{hora}', '{servico}', '{vendedor}']} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template: Reciclagem de Clientes Inativos
                </label>
                <textarea
                  name="template_reciclagem"
                  rows={4}
                  defaultValue={config?.template_reciclagem || ''}
                  placeholder="Olá {nome_cliente}! Sentimos sua falta! Faz {meses_inativo} meses que não nos vemos. Agende agora: {link_agendamento}"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
                <TemplateHelp placeholders={['{nome_cliente}', '{nome_empresa}', '{meses_inativo}', '{data_ultimo_servico}', '{link_agendamento}']} />
              </div>

              <button
                type="submit"
                disabled={configMutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {configMutation.isPending ? 'Salvando...' : 'Salvar Templates'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Aprovação Meta Tab */}
      {activeTab === 'meta-approval' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">📱 Guia de Aprovação de Templates HSM - Meta WhatsApp Business</h2>

          {/* Alerta Importante */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  ⚠️ Passo ESSENCIAL para funcionamento em produção
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Para que o sistema WhatsApp funcione em <strong>PRODUÇÃO</strong>, é necessário aprovar os templates de mensagem (HSM - Highly Structured Messages) na plataforma Meta Business Manager. Mensagens iniciadas pela empresa só podem ser enviadas usando templates pré-aprovados.
                </p>
              </div>
            </div>
          </div>

          {/* Templates Recomendados */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">📋 Templates Recomendados para Aprovação</h3>
              <p className="text-sm text-gray-600 mb-4">
                Crie os seguintes templates no Meta Business Manager. Copie exatamente a estrutura mostrada, substituindo `{'{'}'{1}'}'{'}` pelos parâmetros numerados.
              </p>
            </div>

            {/* Template 1: Novo Agendamento */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-2">1. Novo Agendamento</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Nome na Meta:</span>
                  <span className="col-span-2"><code className="bg-gray-100 px-2 py-1 rounded">confirmacao_servico_saas</code></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Categoria:</span>
                  <span className="col-span-2">TRANSACTIONAL</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Corpo:</span>
                  <span className="col-span-2 font-mono text-xs bg-gray-50 p-2 rounded">
                    Olá {'{'}'{1}'}'{'}! Seu agendamento foi confirmado para {'{'}'{2}'}'{'}às {'{'}'{3}'}'{'}. Serviço: {'{'}'{4}'}'{'}. Valor: {'{'}'{5}'}'{'}. Até lá!
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Parâmetros:</span>
                  <span className="col-span-2 text-xs">
                    {'{'}'{1}'}'} = nome_cliente, {'{'}'{2}'}'} = data, {'{'}'{3}'}'} = hora, {'{'}'{4}'}'} = serviço, {'{'}'{5}'}'} = valor
                  </span>
                </div>
              </div>
            </div>

            {/* Template 2: Lembrete */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-2">2. Lembrete 24h Antes</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Nome na Meta:</span>
                  <span className="col-span-2"><code className="bg-gray-100 px-2 py-1 rounded">lembrete_24h_saas</code></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Categoria:</span>
                  <span className="col-span-2">TRANSACTIONAL</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Corpo:</span>
                  <span className="col-span-2 font-mono text-xs bg-gray-50 p-2 rounded">
                    Olá {'{'}'{1}'}'{'}! Lembramos que você tem agendamento amanhã às {'{'}'{2}'}'{'}. Serviço: {'{'}'{3}'}'{'}. Aguardamos você!
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Parâmetros:</span>
                  <span className="col-span-2 text-xs">
                    {'{'}'{1}'}'} = nome_cliente, {'{'}'{2}'}'} = hora, {'{'}'{3}'}'} = serviço
                  </span>
                </div>
              </div>
            </div>

            {/* Template 3: Confirmação */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-2">3. Confirmação de Agendamento</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Nome na Meta:</span>
                  <span className="col-span-2"><code className="bg-gray-100 px-2 py-1 rounded">confirmacao_servico_saas</code></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Categoria:</span>
                  <span className="col-span-2">TRANSACTIONAL</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Corpo:</span>
                  <span className="col-span-2 font-mono text-xs bg-gray-50 p-2 rounded">
                    Olá {'{'}'{1}'}'{'}! Seu agendamento para {'{'}'{2}'}'} às {'{'}'{3}'}'} foi CONFIRMADO. Nos vemos em breve!
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Parâmetros:</span>
                  <span className="col-span-2 text-xs">
                    {'{'}'{1}'}'} = nome_cliente, {'{'}'{2}'}'} = data, {'{'}'{3}'}'} = hora
                  </span>
                </div>
              </div>
            </div>

            {/* Template 4: Cancelamento */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-green-700 mb-2">4. Cancelamento</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Nome na Meta:</span>
                  <span className="col-span-2"><code className="bg-gray-100 px-2 py-1 rounded">cancelamento_servico_saas</code></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Categoria:</span>
                  <span className="col-span-2">TRANSACTIONAL</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Corpo:</span>
                  <span className="col-span-2 font-mono text-xs bg-gray-50 p-2 rounded">
                    Olá {'{'}'{1}'}'{'}. Informamos que seu agendamento de {'{'}'{2}'}'} às {'{'}'{3}'}'} foi cancelado. Entre em contato para reagendar.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Parâmetros:</span>
                  <span className="col-span-2 text-xs">
                    {'{'}'{1}'}'} = nome_cliente, {'{'}'{2}'}'} = data, {'{'}'{3}'}'} = hora
                  </span>
                </div>
              </div>
            </div>

            {/* Template 5: Reciclagem */}
            <div className="border rounded-lg p-4 bg-yellow-50">
              <h4 className="font-semibold text-green-700 mb-2">5. Reciclagem de Clientes Inativos ⭐</h4>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Nome na Meta:</span>
                  <span className="col-span-2"><code className="bg-gray-100 px-2 py-1 rounded">aviso_inatividade_personalizado</code></span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Categoria:</span>
                  <span className="col-span-2">MARKETING</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Corpo:</span>
                  <span className="col-span-2 font-mono text-xs bg-gray-50 p-2 rounded">
                    Olá {'{'}'{1}'}'{'}! Vimos que faz {'{'}'{2}'}'} meses que você não utiliza os serviços da {'{'}'{3}'}'} (última visita em {'{'}'{4}'}'{'}). Que tal agendar sua próxima manutenção agora?
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Rodapé:</span>
                  <span className="col-span-2">Toque no botão para agendar!</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Botão:</span>
                  <span className="col-span-2">[VISITAR SITE] → URL dinâmica: {'{'}'{1}'}'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium">Parâmetros:</span>
                  <span className="col-span-2 text-xs">
                    Corpo: {'{'}'{1}'}'} = nome_cliente, {'{'}'{2}'}'} = meses_inativo, {'{'}'{3}'}'} = nome_empresa, {'{'}'{4}'}'} = data_ultimo_servico<br />
                    Botão: {'{'}'{1}'}'} = link_agendamento
                  </span>
                </div>
              </div>
            </div>

            {/* Passo a Passo */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">🎯 Como Criar Templates no Meta Business Manager</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>
                  Acesse <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Meta Business Manager</a>
                </li>
                <li>Selecione sua conta de negócios</li>
                <li>Vá em <strong>"WhatsApp Business"</strong> → <strong>"Gerenciador de Templates"</strong></li>
                <li>Clique em <strong>"Criar Template"</strong></li>
                <li>Preencha:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><strong>Nome:</strong> Use o nome sugerido acima (ex: confirmacao_servico_saas)</li>
                    <li><strong>Categoria:</strong> TRANSACTIONAL ou MARKETING conforme indicado</li>
                    <li><strong>Idioma:</strong> Portuguese (BR)</li>
                  </ul>
                </li>
                <li>Adicione o <strong>Corpo</strong> com os parâmetros numerados {'{'}'{1}'}'{''}, {'{'}'{2}'}'{''}, etc.</li>
                <li>Para reciclagem, adicione o <strong>Rodapé</strong> e <strong>Botão</strong></li>
                <li>Clique em <strong>"Enviar"</strong></li>
                <li>Aguarde aprovação (geralmente 24-48 horas)</li>
                <li>Após aprovação, configure os nomes na aba <strong>"Templates"</strong></li>
              </ol>
            </div>

            {/* FAQ */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">❓ Perguntas Frequentes</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Por que preciso aprovar templates?</p>
                  <p className="text-gray-600 mt-1">Meta WhatsApp Business exige aprovação prévia para evitar spam e garantir qualidade das mensagens.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Posso editar os templates depois?</p>
                  <p className="text-gray-600 mt-1">Sim, mas qualquer edição precisa passar por nova aprovação da Meta.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">E se eu não configurar os templates HSM?</p>
                  <p className="text-gray-600 mt-1">O sistema funcionará em modo "fallback" usando texto simples, que só funciona com números de teste da Meta.</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Quanto tempo leva para aprovar?</p>
                  <p className="text-gray-600 mt-1">Geralmente 24-48 horas. Templates transacionais costumam ser mais rápidos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clientes Inativos Tab */}
      {activeTab === 'inativos' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Clientes Inativos</h2>
              <p className="text-sm text-gray-600 mt-1">
                Clientes sem agendamento há {config?.meses_inatividade || 3}+ meses
              </p>
            </div>
          </div>

          {loadingInativos ? (
            <p>Carregando clientes inativos...</p>
          ) : clientesInativos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum cliente inativo encontrado!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Último Agendamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Meses Inativo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientesInativos.map((cliente) => (
                    <tr key={cliente.cliente_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.telefone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cliente.ultimo_agendamento
                          ? new Date(cliente.ultimo_agendamento).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                          {cliente.meses_inativo} meses
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            if (confirm(`Enviar mensagem de reciclagem para ${cliente.nome}?`)) {
                              reciclagemMutation.mutate(cliente.cliente_id)
                            }
                          }}
                          disabled={reciclagemMutation.isPending}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          Enviar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
