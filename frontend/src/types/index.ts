// Tipos base do sistema

export interface User {
  id: number
  email: string
  username: string
  full_name: string
  role: 'admin' | 'manager' | 'vendedor' | 'atendente'
  estabelecimento_id: number | null
  is_active: boolean
  is_verified: boolean
}

export interface Cliente {
  id: number
  nome: string
  email: string | null
  telefone: string
  cpf: string | null
  data_nascimento: string | null
  genero: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  observacoes: string | null
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
  status: 'AGENDADO' | 'CONFIRMADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'NAO_COMPARECEU'
  observacoes: string | null
  observacoes_internas: string | null
  valor_servico: number
  valor_desconto: number
  valor_final: number
  forma_pagamento: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix' | 'boleto' | 'pendente'
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
  email: string
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
  data_nascimento?: string
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
  unidade_medida: 'ML' | 'UNIDADE' | 'GRAMA'
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
  unidade_medida: 'ML' | 'UNIDADE' | 'GRAMA'
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