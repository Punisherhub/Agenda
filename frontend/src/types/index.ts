// Tipos base do sistema

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: 'admin' | 'manager' | 'vendedor' | 'atendente' | 'suporte'
  estabelecimento_id: number | null
  estabelecimento_nome?: string | null
  is_active: boolean
  is_verified: boolean
}

export interface Cliente {
  id: number
  nome: string
  email: string | null
  telefone: string
  cpf: string | null
  data_aniversario: string | null  // Formato DD/MM (ex: "15/03")
  genero: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  observacoes: string | null
  pontos: number
  is_active: boolean
  created_at: string
  updated_at: string
  last_visit: string | null
}

export interface Servico {
  id: number
  nome: string
  descricao: string | null
  preco: number
  duracao_minutos: number
  is_active: boolean
  cor: string
  categoria: string | null
  requer_agendamento: boolean
  estabelecimento_id: number
  created_at: string
  updated_at: string
}

export interface Agendamento {
  id: number
  data_agendamento: string
  data_inicio: string
  data_fim: string
  status: 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO' | 'NAO_COMPARECEU'
  observacoes: string | null
  observacoes_internas: string | null
  veiculo: string | null  // Modelo e placa do veículo
  valor_servico: number
  valor_desconto: number
  valor_final: number
  forma_pagamento?: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'boleto' | 'pendente'  // DEPRECATED: não mais coletado
  avaliacao_nota: number | null
  avaliacao_comentario: string | null
  cliente_id: number
  servico_id: number | null  // Nullable para serviços personalizados
  vendedor_id: number
  estabelecimento_id: number
  created_at: string
  updated_at: string
  canceled_at: string | null
  completed_at: string | null
  deleted_at: string | null

  // Campos de serviço personalizado
  servico_personalizado?: boolean
  servico_personalizado_nome?: string
  servico_personalizado_descricao?: string

  // Dados relacionados (quando incluídos)
  cliente?: Cliente
  servico?: Servico
  vendedor?: User
}

