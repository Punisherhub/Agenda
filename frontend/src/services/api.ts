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
  DashboardRelatorios
} from '../types'

// Use /api em dev para usar o proxy do Vite e evitar CORS
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

  confirm: async (id: number): Promise<Agendamento> => {
    const response = await api.post(`/agendamentos/${id}/confirmar`)
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