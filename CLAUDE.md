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
O projeto usa PostgreSQL hospedado no Render.com. **Credenciais estão hardcoded em `backend/app/database.py`** (não usa arquivo `.env`).

**Connection string format**:
```
postgresql://user:password@host:port/database?sslmode=require
```

### Estrutura Atual
- ✅ **empresas**: Dados da empresa (CNPJ, contato, endereço)
- ✅ **estabelecimentos**: Filiais/locais de atendimento
- ✅ **servicos**: Serviços oferecidos (preço, duração, categoria)
- ✅ **users**: Funcionários com roles (ADMIN, MANAGER, VENDEDOR, ATENDENTE)
- ✅ **clientes**: Dados dos clientes (contato, preferências)
- ✅ **agendamentos**: Appointments com status e valores
- ✅ **materiais**: Estoque de materiais (quantidade, custo unitário)
- ✅ **consumos_materiais**: Registro de uso de materiais por agendamento

### Dados de Teste Populados
- 3 Empresas (Barbearia, Oficina, Pet Shop)
- 4 Estabelecimentos
- 10 Serviços diversos
- 6 Usuários com diferentes roles
- 6 Clientes
- 6 Agendamentos com diferentes status
- Materiais e consumos para relatórios financeiros

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

#### Acesso Total (ADMIN e MANAGER)
- ✅ Agendamentos (criar, editar, deletar, visualizar)
- ✅ Clientes (criar, editar, deletar, visualizar)
- ✅ Serviços (criar, editar, deletar, visualizar)
- ✅ Materiais (criar, editar, deletar, visualizar)
- ✅ Relatórios Financeiros (visualizar)
- ✅ Dashboard completo

#### Acesso Limitado (VENDEDOR e ATENDENTE)
- ✅ Agendamentos (criar, editar, deletar, visualizar)
- ✅ Clientes (criar, editar, deletar, visualizar)
- ❌ Serviços (sem acesso)
- ❌ Materiais (sem acesso)
- ❌ Relatórios Financeiros (sem acesso)

**IMPLEMENTAÇÃO:**
- Backend: Verificação via `check_admin_or_manager()` em `app/utils/permissions.py`
- Frontend: Menus ocultos + rotas protegidas via `RoleProtectedRoute`
- Cada agendamento pertence a um estabelecimento
- Usuários veem/agendam apenas do seu estabelecimento

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

### ✅ Core Features Implementadas
- Autenticação JWT completa com role-based access control
- CRUD completo: Agendamentos, Clientes, Serviços, Materiais
- Calendário drag & drop (React Big Calendar) com resize dinâmico
- Sistema de estoque com rastreamento de consumo por agendamento
- Relatórios financeiros com gráficos interativos (Recharts)
- Multi-estabelecimento com isolamento automático de dados
- Dados de teste populados no banco

### ⚠️ Opcional/Futuro
- CRUD de Estabelecimentos e Empresas (Admin)
- Notificações (email/SMS)
- Exportação de relatórios (PDF/Excel)

## 📅 Funcionalidade de Calendário

### Características
- **React Big Calendar** com drag-and-drop e resize habilitados
- Visualizações: Dia, Semana, Mês
- Eventos coloridos por status, timezone PT-BR
- Drag & drop para alterar horários, resize para ajustar duração
- React Query para cache e atualização em tempo real
- Duração flexível: serviços não têm tempo pré-determinado (15-480 min)

