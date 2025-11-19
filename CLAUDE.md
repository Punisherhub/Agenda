# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agenda OnSell - Sistema de Agendamento Empresarial

## ⚡ Quick Reference

**Start Development**:
```bash
# Recommended: Use provided scripts (starts both services)
start.bat           # Windows
./start.sh          # Linux/Mac

# Manual start (two terminals):
# Terminal 1 - Backend
cd backend && python main.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Access Points**:
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

**Test Users**:
- Admin: `admin@barbeariamoderna.com` / `123456`
- Vendedor: `carlos@barbeariamoderna.com` / `123456`

## 📋 Visão Geral

Sistema de agendamento para empresas prestadoras de serviços como:
- Barbearias
- Oficinas Mecânicas
- Pet Shops
- Salões de Beleza
- E outros serviços

**IMPORTANTE**: Sistema exclusivo para uso interno das empresas (funcionários), não para clientes finais.

## 🏗️ Arquitetura

### Dual Architecture (Desktop + Mobile)

**CRÍTICO**: Este projeto possui DUAS aplicações React completamente separadas que compartilham apenas o backend:

```
main.tsx → AppRouter.tsx (device detection)
           ├─ isMobileDevice() → MobileApp.tsx (frontend/src/mobile/)
           └─ !isMobileDevice() → App.tsx (frontend/src/)
```

**Arquivos de entrada**:
- `frontend/src/main.tsx` - Entry point principal (monta QueryClient e Router)
- `frontend/src/AppRouter.tsx` - Device detection automática e routing
- `frontend/src/App.tsx` - Desktop app (usa lucide-react, date-fns)
- `frontend/src/mobile/MobileApp.tsx` - Mobile app (usa emojis, JavaScript Date)

**Código compartilhado** (APENAS):
- `frontend/src/services/api.ts` - Axios client + todas chamadas API
- `frontend/src/types/index.ts` - TypeScript interfaces
- `frontend/src/utils/` - Formatters e timezone utilities

### Hierarquia de Dados
```
Empresa → Estabelecimento → Serviço → Usuario (Vendedor) → Cliente → Agendamento
```

### Stack Tecnológica
- **Backend**: FastAPI + Python 3.13
- **Banco**: PostgreSQL (Render.com, Virgínia)
- **ORM**: SQLAlchemy 2.0.23
- **Auth**: JWT (python-jose) + bcrypt (passlib)
- **Migrations**: Alembic 1.13.0
- **Frontend**: React 18.2 + TypeScript 5.2.2 (Vite 4.5)
- **Desktop UI**: Lucide React icons, date-fns
- **Mobile UI**: Emojis only, JavaScript Date API only

## 🗄️ Banco de Dados

### Conexão
O projeto usa PostgreSQL hospedado no Render.com. **Credenciais estão configuradas em `backend/app/config.py`** e podem ser sobrescritas via arquivo `.env` (opcional).

**Connection string format**:
```
postgresql://user:password@host:port/database?sslmode=require
```

### Estrutura Atual
- ✅ **empresas**: Dados da empresa (CNPJ, contato, endereço)
- ✅ **estabelecimentos**: Filiais/locais de atendimento
- ✅ **servicos**: Serviços oferecidos (preço, duração, categoria)
- ✅ **users**: Funcionários com roles (ADMIN, MANAGER, VENDEDOR, ATENDENTE)
- ✅ **clientes**: Dados dos clientes (contato, preferências, pontos de fidelidade)
- ✅ **agendamentos**: Appointments com status e valores
- ✅ **materiais**: Estoque de materiais (quantidade, custo unitário)
- ✅ **consumos_materiais**: Registro de uso de materiais por agendamento
- ✅ **configuracao_fidelidade**: Configuração do programa de pontos por estabelecimento
- ✅ **premios**: Catálogo de prêmios resgatáveis com pontos
- ✅ **resgates_premios**: Histórico de resgates de prêmios pelos clientes

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
- **Sistema de Fidelidade**: pontos, prêmios e resgates
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

### Início Rápido (Recomendado)
Use os scripts fornecidos que iniciam backend e frontend simultaneamente:

```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh && ./start.sh
```

Esses scripts abrem automaticamente o backend (porta 8000) e frontend (porta 3000) em terminais separados.

### Backend (API - porta 8000)
```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Executar servidor (0.0.0.0 permite acesso da rede local)
python main.py
# ou
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**API Docs (Swagger)**: http://localhost:8000/docs
**ReDoc (Alternative Docs)**: http://localhost:8000/redoc
**Health Check**: http://localhost:8000/health

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