export interface ApiResponse<T> {
  data?: T
  message?: string
  detail?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface AgendamentoCreate {
  cliente_id: number
  servico_id?: number  // Opcional se for serviço personalizado
  data_inicio: string
  data_fim?: string
  observacoes?: string
  veiculo?: string  // Modelo e placa do veículo
  valor_desconto?: number

  // Campos para serviço personalizado
  servico_personalizado?: boolean
  servico_personalizado_nome?: string
  servico_personalizado_descricao?: string
  valor_servico_personalizado?: number
}

export interface ClienteCreate {
  nome: string
  telefone: string
  email?: string
  cpf?: string
  data_aniversario?: string  // Formato DD/MM (ex: "15/03")
  genero?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  observacoes?: string
}

export interface ServicoCreate {
  nome: string
  descricao?: string
  preco: number
  duracao_minutos: number
  categoria?: string
  cor?: string
  requer_agendamento?: boolean
  estabelecimento_id: number
}

export interface Material {
  id: number
  nome: string
  descricao: string | null
  valor_custo: number
  unidade_medida: 'ML' | 'UNIDADE' | 'GRAMA' | 'CM'
  quantidade_estoque: number
  quantidade_minima: number | null
  marca: string | null
  fornecedor: string | null
  is_active: boolean
  estabelecimento_id: number
  created_at: string
  updated_at: string | null
}

export interface MaterialCreate {
  nome: string
  descricao?: string
  valor_custo: number
  unidade_medida: 'ML' | 'UNIDADE' | 'GRAMA' | 'CM'
  quantidade_estoque: number
  quantidade_minima?: number
  marca?: string
  fornecedor?: string
  estabelecimento_id: number
}

export interface ConsumoMaterial {
  id: number
  agendamento_id: number
  material_id: number
  material?: {  // Material details included in response
    id: number
    nome: string
    unidade_medida: 'ML' | 'UNIDADE' | 'GRAMA'
  }
  quantidade_consumida: number
  valor_custo_unitario: number
  valor_total: number
  created_at: string
}

export interface ConsumoMaterialCreate {
  material_id: number
  quantidade_consumida: number
}

// Tipos de Relatórios
export interface MaterialEstoque {
  material_id: number
  nome: string
  quantidade_estoque: number
  quantidade_minima: number | null
  unidade_medida: string
  valor_total_estoque: number
}

export interface ResumoFinanceiro {
  data_inicio: string
  data_fim: string
  total_receita: number
  total_custos_materiais: number
  lucro_bruto: number
  total_agendamentos: number
  total_agendamentos_concluidos: number
}

export interface ServicoLucro {
  servico_id: number
  servico_nome: string
  quantidade_vendida: number
  receita_total: number
  custo_materiais_total: number
  lucro_total: number
  ticket_medio: number
}

export interface MaterialConsumo {
  material_id: number
  material_nome: string
  quantidade_consumida: number
  unidade_medida: string
  custo_total: number
  vezes_utilizado: number
}

export interface ReceitaDiaria {
  data: string
  receita: number
  custos: number
  lucro: number
  agendamentos: number
}

export interface DashboardRelatorios {
  resumo_financeiro: ResumoFinanceiro
  estoque_materiais: MaterialEstoque[]
  servicos_lucro: ServicoLucro[]
  materiais_consumo: MaterialConsumo[]
  receita_diaria: ReceitaDiaria[]
}

// ==================== Sistema de Fidelidade ====================

export interface ConfiguracaoFidelidade {
  id: number
  reais_por_ponto: number
  ativo: boolean
  estabelecimento_id: number
  created_at: string
  updated_at: string | null
}

export interface ConfiguracaoFidelidadeCreate {
  reais_por_ponto: number
  ativo?: boolean
}

export interface ConfiguracaoFidelidadeUpdate {
  reais_por_ponto?: number
  ativo?: boolean
}

export type TipoPremio = 'DESCONTO_PERCENTUAL' | 'DESCONTO_FIXO' | 'SERVICO_GRATIS' | 'PRODUTO'

export interface Premio {
  id: number
  nome: string
  descricao: string | null
  pontos_necessarios: number
  tipo_premio: TipoPremio
  valor_desconto: number | null
  servico_id: number | null
  ativo: boolean
  estabelecimento_id: number
  created_at: string
  updated_at: string | null
}

export interface PremioCreate {
  nome: string
  descricao?: string
  pontos_necessarios: number
  tipo_premio: TipoPremio
  valor_desconto?: number
  servico_id?: number
  ativo?: boolean
}

export interface PremioUpdate {
  nome?: string
  descricao?: string
  pontos_necessarios?: number
  tipo_premio?: TipoPremio
  valor_desconto?: number
  servico_id?: number
  ativo?: boolean
}

export type StatusResgate = 'DISPONIVEL' | 'USADO' | 'EXPIRADO'

export interface ResgatePremio {
  id: number
  cliente_id: number
  premio_id: number
  pontos_utilizados: number
  data_resgate: string
  status: StatusResgate
  usado_em_agendamento_id: number | null
  data_expiracao: string | null
  created_at: string
  updated_at: string | null
}

export interface ResgatePremioCreate {
  cliente_id: number
  premio_id: number
  pontos_utilizados: number
}

export interface PremioDisponivel {
  premio: Premio
  pode_resgatar: boolean
  pontos_faltantes: number
}

// ==================== Sistema de WhatsApp (Evolution API + WAHA) ====================

export interface WhatsAppConfig {
  id: number
  // Evolution API Credentials (opcional)
  evolution_api_url: string | null
  evolution_api_key: string | null
  evolution_instance_name: string | null
  // WAHA Credentials (opcional - nova alternativa)
  waha_url: string | null
  waha_api_key: string | null
  waha_session_name: string | null
  // Templates
  template_agendamento: string | null
  template_lembrete: string | null
  template_conclusao: string | null
  template_cancelamento: string | null
  template_reciclagem: string | null
  template_aniversario: string | null
  // Configurações
  ativado: boolean
  enviar_agendamento: boolean
  enviar_lembrete: boolean
  enviar_conclusao: boolean
  enviar_cancelamento: boolean
  enviar_reciclagem: boolean
  enviar_aniversario: boolean
  meses_inatividade: number
  link_agendamento: string | null
  estabelecimento_id: number
  created_at: string
  updated_at: string | null
}

export interface WhatsAppConfigCreate {
  // Evolution API Credentials (opcional)
  evolution_api_url?: string | null
  evolution_api_key?: string | null
  evolution_instance_name?: string | null
  // WAHA Credentials (opcional)
  waha_url?: string | null
  waha_api_key?: string | null
  waha_session_name?: string | null
  // Templates
  template_agendamento?: string
  template_lembrete?: string
  template_conclusao?: string
  template_cancelamento?: string
  template_reciclagem?: string
  template_aniversario?: string
  // Configurações
  ativado?: boolean
  enviar_agendamento?: boolean
  enviar_lembrete?: boolean
  enviar_conclusao?: boolean
  enviar_cancelamento?: boolean
  enviar_reciclagem?: boolean
  enviar_aniversario?: boolean
  meses_inatividade?: number
  link_agendamento?: string
  estabelecimento_id?: number
}

export interface WhatsAppConfigUpdate {
  // Evolution API Credentials (opcional)
  evolution_api_url?: string | null
  evolution_api_key?: string | null
  evolution_instance_name?: string | null
  // WAHA Credentials (opcional)
  waha_url?: string | null
  waha_api_key?: string | null
  waha_session_name?: string | null
  // Templates
  template_agendamento?: string
  template_lembrete?: string
  template_conclusao?: string
  template_cancelamento?: string
  template_reciclagem?: string
  template_aniversario?: string
  // Configurações
  ativado?: boolean
  enviar_agendamento?: boolean
  enviar_lembrete?: boolean
  enviar_conclusao?: boolean
  enviar_cancelamento?: boolean
  enviar_reciclagem?: boolean
  enviar_aniversario?: boolean
  meses_inatividade?: number
  link_agendamento?: string
}

export type TipoMensagemWhatsApp = 'AGENDAMENTO' | 'LEMBRETE' | 'CONFIRMACAO' | 'CANCELAMENTO' | 'RECICLAGEM' | 'ANIVERSARIO'

export interface WhatsAppMessageRequest {
  cliente_id: number
  tipo_mensagem: TipoMensagemWhatsApp
  agendamento_id?: number
  mensagem_customizada?: string
}

export interface WhatsAppMessageResponse {
  sucesso: boolean
  mensagem_id: string | null
  erro: string | null
  telefone_destino: string
}

export interface WhatsAppTestRequest {
  telefone: string
  mensagem: string
}

export interface ClienteInativo {
  cliente_id: number
  nome: string
  telefone: string
  ultimo_agendamento: string | null
  meses_inativo: number
}

export interface WhatsAppQRCode {
  base64?: string  // Evolution API
  qr?: string  // WAHA (data:image/png;base64,...)
  code: string | null
  count?: number
}

export interface WhatsAppConnectionStatus {
  connected: boolean
  instance?: string  // Evolution API
  session?: string  // WAHA
  status: string
  qrcode: WhatsAppQRCode | null
  me?: any  // WAHA - informações do WhatsApp conectado
}

// Tipos de provedor WhatsApp
export type WhatsAppProvider = 'evolution' | 'waha'
