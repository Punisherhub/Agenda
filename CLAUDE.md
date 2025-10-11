# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agenda OnSell - Sistema de Agendamento Empresarial

## ⚡ Quick Reference

**Start Development**:
```bash
# Backend
cd backend && python main.py

# Frontend (new terminal)
cd frontend && npm run dev
```

**API Docs**: http://localhost:8000/docs
**Frontend**: http://localhost:3000
**Test User**: `carlos@barbeariamoderna.com` / `123456`

## 📋 Visão Geral

Sistema de agendamento para empresas prestadoras de serviços como:
- Barbearias
- Oficinas Mecânicas
- Pet Shops
- Salões de Beleza
- E outros serviços

**IMPORTANTE**: Sistema exclusivo para uso interno das empresas (funcionários), não para clientes finais.

## 🏗️ Arquitetura

### Hierarquia de Dados
```
Empresa → Estabelecimento → Serviço → Usuario (Vendedor) → Cliente → Agendamento
```

### Stack Tecnológica
- **Backend**: FastAPI + Python
- **Banco**: PostgreSQL (Render.com)
- **ORM**: SQLAlchemy
- **Auth**: JWT + bcrypt
- **Migrations**: Alembic

## 🗄️ Banco de Dados

### Conexão
O projeto usa PostgreSQL hospedado no Render.com. Credenciais estão no arquivo `.env` do backend.

**Formato da connection string**:
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

### Estrutura Atual
- ✅ **empresas**: Dados da empresa (CNPJ, contato, endereço)
- ✅ **estabelecimentos**: Filiais/locais de atendimento
- ✅ **servicos**: Serviços oferecidos (preço, duração, categoria)
- ✅ **users**: Funcionários com roles (ADMIN, MANAGER, VENDEDOR, ATENDENTE)
- ✅ **clientes**: Dados dos clientes (contato, preferências, VIP)
- ✅ **agendamentos**: Appointments com status e valores

### Dados de Teste Populados
- 3 Empresas (Barbearia, Oficina, Pet Shop)
- 4 Estabelecimentos
- 10 Serviços diversos
- 6 Usuários com diferentes roles
- 6 Clientes (2 VIPs)
- 6 Agendamentos com diferentes status

## 🔐 Autenticação

### Sistema JWT Implementado
- Login: `POST /auth/login`
- Register: `POST /auth/register`
- Me: `GET /auth/me`
- Tokens com 30min de validade

### Roles e Permissões
```python
class UserRole(enum.Enum):
    ADMIN = "admin"         # Administrador da empresa
    MANAGER = "manager"     # Gerente do estabelecimento
    VENDEDOR = "vendedor"   # Vendedor/Funcionário
    ATENDENTE = "atendente" # Atendente
```

**REGRAS DE NEGÓCIO:**
- ✅ TODOS os funcionários podem fazer agendamentos
- ✅ Cada agendamento pertence a um estabelecimento
- ✅ Usuários veem/agendam serviços do seu estabelecimento
- ✅ Roles são apenas para organização (não restringem funcionalidades)

### Usuários de Teste
```
Email: admin@barbeariamoderna.com
Senha: 123456
Role: ADMIN

Email: carlos@barbeariamoderna.com
Senha: 123456
Role: VENDEDOR
```

## 📊 Estado Atual

### ✅ Implementado
- [x] Estrutura completa do banco
- [x] Modelos SQLAlchemy
- [x] Schemas Pydantic
- [x] Autenticação JWT funcional
- [x] FastAPI com 48 rotas definidas
- [x] Dados de teste populados
- [x] **CRUD de Agendamentos** (COMPLETO)
- [x] **CRUD de Clientes** (COMPLETO)
- [x] **CRUD de Serviços** (COMPLETO)
- [x] **Autorização por estabelecimento** (IMPLEMENTADO)
- [x] **Filtros automáticos por usuário** (IMPLEMENTADO)
- [x] **Services para lógica de negócio** (IMPLEMENTADO)
- [x] **Calendário com Drag & Drop** (IMPLEMENTADO)
- [x] **Resize dinâmico de agendamentos** (IMPLEMENTADO)
- [x] **Interface tipo Google Calendar** (IMPLEMENTADO)

### ⚠️ Pendente (Opcional)
- [ ] CRUD de Estabelecimentos (Admin)
- [ ] CRUD de Empresas (Admin)
- [ ] Dashboard/Relatórios
- [ ] Notificações
- [ ] Configurações avançadas

## 🎯 Próximos Passos