# Backend - Executar teste específico (arquivo ou função)
cd backend && pytest tests/unit/test_auth.py
cd backend && pytest tests/unit/test_auth.py::test_login_success

# Backend - Testes por diretório
cd backend && pytest tests/unit/
cd backend && pytest tests/integration/

# Backend - Teste com coverage
cd backend && pytest --cov=app --cov-report=html

# Backend - Modo verbose para debug
cd backend && pytest -v
cd backend && pytest -vv  # Extra verbose

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
│   │   ├── relatorios.py  # Financial reports routes
│   │   └── fidelidade.py  # Loyalty program routes
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py        # User/Employee model
│   │   ├── empresa.py     # Company model
│   │   ├── estabelecimento.py # Establishment model
│   │   ├── servico.py     # Service model
│   │   ├── cliente.py     # Client model
│   │   ├── agendamento.py # Appointment model
│   │   ├── material.py    # Material/inventory model
│   │   ├── consumo_material.py # Material consumption model
│   │   ├── configuracao_fidelidade.py # Loyalty config model
│   │   ├── premio.py      # Rewards/prizes model
│   │   └── resgate_premio.py # Prize redemption model
│   ├── schemas/           # Pydantic schemas (request/response)
│   ├── services/          # Business logic layer
│   │   ├── auth_service.py
│   │   ├── agendamento_service.py
│   │   ├── cliente_service.py
│   │   ├── servico_service.py
│   │   ├── material_service.py
│   │   ├── relatorio_service.py
│   │   └── fidelidade_service.py
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
│   │   ├── RelatoriosPage.tsx # Financial reports dashboard
│   │   └── FidelidadePage.tsx # Loyalty program management
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

**Backend** (`backend/app/config.py`):
```python
# Settings via Pydantic BaseSettings
# Valores padrão definidos no código, mas podem ser sobrescritos via .env
class Settings(BaseSettings):
    database_url: str = "postgresql://username:password@localhost:5432/agenda_db"
    secret_key: str = "your-secret-key-here"
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"
    debug: bool = True
    timezone: str = "America/Sao_Paulo"
```

**Arquivo `.env` (opcional)**:
```bash
DATABASE_URL=postgresql://sasconv_user:password@dpg-d2195c6uk2gs7380vemg-a.virginia-postgres.render.com:5432/agenda_db?sslmode=require
SECRET_KEY=your-production-secret-key
DEBUG=False
```

**Frontend**:
- Vite proxy configurado em `vite.config.ts`
- Não requer `.env`, usa proxy `/api/*` → `http://localhost:8000/*`

**Nota**: O projeto funciona sem `.env` usando valores padrão, mas é recomendado criar um `.env` para produção.

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
- **Current Branch**: `main` (também é o branch principal para PRs)

### Development Workflow

**Standard Feature Development**:
1. Work on `main` branch (single developer workflow atual)
2. **Backend Changes**:
   - Models → Schemas → Services → Routes → Tests
   - **Models**: SQLAlchemy ORM (database structure)
   - **Schemas**: Pydantic (request/response validation)
   - **Services**: Business logic (validations, calculations)
   - **Routes**: FastAPI endpoints (thin layer, delegates to services)
3. **Frontend Changes**:
   - Types → Services → Components → Pages
   - **Types**: TypeScript interfaces (match backend schemas)
   - **Services**: API calls (in `services/api.ts`)
   - **Components**: Reusable UI (modals, forms, etc.)
   - **Pages**: Full views with data fetching
4. **Database**: Create migration with `alembic revision --autogenerate -m "description"`
5. **Testing**: Run `pytest` (backend) and `npm run type-check` (frontend)
6. **Integration**: Test full flow with both services running

