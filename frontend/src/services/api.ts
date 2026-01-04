import axios from 'axios'
import type {
  LoginRequest,
  LoginResponse,
  User,
  Cliente,
  Servico,
  Agendamento,
  AgendamentoCreate,
  ClienteCreate,
  Material,
  MaterialCreate,
  ConsumoMaterialCreate,
  ConfiguracaoFidelidade,
  ConfiguracaoFidelidadeCreate,
  ConfiguracaoFidelidadeUpdate,
  Premio,
  PremioCreate,
  PremioUpdate,
  ResgatePremio,
  ResgatePremioCreate,
  PremioDisponivel,
  WhatsAppConfig,
  WhatsAppConfigCreate,
  WhatsAppConfigUpdate,
  WhatsAppMessageRequest,
  WhatsAppMessageResponse,
  WhatsAppTestRequest,
  ClienteInativo,
  WhatsAppConnectionStatus
} from '../types'

// Em produção, usa VITE_API_URL configurado no Railway
// Em desenvolvimento, usa proxy /api
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  me: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

// Clientes
export const clientesApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    nome?: string
    telefone?: string
    email?: string
    ativo?: boolean
  }) => {
    const response = await api.get('/clientes/', { params })
    return response.data
  },

  search: async (q: string, limit = 10) => {
    const response = await api.get('/clientes/buscar', {
      params: { q, limit }
    })
    return response.data
  },

  get: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`)
    return response.data
  },

  create: async (data: ClienteCreate): Promise<Cliente> => {
    const response = await api.post('/clientes/', data)
    return response.data
  },

  update: async (id: number, data: Partial<ClienteCreate>): Promise<Cliente> => {
    const response = await api.put(`/clientes/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/clientes/${id}`)
    return response.data
  },

  getHistory: async (id: number, skip = 0, limit = 20) => {
    const response = await api.get(`/clientes/${id}/agendamentos`, {
      params: { skip, limit }
    })
    return response.data
  },
}

// Serviços
export const servicosApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    categoria?: string
    ativo?: boolean
  }) => {
    const response = await api.get('/servicos/', { params })
    return response.data
  },

  get: async (id: number): Promise<Servico> => {
    const response = await api.get(`/servicos/${id}`)
    return response.data
  },

  create: async (data: any): Promise<Servico> => {
    const response = await api.post('/servicos/', data)
    return response.data
  },

  update: async (id: number, data: any): Promise<Servico> => {
    const response = await api.put(`/servicos/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/servicos/${id}`)
    return response.data
  },
}

// Agendamentos
export const agendamentosApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    data_inicio?: string
    data_fim?: string
    status?: string
    cliente_id?: number
    servico_id?: number
  }) => {
    const response = await api.get('/agendamentos/', { params })
    return response.data
  },

  calendar: async (data_inicio: string, data_fim: string) => {
    const response = await api.get('/agendamentos/calendario', {
      params: { data_inicio, data_fim }
    })
    return response.data
  },

  get: async (id: number): Promise<Agendamento> => {
    const response = await api.get(`/agendamentos/${id}`)
    return response.data
  },

  create: async (data: AgendamentoCreate): Promise<Agendamento> => {
    const response = await api.post('/agendamentos/', data)
    return response.data
  },

  update: async (id: number, data: Partial<AgendamentoCreate>): Promise<Agendamento> => {
    const response = await api.put(`/agendamentos/${id}`, data)
    return response.data
  },

  updateStatus: async (id: number, status: string): Promise<Agendamento> => {
    const response = await api.patch(`/agendamentos/${id}/status`, { status })
    return response.data
  },

  cancel: async (id: number) => {
    const response = await api.delete(`/agendamentos/${id}`)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/agendamentos/${id}/excluir`)
    return response.data
  },
}