### Implementação Crítica
- **Backend**: `AgendamentoService` só recalcula `data_fim` se não for explicitamente fornecido (evita sobrescrever resize)
- **Frontend**: Handlers em `AgendamentosPage.tsx` enviam `data_fim` explícito em resize/drag
- Componente principal: `Calendar.tsx` com `DnDCalendar` do `react-big-calendar`

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
**ReDoc (Alternative Docs)**: http://localhost:8000/redoc

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
│   │   ├── agendamentos.py # Appointment routes
│   │   ├── materiais.py   # Materials/inventory routes
│   │   └── relatorios.py  # Financial reports routes
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py        # User/Employee model
│   │   ├── empresa.py     # Company model
│   │   ├── estabelecimento.py # Establishment model
│   │   ├── servico.py     # Service model
│   │   ├── cliente.py     # Client model
│   │   ├── agendamento.py # Appointment model
│   │   ├── material.py    # Material/inventory model
│   │   └── consumo_material.py # Material consumption model
│   ├── schemas/           # Pydantic schemas (request/response)
│   ├── services/          # Business logic layer
│   │   ├── auth_service.py
│   │   ├── agendamento_service.py
│   │   ├── cliente_service.py
│   │   ├── servico_service.py
│   │   ├── material_service.py
│   │   └── relatorio_service.py
│   ├── utils/             # Helper utilities
│   │   ├── auth.py        # JWT utilities
│   │   ├── security.py    # Password hashing
│   │   ├── permissions.py # Role-based access control
│   │   └── timezone.py    # Brazil timezone (UTC-3)
│   ├── config.py          # App configuration
│   └── database.py        # Database connection (Render.com)
├── alembic/               # Database migrations
├── tests/                 # Test suites (pytest)
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
│   │   ├── Layout.tsx     # Main app layout with navigation
│   │   ├── ProtectedRoute.tsx # Route protection (authentication)
│   │   ├── RoleProtectedRoute.tsx # Role-based route protection
│   │   ├── Calendar.tsx   # Drag & Drop Calendar component
│   │   ├── AgendamentoModal.tsx # Create/Edit appointment modal
│   │   ├── AgendamentoDetailModal.tsx # Appointment details + consumos
│   │   ├── ClienteModal.tsx # Client form modal
│   │   ├── ClienteHistoricoModal.tsx # Client history view
│   │   ├── ServicoModal.tsx # Service form modal
│   │   ├── MaterialModal.tsx # Material form modal
│   │   └── ConsumoMaterialModal.tsx # Material consumption form
│   ├── pages/             # Page components
│   │   ├── LoginPage.tsx  # Authentication page
│   │   ├── DashboardPage.tsx # Main dashboard
│   │   ├── AgendamentosPage.tsx # Appointments calendar (drag & drop)
│   │   ├── ClientesPage.tsx # Clients CRUD page
│   │   ├── ServicosPage.tsx # Services CRUD page
│   │   ├── MateriaisPage.tsx # Materials/inventory CRUD page
│   │   └── RelatoriosPage.tsx # Financial reports dashboard
│   ├── services/          # API service layer
│   │   └── api.ts         # Axios client + all API calls
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # All shared interfaces/types
│   ├── utils/             # Helper utilities
│   │   ├── formatters.ts  # Currency, date formatting
│   │   └── timezone.ts    # Brazil timezone utilities
│   └── styles/            # Global CSS/Tailwind
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

**Backend** (`backend/app/database.py`):
```python
# Conexão direta com Render.com PostgreSQL (sem .env necessário)
SQLALCHEMY_DATABASE_URL = "postgresql://sasconv_user:d5DezoH9fkvGQvAldNebbIAU0FWcm4Fe@dpg-d2195c6uk2gs7380vemg-a.virginia-postgres.render.com:5432/agenda_db?sslmode=require"
```

**Configurações** (`backend/app/config.py`):
```python
# SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES e outras configs
# Definidas diretamente no código para simplificar setup
```

**Frontend**:
- Vite proxy configurado em `vite.config.ts`
- Não requer `.env`, usa proxy `/api/*` → `http://localhost:8000/*`

**Nota**: O projeto está configurado para funcionar sem arquivos `.env`, facilitando o setup inicial.

## 📝 Notas de Desenvolvimento

### Padrões de Código
- **Naming**: Português para domínio de negócio (empresa, estabelecimento, serviço)
- **Database**: Soft delete com `is_active`, timestamps automáticos
- **API**: Responses padronizados, filtros via query parameters
- **Auth**: JWT com 30min expiry (refresh token não implementado)
- **Relationships**: Bidirecionais no SQLAlchemy
- **Timezone**: Brasil (UTC-3) em todo sistema via `app/utils/timezone.py` e `frontend/src/utils/timezone.ts`

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


## 📊 Sistema de Relatórios Financeiros

### Funcionalidades
- Resumo: receita total, custos, lucro bruto, margem de lucro
- Gráficos: receita diária, lucro por serviço, valor estoque, distribuição custos
- Métricas: taxa conversão, custo médio, ticket médio
- Endpoints: `/relatorios/resumo-financeiro`, `/receita-diaria`, `/lucro-por-servico`, `/consumo-materiais`, `/valor-estoque`

### Integração Estoque
- **Material**: item físico (nome, unidade, quantidade, custo unitário)
- **Consumo**: uso de material em agendamento (atualiza estoque automaticamente)
- Custos calculados a partir dos consumos registrados
- Interface: `RelatoriosPage.tsx`, `MateriaisPage.tsx`, `AgendamentoDetailModal.tsx`

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
# Testar conexão (Windows)
cd backend && python -c "from app.database import engine; print('DB OK')"

# Se falhar, verificar:
# 1. Conexão com internet (banco está no Render.com)
# 2. Credenciais em backend/app/database.py
# 3. SSL/TLS habilitado (sslmode=require)
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
- Banco em Render.com pode hibernar após inatividade (latência no primeiro acesso)