**Mobile vs Desktop Development**:
- Desktop: Edit files in `frontend/src/pages/`, `frontend/src/components/`
- Mobile: Edit ONLY files in `frontend/src/mobile/`
- Shared: `frontend/src/services/api.ts`, `frontend/src/types/index.ts`, `frontend/src/utils/`
- **NEVER mix**: Don't import desktop components in mobile or vice versa

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

## 🎁 Sistema de Fidelidade

### Visão Geral
Sistema completo de pontos de fidelidade para engajamento de clientes. Clientes acumulam pontos a cada agendamento concluído e podem resgatar prêmios.

### Hierarquia de Dados
```
Estabelecimento → ConfiguracaoFidelidade (regras de pontos)
Estabelecimento → Premio (catálogo de prêmios)
Cliente → Pontos acumulados
Cliente + Premio → ResgatePremio (histórico)
```

### Modelos de Dados

#### ConfiguracaoFidelidade (`backend/app/models/configuracao_fidelidade.py`)
- **reais_por_ponto**: Valor em R$ para ganhar 1 ponto (ex: 100.00 = R$ 100 gastos = 1 ponto)
- **ativo**: Sistema ativo/inativo
- **estabelecimento_id**: FK para estabelecimento
- Um estabelecimento possui apenas UMA configuração ativa

#### Premio (`backend/app/models/premio.py`)
- **nome**: Nome do prêmio (ex: "Corte Grátis")
- **descricao**: Descrição detalhada
- **pontos_necessarios**: Quantos pontos custam
- **quantidade_disponivel**: Estoque do prêmio (null = ilimitado)
- **ativo**: Disponível para resgate
- **estabelecimento_id**: FK para estabelecimento

#### ResgatePremio (`backend/app/models/resgate_premio.py`)
- **cliente_id**: Quem resgatou
- **premio_id**: Qual prêmio
- **pontos_gastos**: Quantos pontos foram debitados
- **data_resgate**: Quando foi resgatado
- **estabelecimento_id**: Onde foi resgatado

### Lógica de Negócio

#### Acúmulo de Pontos (`backend/app/services/fidelidade_service.py`)
1. Quando agendamento muda para status `CONCLUIDO`
2. Sistema verifica se há configuração de fidelidade ativa
3. Calcula: `pontos = floor(valor_final / reais_por_ponto)`
4. Adiciona pontos ao campo `cliente.pontos`

**Exemplo**:
- Configuração: R$ 50.00 = 1 ponto
- Agendamento: R$ 150.00
- Pontos ganhos: 150 / 50 = 3 pontos

#### Resgate de Prêmios
1. Cliente escolhe prêmio (deve ter pontos suficientes)
2. Sistema valida: pontos disponíveis, estoque do prêmio, prêmio ativo
3. Debita pontos do cliente
4. Decrementa quantidade_disponivel (se não for ilimitado)
5. Cria registro em `resgates_premios`
6. **Transação atômica**: se falhar, reverte tudo

### API Endpoints (`backend/app/api/fidelidade.py`)

#### Configuração
- `GET /fidelidade/configuracao` - Busca configuração do estabelecimento
- `POST /fidelidade/configuracao` - Cria configuração (Admin/Manager)
- `PUT /fidelidade/configuracao` - Atualiza configuração (Admin/Manager)

#### Prêmios
- `GET /fidelidade/premios` - Lista prêmios (query param: `incluir_inativos`)
- `POST /fidelidade/premios` - Cria prêmio (Admin/Manager)
- `PUT /fidelidade/premios/{id}` - Atualiza prêmio (Admin/Manager)
- `DELETE /fidelidade/premios/{id}` - Deleta prêmio (Admin/Manager)

#### Resgates
- `POST /fidelidade/resgates` - Cliente resgata prêmio
- `GET /fidelidade/resgates` - Lista resgates (query param: `cliente_id`)
- `GET /fidelidade/premios-disponiveis/{cliente_id}` - Prêmios que cliente pode resgatar

### Frontend (`frontend/src/pages/FidelidadePage.tsx`)