// Materiais
export const materiaisApi = {
  list: async (params?: {
    skip?: number
    limit?: number
    nome?: string
    ativo?: boolean
  }) => {
    const response = await api.get('/materiais/', { params })
    return response.data
  },

  get: async (id: number): Promise<Material> => {
    const response = await api.get(`/materiais/${id}`)
    return response.data
  },

  create: async (data: MaterialCreate): Promise<Material> => {
    const response = await api.post('/materiais/', data)
    return response.data
  },

  update: async (id: number, data: Partial<MaterialCreate>): Promise<Material> => {
    const response = await api.put(`/materiais/${id}`, data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/materiais/${id}`)
    return response.data
  },

  registrarConsumo: async (agendamentoId: number, consumos: ConsumoMaterialCreate[]) => {
    const response = await api.post(`/materiais/agendamentos/${agendamentoId}/consumos`, consumos)
    return response.data
  },

  listarConsumos: async (agendamentoId: number) => {
    const response = await api.get(`/materiais/agendamentos/${agendamentoId}/consumos`)
    return response.data
  },
}

// Fidelidade
export const fidelidadeApi = {
  getConfiguracao: async (): Promise<ConfiguracaoFidelidade | null> => {
    const response = await api.get('/fidelidade/configuracao')
    return response.data
  },

  createConfiguracao: async (data: ConfiguracaoFidelidadeCreate): Promise<ConfiguracaoFidelidade> => {
    const response = await api.post('/fidelidade/configuracao', data)
    return response.data
  },

  updateConfiguracao: async (data: ConfiguracaoFidelidadeUpdate): Promise<ConfiguracaoFidelidade> => {
    const response = await api.put('/fidelidade/configuracao', data)
    return response.data
  },

  listPremios: async (incluirInativos?: boolean): Promise<Premio[]> => {
    const response = await api.get('/fidelidade/premios', {
      params: { incluir_inativos: incluirInativos }
    })
    return response.data
  },

  createPremio: async (data: PremioCreate): Promise<Premio> => {
    const response = await api.post('/fidelidade/premios', data)
    return response.data
  },

  updatePremio: async (id: number, data: PremioUpdate): Promise<Premio> => {
    const response = await api.put(`/fidelidade/premios/${id}`, data)
    return response.data
  },

  deletePremio: async (id: number) => {
    const response = await api.delete(`/fidelidade/premios/${id}`)
    return response.data
  },

  resgatarPremio: async (data: ResgatePremioCreate): Promise<ResgatePremio> => {
    const response = await api.post('/fidelidade/resgates', data)
    return response.data
  },

  listarPremiosDisponiveis: async (clienteId: number): Promise<PremioDisponivel[]> => {
    const response = await api.get(`/fidelidade/premios-disponiveis/${clienteId}`)
    return response.data
  },
}

// WhatsApp
export const whatsappApi = {
  getConfig: async (): Promise<WhatsAppConfig> => {
    const response = await api.get('/whatsapp/config')
    return response.data
  },

  createConfig: async (data: WhatsAppConfigCreate): Promise<WhatsAppConfig> => {
    const response = await api.post('/whatsapp/config', data)
    return response.data
  },

  updateConfig: async (data: WhatsAppConfigUpdate): Promise<WhatsAppConfig> => {
    const response = await api.put('/whatsapp/config', data)
    return response.data
  },

  sendMessage: async (data: WhatsAppMessageRequest): Promise<WhatsAppMessageResponse> => {
    const response = await api.post('/whatsapp/send', data)
    return response.data
  },

  sendTest: async (data: WhatsAppTestRequest): Promise<WhatsAppMessageResponse> => {
    const response = await api.post('/whatsapp/test', data)
    return response.data
  },

  getClientesInativos: async (): Promise<ClienteInativo[]> => {
    const response = await api.get('/whatsapp/clientes-inativos')
    return response.data
  },

  sendReciclagem: async (clienteId: number): Promise<WhatsAppMessageResponse> => {
    const response = await api.post(`/whatsapp/send-reciclagem/${clienteId}`)
    return response.data
  },

  // WAHA Session Management (todos em /whatsapp agora)
  getConnectionStatus: async (): Promise<WhatsAppConnectionStatus> => {
    const response = await api.get('/whatsapp/status')
    return response.data
  },

  startWahaSession: async () => {
    const response = await api.post('/whatsapp/start-session')
    return response.data
  },

  stopWahaSession: async () => {
    const response = await api.post('/whatsapp/stop-session')
    return response.data
  },

  getWahaQRCode: async (): Promise<{ qr: string; status: string }> => {
    const response = await api.get('/whatsapp/qrcode')
    return response.data
  },

  getWahaStatus: async (): Promise<WhatsAppConnectionStatus> => {
    const response = await api.get('/whatsapp/status')
    return response.data
  },

  logoutWahaSession: async () => {
    const response = await api.post('/whatsapp/logout')
    return response.data
  },

  listWahaSessions: async () => {
    const response = await api.get('/whatsapp/sessions')
    return response.data
  },
}

// Relatórios
export const relatoriosApi = {
  getDashboard: async (params?: {
    data_inicio?: string
    data_fim?: string
  }) => {
    const response = await api.get('/relatorios/dashboard', { params })
    return response.data
  },
}

export default api