### 1. CRÍTICO - Agendamentos (Core)
```python
# Endpoints essenciais:
GET /agendamentos/                    # Listar com filtros
POST /agendamentos/                   # Criar novo
GET /agendamentos/calendario          # View calendário
PUT /agendamentos/{id}/status         # Atualizar status
DELETE /agendamentos/{id}             # Cancelar
```

### 2. IMPORTANTE - Gestão Básica
- CRUD completo de clientes
- Listar serviços do estabelecimento
- Busca rápida de clientes

### 3. SEGURANÇA - Autorização
- Filtrar por estabelecimento do usuário
- Verificar permissões por role
- Isolamento de dados

## 📅 Funcionalidade de Calendário

### Interface Google Calendar-like
- **React Big Calendar** com drag-and-drop habilitado
- **Visualização**: Dia, Semana, Mês
- **Eventos coloridos** por status do agendamento
- **Timezone**: PT-BR com date-fns localização

### Drag & Drop Dinâmico
- ✅ **Arrastar eventos**: Move horário mantendo duração
- ✅ **Redimensionar eventos**: Estende/reduz duração dinamicamente
- ✅ **Seleção de slots**: Clique em horário vazio para criar agendamento
- ✅ **Atualização em tempo real**: React Query invalida cache automaticamente

### Duração Flexível de Serviços
- **Sem duração fixa**: Serviços não têm tempo pré-determinado
- **Duração personalizada**: Definida no modal de agendamento (15-480 min)
- **Resize visual**: Arrastar para baixo no evento estende a duração
- **Persistência**: Backend salva `data_inicio` e `data_fim` separadamente

### Tecnologias Utilizadas
```tsx
// Principais dependências do calendário
import { Calendar as BigCalendar } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
```

### Handlers de Evento
- **onEventResize**: Captura redimensionamento e atualiza data_fim
- **onEventDrop**: Captura movimentação e ajusta horários
- **onSelectSlot**: Cria novo agendamento no horário selecionado
- **onSelectEvent**: Abre modal de detalhes do agendamento

## 🚀 Como Executar

### Início Rápido
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh && ./start.sh
```

### Backend (API - porta 8000)
```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Executar servidor
python main.py
# ou
uvicorn main:app --reload --port 8000
```

**API Docs (Swagger)**: http://localhost:8000/docs

### Frontend (Interface - porta 3000)
```bash
cd frontend

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev
```

**App URL**: http://localhost:3000

## 🔧 Comandos de Desenvolvimento

### Configuração Inicial
```bash
# Backend - Instalar dependências
cd backend/ && pip install -r requirements.txt

# Frontend - Instalar dependências
cd frontend/ && npm install
```

### Executar Aplicação
```bash
# Iniciar ambos os serviços automaticamente
./start.sh           # Linux/Mac
./start.bat          # Windows

# Ou executar separadamente:
# Backend (porta 8000)
cd backend/ && python main.py
# ou
cd backend/ && uvicorn main:app --reload --port 8000

# Frontend (porta 3000)
cd frontend/ && npm run dev
```

### Comandos de Banco de Dados
```bash
# Testar conexão DB (Windows)
cd backend && python -c "from app.database import engine; print('DB OK')"

# Criar nova migration
cd backend && alembic revision --autogenerate -m "Description"

# Aplicar migrations (atualizar schema)
cd backend && alembic upgrade head

# Reverter última migration
cd backend && alembic downgrade -1

# Ver histórico de migrations
cd backend && alembic history

# Ver migration atual
cd backend && alembic current
```

### Testes
```bash
# Backend - Executar todos os testes
cd backend && pytest

# Backend - Testes específicos
cd backend && pytest tests/unit/
cd backend && pytest tests/integration/

# Backend - Teste com coverage
cd backend && pytest --cov=app --cov-report=html

# Frontend - Lint e Type Check
cd frontend && npm run lint
cd frontend && npm run type-check
```

### Build e Deploy
```bash
# Frontend - Build para produção
cd frontend/ && npm run build