#### Tabs
1. **Configuração**:
   - Form para definir `reais_por_ponto`
   - Toggle ativo/inativo
   - Admin/Manager apenas

2. **Prêmios**:
   - Lista de prêmios cadastrados
   - CRUD completo (nome, descrição, pontos, estoque)
   - Filtro mostrar/ocultar inativos
   - Admin/Manager apenas

#### Componentes
- `FidelidadePage.tsx`: Página principal com tabs
- Modal de criação/edição de prêmios (inline no mesmo arquivo)
- Integração com React Query para cache/invalidação

### Regras de Permissão
- **ADMIN/MANAGER**:
  - ✅ Criar/editar configuração
  - ✅ CRUD completo de prêmios
  - ✅ Visualizar todos os resgates

- **VENDEDOR/ATENDENTE**:
  - ✅ Resgatar prêmios para clientes
  - ✅ Visualizar prêmios disponíveis
  - ❌ Alterar configuração
  - ❌ Criar/editar prêmios

### Integrações

#### Com Agendamentos
- `AgendamentoService.update()` chama `FidelidadeService.processar_pontos()`
- Só acumula pontos se status mudar para `CONCLUIDO`
- Idempotente: não duplica pontos se status já era `CONCLUIDO`

#### Com Clientes
- Tabela `clientes` possui campo `pontos` (Integer, default 0)
- Campo atualizado automaticamente ao concluir agendamento
- Campo debitado ao resgatar prêmio

### Schema de Dados (Pydantic)

**Request/Response** definidos em `backend/app/schemas/fidelidade.py`:
- `ConfiguracaoFidelidadeCreate/Update/Response`
- `PremioCreate/Update/Response`
- `ResgatePremioCreate/Response`
- `PremiosDisponiveisResponse` (prêmios + saldo do cliente)

### Casos de Uso Comuns

**1. Configurar sistema pela primeira vez**:
```bash
POST /fidelidade/configuracao
{
  "reais_por_ponto": 50.00,  # R$ 50 = 1 ponto
  "ativo": true
}
```

**2. Criar prêmio**:
```bash
POST /fidelidade/premios
{
  "nome": "Corte Grátis",
  "descricao": "Um corte de cabelo grátis",
  "pontos_necessarios": 10,
  "quantidade_disponivel": 20,  # ou null para ilimitado
  "ativo": true
}
```

**3. Cliente resgata prêmio**:
```bash
POST /fidelidade/resgates
{
  "cliente_id": 123,
  "premio_id": 456
}
```

### Troubleshooting

**Cliente não está ganhando pontos**:
1. Verificar se configuração está ativa: `GET /fidelidade/configuracao`
2. Verificar se agendamento foi marcado como `CONCLUIDO`
3. Checar logs do backend para erros em `processar_pontos()`

**Erro ao resgatar prêmio**:
- "Pontos insuficientes" → Cliente não tem pontos suficientes
- "Prêmio indisponível" → Estoque zerado ou prêmio inativo
- "Configuração não encontrada" → Sistema de fidelidade não configurado

**Arquivos importantes**:
- `backend/app/services/fidelidade_service.py` - Core business logic
- `backend/app/api/fidelidade.py` - API endpoints
- `backend/app/models/configuracao_fidelidade.py` - Model de configuração
- `backend/app/models/premio.py` - Model de prêmio
- `backend/app/models/resgate_premio.py` - Model de resgate
- `backend/app/models/cliente.py:XX` - Campo `pontos` adicionado
- `frontend/src/pages/FidelidadePage.tsx` - Interface de gerenciamento

## 🐛 Troubleshooting

### Quick File Reference

