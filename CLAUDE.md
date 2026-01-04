# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agenda OnSell - Sistema de Agendamento Empresarial

## 🚨 **CRITICAL SECURITY ISSUE - READ FIRST!**

**⚠️ IMMEDIATE ACTION REQUIRED:**

The following files contain **EXPOSED PRODUCTION DATABASE CREDENTIALS**:
- `backend/README.md` (lines 26-33) - Contains hardcoded credentials in documentation
- `backend/app/config.py` (line 10) - Contains hardcoded credentials in code

**Emergency Fix Steps:**
1. **Rotate database credentials immediately** (change password on Render.com)
2. **Remove credentials from backend/README.md** - Replace with `.env` instructions
3. **Update backend/app/config.py** - Remove hardcoded default, require environment variable
4. **Create .env file** (already gitignored) - Store credentials there only
5. **Never commit credentials again** - Use config.py pattern with .env overrides

**Proper Pattern:**
```python
# config.py - CORRECT way
database_url: str = os.getenv("DATABASE_URL")  # No default with credentials!

# .env file (gitignored) - ONLY place for real credentials
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
```

---

## 📑 Table of Contents

1. [Quick Reference](#-quick-reference) - Start here for common commands
2. [Critical Don'ts](#-critical-donts-read-this-first) - Prevent common mistakes
3. [Architecture Overview](#-architecture-overview) - System design and structure
4. [Database](#-database) - Schema, migrations, connection
5. [Authentication & Permissions](#-authentication--permissions) - JWT, roles, RBAC
6. [Key Features](#-key-features) - Core functionality documentation
7. [Development Workflow](#-development-workflow) - How to build features
8. [Mobile Version](#-mobile-version) - Critical mobile-specific guidance
9. [Troubleshooting](#-troubleshooting) - Common issues and solutions

---

## ⚡ Quick Reference

### Start Development
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

### Access Points
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Test Users
- **Suporte**: `eduardo@suporte.com` / `suporte123` (cross-empresa access)
- **Admin**: `admin@barbeariamoderna.com` / `123456`
- **Vendedor**: `carlos@barbeariamoderna.com` / `123456`

### Most Common Commands
```bash
# Initial Setup
cd backend && pip install -r requirements.txt    # Install backend dependencies
cd frontend && npm install                       # Install frontend dependencies

# Database
cd backend && alembic upgrade head              # Apply migrations
cd backend && alembic revision --autogenerate -m "description"  # Create migration
cd backend && alembic current                    # Check current version

# Testing
cd backend && pytest                             # Run backend tests
cd backend && pytest tests/unit/test_auth.py     # Run specific test
cd frontend && npm run type-check                # Frontend type check

# Build
cd frontend && npm run build                     # Production build
```

---

## 🚨 Critical Don'ts (Read This First!)

### Security & Database
- ❌ **NEVER** commit credentials to git → Always use `.env` (gitignored)
- ❌ **NEVER** document credentials in code/README → See security warning at top
- ❌ **NEVER** run migrations without backup in production
- ❌ **NEVER** hard delete records → Use soft delete (`is_active`, `deleted_at`)
- ❌ **NEVER** query without tenant filtering (except SUPORTE role)
- ❌ **NEVER** return passwords in API responses → Exclude in schemas

### Mobile Development
- ❌ **NEVER** use `lucide-react` in mobile files → Use emojis instead
- ❌ **NEVER** use `date-fns` in mobile → Use JavaScript `Date` API only
- ❌ **NEVER** import desktop components in mobile or vice versa
- ❌ **NEVER** use `hover:` states in mobile → Use `active:` for touch

### Code Patterns
- ❌ **NEVER** put business logic in API routes → Use service layer
- ❌ **NEVER** hardcode configuration values → Use database or environment variables

### WhatsApp Integration
- ❌ **NEVER** hardcode WhatsApp API credentials → Use database whatsapp_configs table
- ❌ **NEVER** hardcode phone numbers → Always use database cliente.telefone field
- ❌ **NEVER** commit evolution-api/ folder → Intentionally excluded, experimental
- ✅ **USE** WAHA for free WhatsApp → See INTEGRACAO_WAHA_COMPLETA.md for setup
- ✅ **BOTH** Evolution API and WAHA supported → Choose based on needs

---

## 📋 Project Overview

**Purpose**: Enterprise appointment scheduling system for service businesses (barbershops, auto repair, pet shops, salons).

**Key Characteristic**: **Internal use only** (employees), NOT customer-facing.

### Data Hierarchy
```
Empresa (Company)
  → Estabelecimento (Branch)
      → Usuario (Employee) + Servico (Service) + Material (Inventory) + Cliente (Customer)
          → Agendamento (Appointment)
              → ConsumoMaterial (Material Usage)
```

### Tech Stack
- **Backend**: FastAPI 0.104.1 + Python 3.13, PostgreSQL (Render.com), SQLAlchemy 2.0.23
- **Auth**: JWT (python-jose) + bcrypt, 30min token expiry
- **Migrations**: Alembic 1.13.0
- **Frontend**: React 18.2 + TypeScript 5.2.2, Vite 4.5
- **Desktop UI**: Lucide React, date-fns, React Big Calendar, Recharts
- **Mobile UI**: Emojis only, JavaScript Date API only, Heroicons (bottom nav)
- **State**: TanStack React Query 5.8.0 (server state), React Hook Form (forms)

---

## 🏗️ Architecture Overview

### Dual Architecture: Desktop + Mobile

**CRITICAL**: This project has **TWO completely separate React apps** sharing only the backend.

```
main.tsx
  → AppRouter.tsx (device detection via user-agent)
      ├─ isMobileDevice() → MobileApp.tsx (frontend/src/mobile/)
      └─ !isMobileDevice() → App.tsx (frontend/src/)
```

**Shared Code (ONLY these)**:
- `frontend/src/services/api.ts` - All API calls (Axios client)
- `frontend/src/types/index.ts` - TypeScript interfaces
- `frontend/src/utils/` - Formatters, timezone utilities

**Device Detection**: Automatic via `AppRouter.tsx` based on user-agent regex. Page reloads if device type changes.

### Backend: Layered Architecture

**Pattern**: `API Routes → Services → Models → Database`

```
backend/app/
├── api/               # FastAPI route handlers (thin, delegate to services)
├── services/          # Business logic layer (validations, calculations)
├── models/            # SQLAlchemy ORM models
├── schemas/           # Pydantic request/response validation
├── utils/             # Auth, permissions, timezone helpers
├── config.py          # Settings (DB URL, JWT secret via Pydantic)
└── database.py        # PostgreSQL connection pool
```

**Key Services**:
- `AuthService` - User authentication, JWT tokens
- `AgendamentoService` - Appointments, conflict detection, timezone
- `FidelidadeService` - Loyalty points, rewards redemption
- `RelatorioService` - Financial reports, cost calculations

### Frontend: Component-Based with Dual Apps

**Desktop** (`frontend/src/`):
```
pages/                 # Full page views (Dashboard, Agendamentos, etc.)
components/            # Reusable UI (Calendar, Modals, etc.)
```

**Mobile** (`frontend/src/mobile/`):
```
mobile/
├── MobileApp.tsx              # Mobile router
├── pages/                     # Mobile pages (completely separate)
├── components/                # Mobile components (FAB, Modal, etc.)
└── layouts/MobileLayout.tsx   # Bottom navigation (6 buttons)
```

**Vite Proxy** (Development):
- Frontend calls: `axios.get('/api/agendamentos')`
- Vite proxies: `/api/*` → `http://localhost:8000/*`
- Configured in: `frontend/vite.config.ts`

### Data Flow
```
User Action
  → React Component
    → API Service (api.ts)
      → FastAPI Route
        → Service Layer
          → SQLAlchemy Model
            → PostgreSQL
              → Response Chain (reverse)
```

---

## 🗄️ Database

### Connection
PostgreSQL hosted on **Render.com** (Virginia region).

**Configuration**: `backend/app/config.py` (Pydantic Settings)
- Defaults are defined in code
- Override via `.env` file (create if needed, gitignored)

**Connection String Format**:
```
postgresql://user:password@host:port/database?sslmode=require
```

**Test Connection** (Windows):
```bash
cd backend && python -c "from app.database import engine; print('DB OK')"
```

### Schema (14 Core Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **empresas** | Companies | CNPJ, razao_social, contato |
| **estabelecimentos** | Branches | nome, endereco, horario_funcionamento |
| **users** | Employees | email, senha_hash, role, estabelecimento_id |
| **servicos** | Service catalog | nome, preco, duracao_minutos, categoria |
| **clientes** | Customers | nome, telefone, email, **pontos** (loyalty) |
| **agendamentos** | Appointments | data_inicio, data_fim, status, valor_final, **deleted_at** |
| **materiais** | Inventory | nome, unidade, quantidade, custo_unitario |
| **consumos_materiais** | Material usage | agendamento_id, material_id, quantidade |
| **configuracao_fidelidade** | Loyalty config | reais_por_ponto, ativo |
| **premios** | Rewards catalog | nome, pontos_necessarios, quantidade_disponivel |
| **resgates_premios** | Reward redemptions | cliente_id, premio_id, pontos_gastos |
| **whatsapp_configs** | WhatsApp settings | evolution_api_url, waha_url, waha_api_key, templates, estabelecimento_id |
| **whatsapp_messages** | Message history | message_id, from_number, body, session_name, estabelecimento_id |

### Important Patterns

**Soft Delete**:
- `is_active` boolean (users, clientes, materiais, servicos)
- `deleted_at` timestamp (agendamentos)
- Always filter: `Model.is_active == True` or `Model.deleted_at.is_(None)`

**Cascade Delete**: All foreign keys have `ondelete="CASCADE"` for atomic operations.

**Timestamps**: All models auto-populate `created_at`, `updated_at` with Brazil timezone.

**Tenant Isolation**: All queries auto-filtered by `current_user.estabelecimento_id` (except SUPORTE role).

### Migrations (Alembic)

```bash
cd backend

# View current version
alembic current

# View migration history
alembic history

# Create new migration (auto-detects model changes)
alembic revision --autogenerate -m "Add new feature"

# Apply all pending migrations
alembic upgrade head

# Rollback one version
alembic downgrade -1

# Rollback to specific version
alembic downgrade <revision_id>
```

**Migration Status**: Check current migration with `alembic current`. Latest migration: `b1a2c3d4e5f6` - adds WAHA support, whatsapp_messages table, makes Evolution API fields optional.

**Utility Scripts** (backend/): Helper scripts for database management:
- `create_suporte_inicial.py` - Creates SUPORTE role user
- `create_all_tables.py` - Force creates all tables (emergency use only)
- `create_enums.py` / `drop_enums.py` - Enum type management
- `mark_migration.py` - Marks migration without running
- `database-recovery/` - Database recovery scripts and backups

---

## 🔐 Authentication & Permissions

### JWT Flow

1. User posts to `POST /auth/login` with `username` (email) + `password`
2. Backend validates with bcrypt, generates JWT token (30min expiry)
3. Returns `{access_token, refresh_token, user: {...}}`
4. Frontend stores in `localStorage['access_token']`
5. Axios interceptor injects: `Authorization: Bearer <token>` on all requests
6. Expired tokens (401) → auto-redirect to login

### Role-Based Access Control (RBAC)

```python
class UserRole(enum.Enum):
    SUPORTE = "suporte"       # Cross-company superadmin
    ADMIN = "admin"           # Company admin
    MANAGER = "manager"       # Branch manager
    VENDEDOR = "vendedor"     # Salesperson
    ATENDENTE = "atendente"   # Receptionist
```

### Permission Matrix

| Feature | SUPORTE | ADMIN | MANAGER | VENDEDOR | ATENDENTE |
|---------|---------|-------|---------|----------|-----------|
| Cross-company access | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agendamentos (CRUD) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clientes (CRUD) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Serviços (CRUD) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Materiais (CRUD) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Relatórios Financeiros | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fidelidade (config) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Fidelidade (resgates) | ✅ | ✅ | ✅ | ✅ | ✅ |

### Implementation

**Backend**:
- Permission checks: `backend/app/utils/permissions.py`
  - `check_admin_or_manager(current_user)` - Raises 403 if unauthorized
- Role enum: `backend/app/models/user.py:8`

**Frontend**:
- Route protection: `frontend/src/components/RoleProtectedRoute.tsx`
- Auth guard: `frontend/src/components/ProtectedRoute.tsx`
- Menus hidden based on role

### SUPORTE Role (Special)

**Purpose**: Technical support with cross-company access.

**Access**:
- View/edit ALL companies and establishments
- Manage users across any company
- No `estabelecimento_id` filter (null value)
- Dedicated UI: `frontend/src/pages/SuportePage.tsx` (route: `/suporte`)

**Credentials**: `eduardo@suporte.com` / `suporte123`

**Create New Support User**:
```bash
cd backend && python create_suporte_user.py
```

---

## 🎯 Key Features

### 1. Appointment System (Agendamentos)

**Core Functionality**:
- CRUD operations with tenant isolation
- Custom services (without predefined service)
- Drag & drop calendar (React Big Calendar)
- Conflict detection (same user, overlapping times)
- Status lifecycle management
- Soft delete (`deleted_at`)

**Status Flow**:
```
AGENDADO → CONFIRMADO → EM_ANDAMENTO → CONCLUIDO → (loyalty points awarded)
           ↓                ↓
        CANCELADO    NAO_COMPARECEU
```

**Custom Services**: Support service-less appointments with:
- `servico_personalizado: boolean`
- `servico_personalizado_nome: string`
- `servico_personalizado_descricao: text`
- `valor_servico_personalizado: decimal`

**Calendar (Desktop)**:
- Component: `frontend/src/components/Calendar.tsx`
- Drag & drop enabled (updates `data_inicio`, `data_fim`)
- Resize enabled (updates `data_fim` only)
- Views: Day, Week, Month
- Brazil timezone (UTC-3)

**Important**: When dragging/resizing, frontend MUST send explicit `data_fim` to prevent backend recalculation.

**API Endpoints**:
```
GET    /agendamentos/              # List (filters: date range, status, cliente_id)
POST   /agendamentos/              # Create
PUT    /agendamentos/{id}          # Update
PATCH  /agendamentos/{id}/status   # Change status
DELETE /agendamentos/{id}          # Soft delete
GET    /agendamentos/calendario    # Calendar view
```

**Files**:
- Backend: `backend/app/services/agendamento_service.py`
- API: `backend/app/api/agendamentos.py`
- Model: `backend/app/models/agendamento.py`
- Frontend: `frontend/src/pages/AgendamentosPage.tsx`
- Calendar: `frontend/src/components/Calendar.tsx`
- Modal: `frontend/src/components/AgendamentoModal.tsx`

### 2. Loyalty Program (Fidelidade)

**Three-Tier System**:

1. **Configuration** (`ConfiguracaoFidelidade`)
   - Exchange rate: R$ amount → 1 point
   - Example: R$ 50 = 1 point
   - One config per establishment

2. **Rewards** (`Premio`)
   - Points cost, optional stock limit
   - Types: discount %, fixed discount, free service, product

3. **Redemptions** (`ResgatePremio`)
   - Customer spends points
   - Inventory decremented (if limited)
   - Transactional (atomic)

**Point Accrual** (Automatic):
- Triggered when appointment status → `CONCLUIDO`
- Formula: `points = floor(valor_final / reais_por_ponto)`
- Example: R$ 150 appointment with R$ 50/point = 3 points
- Updates: `cliente.pontos` field
- **Idempotent**: Won't duplicate points if status already `CONCLUIDO`

**Redemption Flow**:
1. Validate: customer has points, reward active, stock available
2. Debit customer points
3. Decrement reward stock (if not unlimited)
4. Create `ResgatePremio` record
5. **All-or-nothing transaction** (rollback on error)

**API Endpoints**:
```
# Configuration
GET  /fidelidade/configuracao           # Get config
POST /fidelidade/configuracao           # Create (Admin/Manager)
PUT  /fidelidade/configuracao           # Update (Admin/Manager)

# Rewards
GET    /fidelidade/premios              # List (query: incluir_inativos)
POST   /fidelidade/premios              # Create (Admin/Manager)
PUT    /fidelidade/premios/{id}         # Update (Admin/Manager)
DELETE /fidelidade/premios/{id}         # Delete (Admin/Manager)

# Redemptions
POST /fidelidade/resgates               # Redeem reward
GET  /fidelidade/resgates               # List (query: cliente_id)
GET  /fidelidade/premios-disponiveis/{cliente_id}  # Available rewards
```

**Files**:
- Backend: `backend/app/services/fidelidade_service.py`
- API: `backend/app/api/fidelidade.py`
- Models: `backend/app/models/configuracao_fidelidade.py`, `premio.py`, `resgate_premio.py`
- Frontend: `frontend/src/pages/FidelidadePage.tsx`

### 3. Inventory Management (Materiais)

**Features**:
- Multiple units: ML (liquids), UNIDADE (items), GRAMA (solids), CM (length)
- Tracks: quantity, unit cost, min threshold, supplier
- Status: active/inactive (`is_active`)

**Material Consumption**:
- Manual recording per appointment
- Captures: quantity consumed, unit cost snapshot, total cost
- Auto-updates remaining inventory
- Used for financial report cost calculations

**Files**:
- Backend: `backend/app/services/material_service.py`
- API: `backend/app/api/materiais.py`
- Models: `backend/app/models/material.py`, `consumo_material.py`
- Frontend: `frontend/src/pages/MateriaisPage.tsx`
- Consumption Modal: `frontend/src/components/ConsumoMaterialModal.tsx`

### 4. Financial Reporting (Relatórios)

**Dashboard Metrics**:
- Total revenue (sum of `CONCLUIDO` appointments)
- Gross profit (revenue - material costs)
- Profit margin (%)
- Average ticket value
- Conversion rate

**Charts** (Recharts library):
- Daily revenue (line chart)
- Profit by service (bar chart)
- Inventory value (pie chart)
- Cost distribution (bar chart)

**API Endpoints**:
```
GET /relatorios/resumo-financeiro    # KPI summary
GET /relatorios/receita-diaria       # Daily breakdown
GET /relatorios/lucro-por-servico    # Profit by service
GET /relatorios/consumo-materiais    # Material cost analysis
GET /relatorios/valor-estoque        # Current inventory value
```

**Files**:
- Backend: `backend/app/services/relatorio_service.py`
- API: `backend/app/api/relatorios.py`
- Frontend: `frontend/src/pages/RelatoriosPage.tsx`

### 5. WhatsApp Business Integration

**Dual WhatsApp integration**: Choose between **Evolution API** or **WAHA** (both open source, self-hosted).

**Architecture**:
```
Backend (Railway) → [Evolution API OR WAHA] (Render) → WhatsApp (Meta)
```

**Supported Providers**:
- **Evolution API** - Full-featured, requires deployment
- **WAHA** - Free tier available, simpler setup (RECOMMENDED for starting)

**Key Features** (both providers):
- Open source and self-hosted (deploy on Render free tier)
- Free text templates (no Meta HSM approval needed)
- QR Code authentication
- Persistent connections
- Webhook support for message history

**Automated Triggers**:
- New appointment → confirmation message
- Status change to CONFIRMADO → confirmation message
- Status change to CANCELADO → cancellation message
- 24h before appointment → reminder (cron job)
- Inactive clients (X months) → recycling message (cron job)

**Templates** (Free Text with Placeholders):
- Simple text templates with `{placeholders}`
- No Meta approval required
- Instant deployment
- Full customization freedom

**Placeholders** (auto-replaced):
- Appointment messages: `{nome_cliente}`, `{data}`, `{hora}`, `{servico}`, `{vendedor}`, `{valor}`
- Recycling messages: `{nome_empresa}`, `{meses_inativo}`, `{data_ultimo_servico}`, `{link_agendamento}`

**Client Recycling**:
- Identifies clients with no appointments for X months (configurable)
- Sends personalized messages with last service date
- Optional scheduling link
- Cron job endpoint: `POST /whatsapp/process-reciclagem-cron`

**API Endpoints**:
```
# Evolution API / WAHA Configuration
GET    /whatsapp/config                        # Get config
POST   /whatsapp/config                        # Create config (Admin/Manager)
PUT    /whatsapp/config                        # Update config (Admin/Manager)
DELETE /whatsapp/config                        # Delete config (Admin/Manager)
POST   /whatsapp/send                          # Send message
POST   /whatsapp/test                          # Test message (Admin/Manager)
GET    /whatsapp/clientes-inativos             # List inactive clients
POST   /whatsapp/send-reciclagem/{cliente_id}  # Send to one client
POST   /whatsapp/process-reciclagem-cron       # Cron job (no auth)

# WAHA-Specific Endpoints
POST   /waha/start-session                     # Start WAHA session
POST   /waha/stop-session                      # Stop WAHA session
GET    /waha/qrcode                            # Get QR Code
GET    /waha/status                            # Check connection status
POST   /waha/logout                            # Reconnect session
GET    /waha/sessions                          # List sessions (debug)

# WAHA Webhooks (receives messages)
POST   /waha-webhook/events/{session_name}     # Receive WAHA events (no auth)
GET    /waha-webhook/health                    # Webhook health check
GET    /waha-webhook/stats/{session_name}      # Message statistics
```

**Evolution API Integration**:
- Endpoint: `{evolution_api_url}/message/sendText/{instance_name}`
- Authentication: API Key header
- Phone number format: `5511999999999` (country + area + number)
- Simple JSON payload with text field

**Configuration UI**:
- **Evolution API**: `/whatsapp` route
  - Tab 1: Evolution API Credentials (URL, API Key, Instance Name)
  - Tab 2: Templates (free text with placeholders)
  - Tab 3: Inactive Clients (list + send buttons)

- **WAHA**: `/waha` route (NEW)
  - Tab 1: WAHA Credentials (URL, API Key, Session Name) + QR Code display
  - Tab 2: Templates (free text with placeholders)
  - Tab 3: Inactive Clients (list + send buttons)
  - Real-time connection status with auto-refresh
  - Test message functionality

**Deploying WhatsApp Services**:

### Option A: WAHA (RECOMMENDED for starting)

**Pros**:
- 100% free on Render free tier
- Simpler setup (no Prisma build issues)
- Built-in QR Code UI in frontend
- Excellent documentation
- Webhook support for message history

**Setup**:
1. Deploy to Render using official Docker image: `devlikeapro/waha:latest`
2. Set environment variables: `WAHA_API_KEY`, `WHATSAPP_HOOK_EVENTS`
3. Access `/waha` route in frontend
4. Click "Start Session" and scan QR Code
5. Done! See `INTEGRACAO_WAHA_COMPLETA.md` for detailed guide

### Option B: Evolution API

**Pros**:
- More features and advanced capabilities
- Active community
- More deployment options

**Cons**:
- Known Docker build issues (Prisma Client generation crashes)
- More complex setup
- Paid hosting recommended for production

**Setup Options**:
1. **Hosted Service** (Recommended for Production)
   - Providers: evolution-api.com/pricing, zapmee.com.br
   - Cost: ~R$ 49/month
   - Instant setup

2. **Self-hosted** (Not Recommended)
   - `evolution-api/` folder exists but NOT committed to git
   - See `EVOLUTION_API_STATUS.md` for known issues
   - Use official image to avoid Docker build problems

**If you proceed with self-hosted**:

1. **Deploy to Render** (separate microservice):
   - Choose official image deployment (avoid Docker build)
   - Follow `evolution-api/DEPLOY_IMAGEM_OFICIAL.md` instructions
   - Configure database (use shared PostgreSQL with separate schema)

2. **Create WhatsApp Instance**:
   ```bash
   curl -X POST https://your-evolution-api.onrender.com/instance/create \
     -H "apikey: YOUR_API_KEY" \
     -d '{"instanceName": "agenda_onsell", "qrcode": true}'
   ```

3. **Connect via QR Code**:
   - Access `/instance/connect/agenda_onsell`
   - Read QR Code with WhatsApp mobile app
   - Connection persists in database

4. **Configure in AgendaOnSell**:
   - Navigate to `/whatsapp` in the system
   - Enter Evolution API URL (e.g., https://evolution.onrender.com)
   - Enter API Key
   - Enter Instance Name (e.g., agenda_onsell)
   - Test with "Send Test Message" button

**Cron Job Setup** (Production):
```bash
# Reminders: Every hour
0 * * * * curl -X POST https://your-api.com/whatsapp/process-lembretes-cron

# Recycling: Daily at 3 AM
0 3 * * * curl -X POST https://your-api.com/whatsapp/process-reciclagem-cron
```

**Files**:
- **Backend Models**:
  - `backend/app/models/whatsapp_config.py` - Configuration (supports both providers)
  - `backend/app/models/whatsapp_message.py` - Message history (WAHA webhooks)
- **Backend Services**:
  - `backend/app/services/whatsapp_service.py` - Evolution API service
  - `backend/app/services/waha_service.py` - WAHA service
- **Backend APIs**:
  - `backend/app/api/whatsapp.py` - Evolution API endpoints
  - `backend/app/api/waha.py` - WAHA session management
  - `backend/app/api/waha_webhook.py` - WAHA webhook receiver
- **Backend Schemas**: `backend/app/schemas/whatsapp.py`
- **Frontend Pages**:
  - `frontend/src/pages/WhatsAppPage.tsx` - Evolution API UI
  - `frontend/src/pages/WAHAPage.tsx` - WAHA UI (with QR Code)
- **Frontend Types**: `frontend/src/types/index.ts` (WhatsAppConfig interface)
- **Migrations**:
  - `backend/alembic/versions/b1a2c3d4e5f6_add_waha_support_keep_evolution.py` - Latest
- **Documentation**:
  - `INTEGRACAO_WAHA_COMPLETA.md` - Complete WAHA guide
  - `PRONTO_WAHA.md` - WAHA migration summary
  - `WHATSAPP_IMPLEMENTATION.md` - Evolution API details
  - `EVOLUTION_API_STATUS.md` - Evolution API issues

**Important Notes**:
- **Provider Selection**: System supports both Evolution API and WAHA simultaneously
- **Database Config**: `whatsapp_configs` table has fields for both providers
- **UI Routes**: `/whatsapp` for Evolution API, `/waha` for WAHA
- **Tenant Isolation**: All WhatsApp configs are per-establishment
- **Message History**: WAHA webhooks save all messages to `whatsapp_messages` table
- **QR Code**: WAHA displays QR Code directly in frontend UI
- **No Meta Approval**: Free text templates work with both providers
- **Recommended**: Start with WAHA (free, simpler), migrate to Evolution API if needed

---

## 🔧 Development Workflow

### Git & Version Control

**Important Git Practices**:
- ⚠️ The `evolution-api/` folder is **NOT tracked by git** - it contains experimental deployment configs with known issues
- Database utility scripts in `backend/` are also untracked - they're emergency tools, not production code
- Before committing, always review changes: `git status`, `git diff`
- Modified files should be reviewed with `git diff` before committing
- Untracked files may include: documentation updates, utility scripts, database backups
- Use descriptive commit messages in English
- Branch naming: `feature/*`, `bugfix/*`, `hotfix/*`
- Main branch: `main` (also the PR target)

**Files Intentionally Not Committed**:
- `evolution-api/` - Experimental WhatsApp integration with deployment issues (see EVOLUTION_API_STATUS.md)
- `backend/database-recovery/` - Database backup and recovery scripts
- `backend/create_*.py`, `backend/drop_*.py`, `backend/mark_migration.py` - Utility scripts for DB emergencies
- `.env` files (already in .gitignore) - Environment variables with credentials

### Standard Feature Development

**Backend Changes** (order matters):
1. **Models** (`backend/app/models/`) - SQLAlchemy ORM, database structure
2. **Schemas** (`backend/app/schemas/`) - Pydantic, request/response validation
3. **Services** (`backend/app/services/`) - Business logic, validations, calculations
4. **Routes** (`backend/app/api/`) - FastAPI endpoints (thin, delegate to services)
5. **Tests** (`backend/tests/`) - Pytest unit/integration tests
6. **Migration** - `alembic revision --autogenerate -m "description"`

**Frontend Changes** (order matters):
1. **Types** (`frontend/src/types/index.ts`) - TypeScript interfaces (match backend schemas)
2. **API Services** (`frontend/src/services/api.ts`) - Add API call methods
3. **Components** (`frontend/src/components/`) - Reusable UI (modals, forms)
4. **Pages** (`frontend/src/pages/`) - Full views with data fetching (React Query)
5. **Type Check** - `npm run type-check`

**Mobile vs Desktop**:
- Desktop: Edit `frontend/src/pages/`, `frontend/src/components/`
- Mobile: Edit **ONLY** `frontend/src/mobile/`
- Shared: `frontend/src/services/api.ts`, `types/`, `utils/`
- **NEVER mix**: Don't import desktop in mobile or vice versa

### Service Layer Pattern (Backend)

Use services for:
- ✅ Complex validation logic (e.g., appointment conflicts)
- ✅ Multi-model operations (e.g., create appointment + update client)
- ✅ Authorization checks (e.g., user belongs to establishment)
- ✅ Data transformations or calculations

**Example**: `agendamento_service.py` handles:
- Conflict detection (same user, overlapping times)
- Auto `data_fim` calculation (if not provided)
- Establishment filtering
- Status transition validation

### Testing

**Backend**:
```bash
cd backend

# All tests
pytest

# Specific file
pytest tests/unit/test_auth.py

# Specific function
pytest tests/unit/test_auth.py::test_login_success

# Directory
pytest tests/unit/

# Coverage report
pytest --cov=app --cov-report=html

# Verbose
pytest -vv
```

**Frontend**:
```bash
cd frontend

# Type check
npm run type-check

# Lint
npm run lint
```

### Build & Deploy

**Frontend**:
```bash
cd frontend
npm run build      # Creates dist/
npm run preview    # Local preview of production build
```

**Backend**:
```bash
# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Environment Variables** (Production):
```bash
# .env file (create in backend/)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
TIMEZONE=America/Sao_Paulo
CORS_ORIGINS=https://your-frontend.com,https://your-other-domain.com

# Note: config.py has development defaults hardcoded (must override in production!)
```

---

## 📱 Mobile Version

### Critical Mobile Rules

#### ❌ NEVER Use These in Mobile:

1. **lucide-react** → Use emojis instead
   ```tsx
   // ❌ WRONG
   import { Calendar } from 'lucide-react'
   <Calendar className="w-5 h-5" />

   // ✅ CORRECT
   <span className="text-2xl">📅</span>
   ```

2. **date-fns** → Use JavaScript Date API
   ```tsx
   // ❌ WRONG
   import { format } from 'date-fns'
   format(new Date(), 'dd/MM/yyyy')

   // ✅ CORRECT
   const dataHoje = new Date().toISOString().split('T')[0]  // YYYY-MM-DD

   const formatHora = (dateString: string) => {
     const date = new Date(dateString)
     return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
   }
   ```

3. **Type Conversions** → Always convert API strings to numbers
   ```tsx
   // ❌ WRONG (API returns strings)
   {servico.preco.toFixed(2)}

   // ✅ CORRECT
   {Number(servico.preco || 0).toFixed(2)}
   ```

4. **Hover States** → Use active states for touch
   ```tsx
   // ❌ WRONG
   className="hover:bg-gray-100"

   // ✅ CORRECT
   className="active:bg-gray-100"
   ```

### Mobile Structure

```
frontend/src/mobile/
├── MobileApp.tsx              # Router (separate from desktop)
├── layouts/
│   └── MobileLayout.tsx       # Bottom nav (6 buttons)
├── components/
│   ├── MobileProtectedRoute.tsx
│   ├── MobileFAB.tsx          # Floating Action Button
│   ├── MobileModal.tsx        # Fullscreen modal
│   └── MobileSearchBar.tsx
├── pages/
│   ├── MobileLoginPage.tsx
│   ├── MobileDashboardPage.tsx
│   ├── MobileAgendamentosPage.tsx
│   ├── MobileClientesPage.tsx
│   ├── MobileServicosPage.tsx
│   ├── MobileMateriaisPage.tsx
│   └── MobileRelatoriosPage.tsx
```

### Mobile UI Patterns

**Emojis Used**:
- 🏠 Home, 📅 Calendar, 👥 Clients, ⚙️ Services, 📦 Materials, 📊 Reports
- 🚪 Logout, 🔍 Search, ➕ Add, 🗑️ Delete, ✂️ Haircut, 🧔 Beard
- 💰 Revenue, 📈 Profit, ⚠️ Alert, 🕐 Time

**Touch-Friendly Design**:
- Buttons minimum 44px height
- Font minimum 16px (prevents iOS zoom)
- Generous spacing (`p-4`, `gap-3`)
- Active states: `active:bg-gray-100`

**Layout**:
- Bottom nav fixed (`z-20`)
- Content `pb-20` (prevents nav overlap)
- Fullscreen modals (`fixed inset-0`)

### Testing on Real Device

1. **Configure Vite** (`frontend/vite.config.ts`):
   ```typescript
   server: {
     host: '0.0.0.0',  // CRITICAL: allows network access
     port: 3000,
   }
   ```

2. **Get Local IP**:
   ```bash
   # Windows
   ipconfig

   # Linux/Mac
   ifconfig
   ```

3. **Access from Phone**:
   - Connect phone to same Wi-Fi as PC
   - Navigate to `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

### Mobile Debugging

**White Screen?**
1. Check browser console (Chrome Remote Debug)
2. Look for `lucide-react` imports
3. Look for `date-fns` imports
4. Check if API returning errors

**API Not Working?**
1. Verify backend running on `YOUR_IP:8000`
2. Test: `http://YOUR_IP:8000/docs`
3. Check CORS in `backend/main.py`
4. Ensure phone on same network

---

## 🐛 Troubleshooting

### Quick Decision Tree

```
Problem: Backend won't start
  → Check: Python dependencies installed? (pip install -r requirements.txt)
  → Check: Database accessible? (python -c "from app.database import engine; print('OK')")
  → Check: Port 8000 available? (netstat -ano | findstr :8000)

Problem: Frontend won't start
  → Check: Node dependencies installed? (npm install)
  → Check: Port 3000 available?
  → Check: Vite config correct? (vite.config.ts)

Problem: API calls fail (CORS)
  → Check: Backend running on port 8000?
  → Check: allow_origins in backend/main.py includes http://localhost:3000
  → Check: Vite proxy configured in vite.config.ts

Problem: Authentication fails
  → Check: Token in localStorage['access_token']?
  → Check: Token not expired? (30min limit)
  → Check: Axios interceptor adding Authorization header?
  → Check: User credentials correct in database?

Problem: Database errors
  → Check: Connection string correct in config.py?
  → Check: Internet connection (DB is remote on Render.com)?
  → Check: Migrations applied? (alembic current)
  → Check: SSL enabled? (sslmode=require in connection string)

Problem: Mobile white screen
  → Check: No lucide-react imports in mobile files?
  → Check: No date-fns imports in mobile files?
  → Check: All API number fields converted with Number()?
  → Check: Browser console for errors (Chrome Remote Debug)?
```

### Common Issues & Solutions

#### Backend Won't Connect to Database
```bash
# Test connection
cd backend && python -c "from app.database import engine; print('DB OK')"

# If fails:
# 1. Check internet (DB is on Render.com)
# 2. Verify credentials in backend/app/config.py
# 3. Ensure SSL enabled (sslmode=require)
```

#### Frontend Can't Access API
- Verify backend running: http://localhost:8000/docs
- Check Vite proxy in `frontend/vite.config.ts`
- Ensure frontend on port 3000

#### CORS Errors
- Check `allow_origins` in `backend/main.py`
- Frontend must be on `http://localhost:3000`
- Backend should allow this origin

#### Migration Failures
```bash
# Check current state
cd backend && alembic current

# View history
alembic history

# Force reset (CAUTION: loses data)
alembic downgrade base
alembic upgrade head
```

#### Token/Auth Issues
- Check `localStorage['access_token']` in browser DevTools
- Tokens expire after 30min
- Axios interceptor in `frontend/src/services/api.ts:15` should inject header
- 401 responses trigger auto-logout

### File Reference Guide

**When debugging...**

| Issue Type | Check These Files |
|------------|-------------------|
| **Auth problems** | `backend/app/api/auth.py`, `backend/app/services/auth_service.py`, `backend/app/utils/auth.py`, `frontend/src/services/api.ts:15` |
| **Permission denied** | `backend/app/utils/permissions.py`, `backend/app/models/user.py:8`, `frontend/src/components/RoleProtectedRoute.tsx` |
| **Appointment issues** | `backend/app/services/agendamento_service.py`, `frontend/src/pages/AgendamentosPage.tsx`, `frontend/src/components/Calendar.tsx` |
| **Database errors** | `backend/app/database.py`, `backend/app/config.py`, `backend/alembic/env.py` |
| **API not responding** | `frontend/vite.config.ts` (proxy), `backend/main.py:1` (CORS) |
| **Mobile broken** | `frontend/src/utils/deviceDetector.ts`, `frontend/src/AppRouter.tsx`, `frontend/src/mobile/MobileApp.tsx` |

### Known Issues

1. **Bcrypt Version Warning**: Functional but shows deprecation warning (safe to ignore)
2. **Refresh Token**: Endpoint exists but not fully implemented
3. **Render.com DB**: May hibernate after inactivity (first request has cold start latency)
4. **TypeScript**: Some `any` types in Vite config (optional chaining on `import.meta`)
5. **Evolution API Deployment**: Docker build crashes after Prisma Client generation - see EVOLUTION_API_STATUS.md for alternatives
6. **Uncommitted Files**: Several utility scripts and evolution-api folder are not tracked in git (intentional)

---

## 🎨 Code Conventions

### Naming

**Portuguese** (business domain):
- `empresa`, `estabelecimento`, `agendamento`, `cliente`, `servico`, `vendedor`

**English** (technical):
- `created_at`, `updated_at`, `is_active`, `status`, `role`

### Database Patterns

- **Soft Delete**: Use `is_active` or `deleted_at`, never hard delete
- **Timestamps**: Auto-populated `created_at`, `updated_at`
- **Relationships**: Always bidirectional with `back_populates`
- **Cascades**: `ondelete="CASCADE"` on all foreign keys
- **Timezone**: All `DateTime` columns use Brazil time (UTC-3)

### Code Style

- **Backend**: FastAPI auto-docs at `/docs` (Swagger UI)
- **Frontend**: TypeScript strict mode, Tailwind utility-first
- **Testing**: Pytest for backend, Jest planned for frontend
- **Git**: Commits in English, branches `feature/*`, `bugfix/*`
- **Main Branch**: `main` (also target for PRs)

### Architecture Rules

1. **Backend**: Keep routes thin, put logic in services
2. **Frontend**: Use React Query for server state, React Hook Form for forms
3. **Mobile**: 100% separate from desktop, no shared components
4. **API**: Always return Pydantic schemas, never raw SQLAlchemy models
5. **Timezone**: All dates in Brazil timezone, use utility functions

---

## 📚 Additional Resources

### Project State

**✅ Fully Implemented**:
- JWT authentication with 5 roles
- Multi-tenant architecture with establishment isolation
- Complete CRUD: Agendamentos, Clientes, Serviços, Materiais
- Drag & drop calendar with conflict detection
- Financial reporting with charts
- Loyalty program (points, rewards, redemptions)
- Inventory tracking with cost integration
- Role-based access control (frontend + backend)
- Desktop responsive UI
- Mobile app (separate codebase)
- Support admin interface (cross-company)
- **Dual WhatsApp Integration** (choose Evolution API OR WAHA)
  - **WAHA Integration** (RECOMMENDED)
    - Frontend page `/waha` with QR Code display
    - Real-time connection status
    - Message history via webhooks
    - 100% free deployment on Render
    - Complete setup guide: `INTEGRACAO_WAHA_COMPLETA.md`
  - **Evolution API Integration** (alternative)
    - Frontend page `/whatsapp`
    - Requires paid hosting or complex self-hosting
    - More features but higher cost
- **WhatsApp Features** (both providers):
  - Free text template system (no Meta approval needed)
  - Automated notifications (appointments, reminders, recycling)
  - Client recycling system (inactive client recovery)
  - QR Code-based connection
  - Webhook support for message tracking

**⚠️ Partial/Future**:
- PDF/Excel export
- Email notifications
- Recurring appointments
- Mobile push notifications
- WhatsApp cron jobs (needs server-side scheduling configuration)

**❌ Not Implemented**:
- Refresh token rotation
- WebSocket real-time updates
- Offline mode (service workers)
- Multi-language support

### Quick Start Scripts

Located in project root:
- `start.bat` (Windows) - Launches both backend and frontend
- `start.sh` (Linux/Mac) - Launches both backend and frontend

These scripts automatically open two terminals and start both services.

---

**Last Updated**: 2026-01-04
**Version**: 1.6.0
**Maintainer**: Development Team

**Changelog**:
- v1.6.0 (2026-01-04): **CRITICAL** - Elevated security warning to top of file, identified credentials in backend/app/config.py (line 10), added emergency fix steps, streamlined "Critical Don'ts" section
- v1.5.2 (2026-01-03): Updated security warning about backend/README.md credentials, minor clarity improvements
- v1.5.1 (2025-12-28): Added dependency installation commands, cleaned up duplicate Git section, minor improvements
- v1.5.0 (2025-12-27): WAHA integration added as recommended WhatsApp provider, updated table count (14 tables), added WAHA endpoints and UI documentation
- v1.4.1 (2025-12-23): Added security warning about backend/README.md credentials
- v1.4 (2025-12-21): Added git workflow section, updated Evolution API deployment status, added utility scripts documentation, fixed table count (13 tables)
- v1.3 (2025-12-18): WhatsApp integration via Evolution API
- v1.2: Mobile version documentation
- v1.1: Loyalty program and financial reports
- v1.0: Initial documentation

---

## 📱 Additional Documentation

### WhatsApp Integration Guides
- **WAHA Complete Guide**: `INTEGRACAO_WAHA_COMPLETA.md` - Step-by-step WAHA setup (RECOMMENDED)
- **WAHA Migration Summary**: `PRONTO_WAHA.md` - Quick reference for WAHA migration
- **WhatsApp Implementation**: `WHATSAPP_IMPLEMENTATION.md` - Evolution API details
- **Evolution API Status**: `EVOLUTION_API_STATUS.md` - Known issues and alternatives

### Other Documentation
- **Mobile Formatting**: `frontend/FORMATACAO_CAMPOS.md` - Mobile-specific field formatting
- **Mobile README**: `frontend/MOBILE_README.md` - Mobile version documentation