# Frontend - Preview do build
cd frontend/ && npm run preview
```

## 🏗️ Arquitetura e Estrutura

### Backend Architecture (FastAPI)
```
backend/
├── app/
│   ├── api/               # FastAPI route handlers
│   │   ├── auth.py        # JWT authentication routes
│   │   ├── users.py       # User management routes
│   │   ├── empresas.py    # Company routes
│   │   ├── estabelecimentos.py # Establishment routes
│   │   ├── servicos.py    # Services routes
│   │   ├── clientes.py    # Client routes
│   │   └── agendamentos.py # Appointment routes
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py        # User/Employee model
│   │   ├── empresa.py     # Company model
│   │   ├── estabelecimento.py # Establishment model
│   │   ├── servico.py     # Service model
│   │   ├── cliente.py     # Client model
│   │   └── agendamento.py # Appointment model
│   ├── schemas/           # Pydantic schemas
│   ├── services/          # Business logic layer
│   ├── utils/             # Helper utilities
│   ├── config.py          # App configuration
│   └── database.py        # Database connection
├── alembic/               # Database migrations
├── tests/                 # Test suites
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── main.py                # FastAPI app entry point
└── requirements.txt       # Python dependencies
```

### Frontend Architecture (React + TypeScript)
```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.tsx     # Main app layout
│   │   ├── ProtectedRoute.tsx # Route protection
│   │   ├── Calendar.tsx   # Drag & Drop Calendar component
│   │   ├── AgendamentoModal.tsx # Create/Edit appointment modal
│   │   └── AgendamentoDetailModal.tsx # Appointment details modal
│   ├── pages/             # Page components
│   │   ├── LoginPage.tsx  # Authentication page
│   │   ├── DashboardPage.tsx # Main dashboard
│   │   ├── AgendamentosPage.tsx # Appointments page with calendar
│   │   └── ClientesPage.tsx # Clients page
│   ├── services/          # API service layer
│   │   └── api.ts         # HTTP client configuration
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Shared types
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper utilities
│   └── styles/            # CSS/Tailwind styles
├── vite.config.ts         # Vite configuration (proxy to backend)
├── package.json           # Dependencies and scripts
└── tailwind.config.js     # Tailwind CSS configuration
```

### Key Architectural Patterns

#### Backend Patterns
- **Layered Architecture**: API → Services → Models → Database
- **Dependency Injection**: Database sessions injected via FastAPI
- **Repository Pattern**: Services handle business logic, models handle data
- **JWT Authentication**: Stateless token-based auth with 30min expiry
- **Soft Delete**: `is_active` field for logical deletion

#### Frontend Patterns
- **Component-Based**: Modular React components
- **TypeScript**: Type safety across the application
- **React Query**: Server state management and caching with automatic invalidation
- **React Hook Form**: Form handling and validation
- **Proxy Pattern**: Vite dev server proxies `/api/*` → `http://localhost:8000/*`
  - Frontend calls: `axios.get('/api/agendamentos')`
  - Vite proxy forwards to: `http://localhost:8000/agendamentos`
  - Configured in: `frontend/vite.config.ts`

#### Data Flow
```
User Action → React Component → API Service → FastAPI Route →
Service Layer → SQLAlchemy Model → PostgreSQL → Response Chain
```

## 🔧 Configurações

### Variáveis de Ambiente

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
SECRET_KEY=sua_chave_secreta_jwt_aqui
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

**Nota**: Use `backend/app/config.py` para configurações padrão e fallbacks.

## 📝 Notas de Desenvolvimento

### Padrões de Código
- **Naming**: Português para domínio de negócio (empresa, estabelecimento, serviço)
- **Database**: Soft delete com `is_active`, timestamps automáticos
- **API**: Responses padronizados, filtros via query parameters
- **Auth**: JWT com refresh token (30min expiry)
- **Relationships**: Bidirecionais no SQLAlchemy

### Convenções
- **Backend**: FastAPI auto-docs (Swagger UI em `/docs`)
- **Frontend**: TypeScript strict mode, Tailwind CSS utility-first
- **Testing**: Pytest para backend, Jest planejado para frontend
- **Git**: Commits em inglês, branches feature/*, bugfix/*

### Development Workflow
1. **Feature Development**: Create feature branch from main
2. **Backend**: Update models → schemas → services → routes → tests
   - **Models**: Define database structure (SQLAlchemy ORM)
   - **Schemas**: Pydantic models for request/response validation
   - **Services**: Business logic layer (validations, calculations, complex queries)
   - **Routes**: FastAPI endpoints (thin, delegate to services)
3. **Frontend**: Update types → services → components → pages
   - **Types**: TypeScript interfaces matching backend schemas
   - **Services**: Axios calls to API endpoints
   - **Components**: Reusable UI building blocks
   - **Pages**: Full page views with data fetching
4. **Database**: Create migration with `alembic revision --autogenerate`
5. **Testing**: Run `pytest` (backend) and `npm run type-check` (frontend)
6. **Integration**: Test full flow with both services running

### Service Layer Pattern (Backend)
Services encapsulate business logic and should be used when:
- ✅ Complex validation logic (e.g., checking appointment conflicts)
- ✅ Multi-model operations (e.g., creating appointment + updating client)
- ✅ Authorization checks (e.g., user belongs to establishment)
- ✅ Data transformations or calculations

**Example**: `agendamento_service.py` handles:
- Conflict detection for appointment times
- Automatic `data_fim` calculation based on service duration
- Establishment-based filtering for users
- Status transitions validation

## 🔧 Implementação Técnica - Calendário

### Backend - AgendamentoService
**Arquivo**: `backend/app/services/agendamento_service.py`

```python
# Lógica corrigida para não sobrescrever data_fim quando fornecido
update_dict = agendamento_data.dict(exclude_unset=True)
if 'data_inicio' in update_dict and update_dict['data_inicio'] and 'data_fim' not in update_dict:
    # Só recalcula data_fim se não foi fornecido explicitamente
    servico = db.query(Servico).filter(Servico.id == agendamento.servico_id).first()
    if servico and servico.duracao_minutos:
        agendamento.data_fim = agendamento_data.data_inicio + timedelta(minutes=servico.duracao_minutos)
```

### Frontend - Handlers de Drag & Drop
**Arquivo**: `frontend/src/pages/AgendamentosPage.tsx`

```tsx
const handleEventResize = async (data: { event: any; start: Date; end: Date }) => {
  try {
    const agendamento = data.event.resource
    const agendamentoData = {
      cliente_id: agendamento.cliente_id,
      servico_id: agendamento.servico_id,
      data_inicio: data.start.toISOString(),
      data_fim: data.end.toISOString(), // Crucial: envia data_fim
      observacoes: agendamento.observacoes,
      valor_desconto: agendamento.valor_desconto
    }

    await agendamentosApi.update(agendamento.id, agendamentoData)
    await queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
    await queryClient.refetchQueries({ queryKey: ['agendamentos'] })
  } catch (error) {
    // Reverte mudanças em caso de erro
    await queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
  }
}
```

### Componente Calendar
**Arquivo**: `frontend/src/components/Calendar.tsx`

```tsx
// Configuração principal do calendário
<DnDCalendar
  localizer={localizer}
  events={events}
  view={view}
  onView={setView}
  selectable
  resizable // Habilita resize
  onSelectSlot={onSelectSlot}
  onSelectEvent={onSelectEvent}
  onEventResize={handleEventResize} // Handler de resize
  onEventDrop={handleEventDrop}     // Handler de drag
  eventPropGetter={eventStyleGetter} // Cores por status
  culture="pt-BR"
  min={new Date(2000, 0, 1, 7, 0)}  // 7:00 AM
  max={new Date(2000, 0, 1, 20, 0)} // 8:00 PM
/>
```

## 🐛 Troubleshooting

### Key Files to Check

**Authentication Issues**:
- `backend/app/api/auth.py` - JWT token generation/validation
- `backend/app/services/auth_service.py` - Login/register logic
- `frontend/src/services/api.ts` - Axios interceptors for auth headers

**Appointment/Calendar Issues**:
- `backend/app/services/agendamento_service.py` - Core business logic
- `frontend/src/pages/AgendamentosPage.tsx` - Drag & drop handlers
- `frontend/src/components/Calendar.tsx` - Calendar component config

**Database/Models Issues**:
- `backend/app/models/` - SQLAlchemy models
- `backend/app/database.py` - Connection config
- `backend/alembic/versions/` - Migration history

**API Communication Issues**:
- `frontend/vite.config.ts` - Proxy configuration
- `backend/main.py` - CORS settings
- Browser DevTools Network tab - Check actual requests

### Problemas Comuns

**Backend não conecta ao banco**:
```bash
# Verificar variável DATABASE_URL no .env
cd backend && python -c "from app.config import settings; print(settings.database_url)"

# Testar conexão
cd backend && python -c "from app.database import engine; engine.connect()"
```

**Frontend não acessa API**:
- Verificar se backend está rodando na porta 8000
- Verificar proxy no `frontend/vite.config.ts`
- Tentar acessar http://localhost:8000/docs diretamente

**Erro de CORS**:
- Verificar `allow_origins` no `backend/main.py`
- Frontend deve rodar na porta 3000

**Migrations falhando**:
```bash
# Ver estado atual
cd backend && alembic current

# Forçar recriação (CUIDADO: perde dados)
cd backend && alembic downgrade base
cd backend && alembic upgrade head
```

### Issues Conhecidas
- Warning bcrypt version (funcional, mas mostra warning)
- Refresh token endpoint não implementado
- ~~Bug: Resize não atualizava duração~~ ✅ **CORRIGIDO**

## 📚 Referencias

- FastAPI: https://fastapi.tiangolo.com/
- SQLAlchemy: https://www.sqlalchemy.org/
- Alembic: https://alembic.sqlalchemy.org/