**Entry Points & Configuration**:
- `backend/main.py:1` - Backend app startup, CORS config
- `backend/app/config.py:1` - Settings (DB URL, JWT secret, timezone)
- `backend/app/database.py:1` - PostgreSQL connection config
- `frontend/src/main.tsx:1` - Frontend entry point
- `frontend/src/AppRouter.tsx:1` - Device detection routing (CRITICAL for mobile/desktop split)
- `frontend/vite.config.ts:1` - Vite proxy config (/api/* → localhost:8000/*)

**Authentication Issues**:
- `backend/app/api/auth.py:1` - JWT token generation/validation routes
- `backend/app/services/auth_service.py:1` - Login/register business logic
- `backend/app/utils/auth.py:1` - JWT creation/verification utilities
- `backend/app/utils/security.py:1` - Password hashing (bcrypt)
- `frontend/src/services/api.ts:15` - Axios interceptors (auto-inject JWT, handle 401)
- `frontend/src/components/ProtectedRoute.tsx:1` - Desktop auth guard
- `frontend/src/mobile/components/MobileProtectedRoute.tsx:1` - Mobile auth guard

**Role/Permission Issues**:
- `backend/app/utils/permissions.py:1` - RBAC helpers (check_admin_or_manager)
- `backend/app/models/user.py:7` - UserRole enum (ADMIN, MANAGER, VENDEDOR, ATENDENTE)
- `frontend/src/components/RoleProtectedRoute.tsx:1` - Role-based route guard

**Appointment/Calendar Issues**:
- `backend/app/services/agendamento_service.py:1` - Core appointment business logic
- `backend/app/api/agendamentos.py:1` - Appointment API endpoints
- `backend/app/models/agendamento.py:1` - Agendamento SQLAlchemy model
- `frontend/src/pages/AgendamentosPage.tsx:1` - Calendar page with drag & drop handlers
- `frontend/src/components/Calendar.tsx:1` - React Big Calendar config (DnD enabled)
- `frontend/src/components/AgendamentoModal.tsx:1` - Create/edit appointment modal
- `frontend/src/components/AgendamentoDetailModal.tsx:1` - View details + material consumption

**Database/Models Issues**:
- `backend/app/models/` - All SQLAlchemy models (8 tables)
- `backend/alembic/versions/` - Migration history (6 migrations)
- `backend/alembic/env.py:1` - Alembic configuration

**API Communication Issues**:
- `frontend/src/services/api.ts:1` - All API calls definition (Axios client)
- Browser DevTools Network tab - Inspect actual requests

**Mobile-Specific Issues**:
- `frontend/src/utils/deviceDetector.ts:1` - Mobile device detection (regex userAgent)
- `frontend/src/mobile/MobileApp.tsx:1` - Mobile app entry point
- `frontend/src/mobile/layouts/MobileLayout.tsx:1` - Mobile layout with bottom nav (6 buttons)

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

---

# 📱 VERSÃO MOBILE

## 🎯 Arquitetura Mobile

### Princípio Fundamental: **SEPARAÇÃO TOTAL DE CÓDIGO**

**CRÍTICO**: Mobile e Desktop são 100% separados. **NUNCA** misturar componentes.

```
✅ CORRETO:
- Mobile usa: frontend/src/mobile/*
- Desktop usa: frontend/src/pages/* e frontend/src/components/*
- Compartilhado: frontend/src/services/api.ts, frontend/src/types/

❌ ERRADO:
- Usar lucide-react no mobile
- Importar componentes desktop no mobile
- Usar date-fns no mobile
- Misturar MobileLayout com Layout desktop
```

### Detecção de Dispositivo

**AppRouter.tsx** detecta dispositivo AUTOMATICAMENTE e renderiza app apropriado:
```typescript
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// Renderiza MobileApp ou App (desktop)
// Usuário não precisa escolher - detecção é transparente
// Se dispositivo mudar (resize), página recarrega automaticamente
```

**IMPORTANTE**:
- A detecção é feita em `frontend/src/utils/deviceDetector.ts`
- O roteamento acontece em `frontend/src/AppRouter.tsx` (não em main.tsx ou App.tsx)
- Ambas versões compartilham apenas: QueryClient, Router, `services/api.ts`, e `types/`

## 🏗️ Estrutura Mobile

```
frontend/src/mobile/
├── MobileApp.tsx              # Router mobile (rotas separadas)
├── layouts/
│   └── MobileLayout.tsx       # Layout com bottom navigation (6 botões)
├── components/
│   ├── MobileProtectedRoute.tsx    # Auth guard
│   ├── MobileFAB.tsx               # Floating Action Button
│   ├── MobileModal.tsx             # Fullscreen modal
│   └── MobileSearchBar.tsx         # Search input
├── pages/
│   ├── MobileLoginPage.tsx         # ✅ Login funcional
│   ├── MobileDashboardPage.tsx     # ✅ Dashboard com API real
│   ├── MobileAgendamentosPage.tsx  # ✅ CRUD completo (mock)
│   ├── MobileClientesPage.tsx      # ✅ CRUD completo (mock)
│   ├── MobileServicosPage.tsx      # ✅ Visualização (mock)
│   ├── MobileMateriaisPage.tsx     # ✅ Visualização (mock)
│   └── MobileRelatoriosPage.tsx    # ✅ Visualização (mock)
```

## ⚠️ PROBLEMAS CRÍTICOS DESCOBERTOS

### 1. 🚫 **lucide-react NÃO FUNCIONA NO MOBILE**

**Sintoma**: Tela branca ao usar qualquer ícone de lucide-react
**Solução**: Usar APENAS emojis

```tsx
// ❌ NUNCA FAZER NO MOBILE:
import { Calendar, User, Search } from 'lucide-react'
<Calendar className="w-5 h-5" />

// ✅ SEMPRE FAZER NO MOBILE:
<span className="text-2xl">📅</span>
<span className="text-xl">👤</span>
<span className="text-lg">🔍</span>
```

**Emojis usados no mobile**:
- 🏠 Início
- 📅 Agenda
- 👥 Clientes
- ⚙️ Serviços
- 📦 Materiais
- 📊 Relatórios
- 🚪 Sair
- 🔍 Buscar
- ➕ Adicionar
- 🗑️ Deletar
- ✂️ Corte
- 🧔 Barba
- 💈 Combo
- 💰 Receita
- 📈 Lucro
- ⚠️ Alerta
- 🕐 Relógio

### 2. 🚫 **date-fns QUEBRA NO MOBILE**

**Sintoma**: Tela branca ao usar `format()` de date-fns
**Solução**: Usar JavaScript puro

```tsx
// ❌ NUNCA FAZER NO MOBILE:
import { format } from 'date-fns'
format(new Date(), 'dd/MM/yyyy')
format(new Date(), 'HH:mm')

// ✅ SEMPRE FAZER NO MOBILE:
// Data: YYYY-MM-DD
const dataHoje = new Date().toISOString().split('T')[0]

// Hora: HH:mm
const formatHora = (dateString: string) => {
  const date = new Date(dateString)
  const horas = date.getHours().toString().padStart(2, '0')
  const minutos = date.getMinutes().toString().padStart(2, '0')
  return `${horas}:${minutos}`
}
```

### 3. 🚫 **Conversão de Tipos: preco.toFixed() quebra**

**Sintoma**: Tela branca com erro "preco.toFixed is not a function"
**Causa**: API retorna `preco` como **string** (`"50.00"`), não como número
**Solução**: SEMPRE converter para número antes de usar `.toFixed()`

```tsx
// ❌ NUNCA FAZER NO MOBILE:
{servico.preco.toFixed(2)}
{servico.preco?.toFixed(2)}

// ✅ SEMPRE FAZER NO MOBILE:
{Number(servico.preco || 0).toFixed(2)}
```

**Regra Geral**: Qualquer campo numérico da API (preco, valor_total, quantidade, etc.) deve ser convertido com `Number()` antes de usar métodos numéricos.

### 4. 🚫 **relatoriosApi.getDashboard() QUEBRA NO MOBILE**

**Sintoma**: Dashboard fica branco ao adicionar API de relatórios
**Status**: Não investigado a fundo
**Solução temporária**: Manter dados mock para receita/lucro

## 📱 Componentes Mobile Reutilizáveis

### MobileLayout
- Header fixo com logo e botão logout
- Bottom navigation com 6 botões (grid-cols-6)
- Navegação: Início, Agenda, Clientes, Serviços, Materiais, Relatórios
- Botão logout no header (🚪)
- Z-index correto para navegação sobrepor conteúdo

### MobileFAB (Floating Action Button)
```tsx
<MobileFAB onClick={() => handleCreate()} emoji="➕" />
// Botão redondo no bottom-right com emoji customizável
```

### MobileModal
```tsx
<MobileModal isOpen={isOpen} onClose={handleClose} title="Título">
  <form>...</form>
</MobileModal>
// Modal fullscreen, previne scroll do body, header azul
```

### MobileSearchBar
```tsx
<MobileSearchBar
  value={search}
  onChange={setSearch}
  placeholder="Buscar..."
/>
// Input com ícone 🔍, botão clear (✕)
```

## 📄 Páginas Mobile - Estado Atual

### ✅ MobileDashboardPage
**Status**: Parcialmente funcional com API real

**Funciona:**
- ✅ Agendamentos de hoje (API real via `agendamentosApi.list()`)
- ✅ Lista de agendamentos com dados do banco
- ✅ Horários formatados (JavaScript puro)
- ✅ Status coloridos
- ✅ Loading states

**Mock (temporário):**
- Receita: R$ 12.500
- Lucro: R$ 10.200
- Materiais com estoque baixo

**Componentes:**
- Header: "Olá! Dashboard"
- 2 botões ações rápidas (Novo Agendamento, Buscar Cliente)
- 3 cards métricas
- Lista agendamentos
- Alerta materiais baixo estoque

### ✅ MobileAgendamentosPage
**Status**: CRUD completo com mock data

**Features:**
- Date picker com navegação (◀️ ▶️)
- Lista agendamentos do dia selecionado
- Modal fullscreen para criar/editar
- Status badges coloridos
- Auto-fill preço ao selecionar serviço
- Resumo diário (total agendamentos + receita)
- FAB para criar novo

**Dados**: 4 agendamentos mock (3 hoje, 1 ontem)

### ✅ MobileClientesPage
**Status**: CRUD completo com mock data

**Features:**
- Search bar
- Lista de clientes
- Modal para criar/editar (nome, telefone, email)
- Delete com confirmação
- Última visita exibida
- FAB para criar novo

**Dados**: 5 clientes mock

### ✅ MobileServicosPage
**Status**: Visualização apenas (mock data)

**Features:**
- Lista simplificada de serviços
- Mostra: emoji categoria, nome, descrição, preço
- 3 serviços mock (Corte, Barba, Combo)

**Pendente**: CRUD completo, integração API

### ✅ MobileMateriaisPage
**Status**: Visualização apenas (mock data)

**Features:**
- Alerta de estoque baixo (⚠️)
- Valor total em estoque
- Lista materiais com status
- 3 materiais mock

**Pendente**: CRUD completo, integração API

### ✅ MobileRelatoriosPage
**Status**: Visualização apenas (mock data)

**Features:**
- Card receita total
- Cards lucro e margem
- Métricas desempenho
- Aviso "Dados Simulados"

**Pendente**: Integração API real

## 🧪 Como Testar em Dispositivo Real

### 1. Configurar Vite para Rede

**frontend/vite.config.ts**:
```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0',  // CRÍTICO: permite acesso externo
    port: 3000,
    // ...proxy config
  }
})
```

### 2. Configurar CORS

**backend/main.py**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Desenvolvimento: permite todos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Descobrir IP Local

**Windows**:
```bash
ipconfig
# Procurar "IPv4 Address" da rede Wi-Fi
```

**Linux/Mac**:
```bash
ifconfig
# ou
ip addr show
```

### 4. Acessar do Celular

1. **Conectar** celular na mesma rede Wi-Fi que o PC
2. **Abrir** navegador no celular
3. **Acessar**: `http://SEU_IP:3000`
   - Exemplo: `http://192.168.1.100:3000`

### 5. Troubleshooting

**Firewall bloqueando**:
- Windows: Permitir porta 3000 no firewall
- Testar: `ping SEU_IP` do celular

**Backend não acessível**:
- Verificar se backend está rodando
- Testar: `http://SEU_IP:8000/docs`

## 🎨 Design Patterns Mobile

### Touch-Friendly
- Botões mínimo 44px altura
- Fonte mínimo 16px (evita zoom iOS)
- Espaçamento generoso (p-4, gap-3)
- Active states: `active:bg-gray-100`

### Layout
- Bottom navigation fixo (z-20)
- Content padding-bottom: pb-20 (evita sobreposição nav)
- Fullscreen modals (fixed inset-0)
- Grid responsivo (grid-cols-2, grid-cols-3)

### Cores e Estados
```tsx
// Status de agendamento
AGENDADO: 'bg-blue-100 text-blue-800'
CONFIRMADO: 'bg-green-100 text-green-800'
EM_ANDAMENTO: 'bg-yellow-100 text-yellow-800'
CONCLUIDO: 'bg-emerald-100 text-emerald-800'
CANCELADO: 'bg-red-100 text-red-800'

// Estoque
EM_ESTOQUE: 'bg-green-100 text-green-800'
ESTOQUE_BAIXO: 'bg-yellow-100 text-yellow-800'
SEM_ESTOQUE: 'bg-red-100 text-red-800'
```

## 🔧 Configuração Vite para Mobile

**frontend/vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Permite acesso de dispositivos na rede
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

## 📝 Próximos Passos Mobile

### Alta Prioridade
1. **Dashboard**: Adicionar API de materiais com estoque baixo (sem date-fns)
2. **Dashboard**: Tentar adicionar nome usuário no header (sem date-fns)
3. **Agendamentos**: Converter de mock para API real
4. **Clientes**: Converter de mock para API real

### Média Prioridade
5. **Serviços**: Implementar CRUD completo + API
6. **Materiais**: Implementar CRUD completo + API
7. **Relatórios**: Investigar porque API quebra, implementar versão mobile-safe

### Baixa Prioridade
8. Melhorar UX (loading skeletons, pull-to-refresh)
9. Adicionar validações nos forms
10. Toast notifications
11. Offline support (service worker)

## ⚠️ Regras Críticas Mobile

### ✅ SEMPRE
- Usar emojis ao invés de lucide-react
- Usar JavaScript puro para datas (sem date-fns)
- Testar em dispositivo real antes de considerar pronto
- Manter código 100% separado do desktop
- Usar `active:` states em vez de `hover:` (touch)
- Padding-bottom adequado para bottom nav

### ❌ NUNCA
- Importar lucide-react em qualquer arquivo mobile
- Usar date-fns (format, subDays, etc.) no mobile
- Misturar componentes mobile e desktop
- Assumir que funciona no mobile porque funciona no desktop
- Usar hover states (não existe touch hover)

## 🐛 Debugging Mobile

### Tela Branca?
1. Verificar console do navegador mobile (Chrome Remote Debug)
2. Remover última alteração
3. Procurar por lucide-react imports
4. Procurar por date-fns imports
5. Verificar se API está retornando erro

### API não funciona?
1. Verificar network tab (Chrome Remote Debug)
2. Testar endpoint direto: `http://SEU_IP:8000/docs`
3. Verificar CORS no backend
4. Verificar se celular está na mesma rede

### Layout quebrado?
1. Verificar z-index (bottom nav deve ser z-20)
2. Verificar padding-bottom (content deve ter pb-20)
3. Testar em diferentes tamanhos de tela
4. Verificar overflow (modals devem ter overflow-y-auto)

## 📚 Referências Mobile

**Componentes Base**:
- `frontend/src/mobile/layouts/MobileLayout.tsx` - Base de todos os pages
- `frontend/src/mobile/components/MobileFAB.tsx` - Padrão de FAB
- `frontend/src/mobile/components/MobileModal.tsx` - Padrão de modal
- `frontend/src/mobile/pages/MobileClientesPage.tsx` - Exemplo completo CRUD
- `frontend/src/mobile/pages/MobileDashboardPage.tsx` - Exemplo API real

**Evitar Problemas**:
- **NUNCA** copiar código do desktop sem adaptar
- **SEMPRE** verificar imports (sem lucide-react, sem date-fns)
- **TESTAR** em dispositivo real frequentemente
