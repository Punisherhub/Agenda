# Backend - Agenda OnSell

API RESTful para sistema de agendamento empresarial.

## 🚀 Como Executar

### Desenvolvimento
```bash
# Instalar dependências
pip install -r requirements.txt

# Executar servidor
python main.py
# ou
uvicorn main:app --reload --port 8000
```

### Produção
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🗄️ Banco de Dados

### Configuração
```env
# Create a .env file in backend/ directory with:
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
#
# NEVER commit credentials to git!
# The actual connection string is configured via environment variables (see backend/app/config.py)
```

### Migrations
```bash
# Aplicar migrations
alembic upgrade head

# Criar nova migration
alembic revision --autogenerate -m "description"
```

## 📊 API Endpoints

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /auth/me` - Usuário atual

### Agendamentos
- `GET /agendamentos/` - Listar agendamentos
- `POST /agendamentos/` - Criar agendamento
- `GET /agendamentos/calendario` - View calendário
- `PUT /agendamentos/{id}` - Atualizar agendamento
- `PATCH /agendamentos/{id}/status` - Atualizar status
- `DELETE /agendamentos/{id}` - Cancelar agendamento

### Clientes
- `GET /clientes/` - Listar clientes
- `POST /clientes/` - Criar cliente
- `GET /clientes/buscar` - Buscar cliente
- `PUT /clientes/{id}` - Atualizar cliente
- `POST /clientes/{id}/vip` - Marcar como VIP

### Serviços
- `GET /servicos/` - Listar serviços
- `GET /servicos/publicos` - Listar públicos
- `POST /servicos/` - Criar serviço (MANAGER+)
- `PUT /servicos/{id}` - Atualizar serviço (MANAGER+)

## 🔐 Autenticação

Sistema JWT com roles:
- `SUPORTE`: Suporte técnico (acesso cross-company)
- `ADMIN`: Administrador da empresa
- `MANAGER`: Gerente do estabelecimento
- `VENDEDOR`: Vendedor/Funcionário
- `ATENDENTE`: Atendente

**Regras:**
- Todos os funcionários podem fazer agendamentos
- Usuários veem apenas dados do seu estabelecimento (exceto SUPORTE)
- Roles são organizacionais, não restritivas

## 📝 Teste da API

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "carlos@barbeariamoderna.com", "password": "123456"}'
```

### Listar Agendamentos
```bash
curl -X GET http://localhost:8000/agendamentos/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📖 Documentação Completa

Para documentação completa do projeto, consulte `CLAUDE.md` na raiz do repositório.
