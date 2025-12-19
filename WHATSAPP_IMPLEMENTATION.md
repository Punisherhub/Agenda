# 💬 Implementação do Sistema WhatsApp - Agenda OnSell (Evolution API)

## 📋 Visão Geral

Sistema completo de notificações via WhatsApp usando **Evolution API** (open source) com:
- ✅ Configuração por estabelecimento (multi-tenant isolado)
- ✅ Templates personalizáveis com placeholders
- ✅ Gatilhos automáticos (agendamento, confirmação, cancelamento, reciclagem)
- ✅ Sistema de reciclagem de clientes inativos
- ✅ Deploy separado no Render (microserviço independente)

---

## 🏗️ Arquitetura

```
┌─────────────────────┐      ┌──────────────────────┐      ┌─────────────────────┐
│  Backend (Railway)  │─────▶│  Evolution API       │─────▶│  WhatsApp Cloud     │
│  FastAPI + Postgres │      │  (Render Web Service)│      │  (Meta Servers)     │
└─────────────────────┘      └──────────────────────┘      └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Frontend (Railway) │
│  React + TypeScript │
└─────────────────────┘
```

**Comunicação**:
- Backend → Evolution API: Requests HTTP diretos (POST /message/sendText)
- Evolution API → WhatsApp: Protocolo WhatsApp via Evolution API

---

## 🗄️ Banco de Dados

### Tabela: `whatsapp_configs`

```sql
CREATE TABLE whatsapp_configs (
    id SERIAL PRIMARY KEY,

    -- Evolution API Credentials
    evolution_api_url VARCHAR(500) NOT NULL,      -- URL da Evolution API (ex: https://evolution.onrender.com)
    evolution_api_key VARCHAR(500) NOT NULL,      -- API Key da Evolution API
    evolution_instance_name VARCHAR(100) NOT NULL, -- Nome da instância WhatsApp

    -- Templates de Mensagens (texto livre com placeholders)
    template_agendamento TEXT,                     -- Confirmação de novo agendamento
    template_lembrete TEXT,                        -- Lembrete 24h antes
    template_confirmacao TEXT,                     -- Confirmação do agendamento
    template_cancelamento TEXT,                    -- Notificação de cancelamento
    template_reciclagem TEXT,                      -- Reciclagem de clientes inativos

    -- Configurações de Envio
    ativado BOOLEAN DEFAULT FALSE,                 -- Ativar/desativar WhatsApp
    enviar_agendamento BOOLEAN DEFAULT TRUE,
    enviar_lembrete BOOLEAN DEFAULT TRUE,
    enviar_confirmacao BOOLEAN DEFAULT TRUE,
    enviar_cancelamento BOOLEAN DEFAULT TRUE,
    enviar_reciclagem BOOLEAN DEFAULT FALSE,

    -- Configurações de Reciclagem
    meses_inatividade INTEGER DEFAULT 3,           -- Meses sem agendamento = inativo
    link_agendamento VARCHAR(500),                 -- Link direto para agendamento online

    -- Relacionamento
    estabelecimento_id INTEGER NOT NULL UNIQUE REFERENCES estabelecimentos(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Migrations Aplicadas

- **a56f52319943** - `migrate from meta api to evolution api`: Migração de Meta API para Evolution API

---

## 🔧 Backend - API Endpoints

### Base URL: `/whatsapp`

#### 1. Configuração

**GET /whatsapp/config**
- Busca configuração do WhatsApp do estabelecimento
- Auth: Requer usuário autenticado
- Response: `WhatsAppConfigResponse`

**POST /whatsapp/config**
- Cria configuração do WhatsApp
- Auth: Admin/Manager apenas
- Body: `WhatsAppConfigCreate`
- Response: `WhatsAppConfigResponse`

**PUT /whatsapp/config**
- Atualiza configuração do WhatsApp
- Auth: Admin/Manager apenas
- Body: `WhatsAppConfigUpdate`
- Response: `WhatsAppConfigResponse`

**DELETE /whatsapp/config**
- Remove configuração do WhatsApp
- Auth: Admin/Manager apenas
- Response: 204 No Content

#### 2. Envio de Mensagens

**POST /whatsapp/send**
- Envia mensagem WhatsApp para um cliente
- Auth: Requer usuário autenticado
- Body: `WhatsAppMessageRequest`
  ```json
  {
    "cliente_id": 123,
    "tipo_mensagem": "AGENDAMENTO",  // AGENDAMENTO, LEMBRETE, CONFIRMACAO, CANCELAMENTO, RECICLAGEM
    "agendamento_id": 456,            // Opcional
    "mensagem_customizada": null      // Opcional, sobrescreve template
  }
  ```
- Response: `WhatsAppMessageResponse`

**POST /whatsapp/test**
- Envia mensagem de teste para validar configuração
- Auth: Admin/Manager apenas
- Body: `WhatsAppTestRequest`
  ```json
  {
    "telefone": "+5511999999999",
    "mensagem": "Teste de envio"
  }
  ```
- Response: `WhatsAppMessageResponse`

#### 3. Reciclagem de Clientes Inativos

**GET /whatsapp/clientes-inativos**
- Lista clientes inativos (sem agendamento há X meses)
- Auth: Requer usuário autenticado
- Response: Array de objetos com:
  ```json
  [
    {
      "cliente_id": 123,
      "nome": "João Silva",
      "telefone": "11999999999",
      "email": "joao@example.com",
      "ultimo_agendamento": "2024-09-15T10:00:00",
      "meses_inativo": 3
    }
  ]
  ```

**POST /whatsapp/send-reciclagem/{cliente_id}**
- Envia mensagem de reciclagem para cliente específico
- Auth: Requer usuário autenticado
- Response: `WhatsAppMessageResponse`

**POST /whatsapp/process-reciclagem-cron**
- **IMPORTANTE**: Endpoint para Cron Job diário
- Processa reciclagem para TODOS estabelecimentos
- Auth: Nenhuma (deve ser chamado por sistema interno)
- Response: Estatísticas do processamento

---

## 📝 Templates e Placeholders

### Placeholders Disponíveis

#### Para Agendamento, Lembrete, Confirmação, Cancelamento:
- `{nome_cliente}` - Nome do cliente
- `{telefone_cliente}` - Telefone do cliente
- `{email_cliente}` - Email do cliente
- `{data}` - Data do agendamento (dd/mm/yyyy)
- `{hora}` - Hora de início (HH:MM)
- `{hora_fim}` - Hora de término (HH:MM)
- `{servico}` - Nome do serviço
- `{vendedor}` - Nome do vendedor
- `{valor}` - Valor do agendamento (R$ XX,XX)
- `{status}` - Status do agendamento

#### Para Reciclagem:
- `{nome_cliente}` - Nome do cliente
- `{nome_empresa}` - Nome do estabelecimento
- `{meses_inativo}` - Meses sem agendamento
- `{data_ultimo_servico}` - Data do último agendamento (dd/Mês)
- `{link_agendamento}` - Link direto para agendamento online

### Exemplo de Template

```
Olá {nome_cliente}! Seu agendamento foi confirmado para {data} às {hora}.
Serviço: {servico}
Vendedor: {vendedor}
Valor: {valor}

Até breve! 👋
```

---

## ⚙️ Service Layer

### WhatsAppService

**Arquivo**: `backend/app/services/whatsapp_service.py`

#### Métodos Principais:

##### Configuração
- `get_config(db, estabelecimento_id)` - Busca configuração
- `create_config(db, config_data)` - Cria configuração
- `update_config(db, estabelecimento_id, config_data)` - Atualiza
- `delete_config(db, estabelecimento_id)` - Remove

##### Envio de Mensagens
- `send_message(db, estabelecimento_id, message_request)` - Envia mensagem
- `send_test_message(db, estabelecimento_id, test_request)` - Teste
- `_send_evolution_message(...)` - Integração Evolution API (privado)
- `_format_phone_number(phone)` - Formata para padrão (5511999999999)
- `_replace_placeholders(template, data)` - Substitui placeholders
- `_get_template_data_from_agendamento(db, agendamento)` - Extrai dados

##### Gatilhos Automáticos
- `notify_novo_agendamento(db, agendamento)` - Ao criar agendamento
- `notify_confirmacao(db, agendamento)` - Ao confirmar
- `notify_cancelamento(db, agendamento)` - Ao cancelar

##### Reciclagem
- `get_clientes_inativos(db, estabelecimento_id, meses_inatividade)` - Lista inativos
- `send_reciclagem_message(db, estabelecimento_id, cliente_id)` - Envia para um cliente
- `process_reciclagem_cron(db)` - **Cron Job** - Processa todos estabelecimentos

---

## 📡 Integração Evolution API

### Endpoint: `/message/sendText/{instanceName}`

**Headers**:
```
apikey: {evolution_api_key}
Content-Type: application/json
```

**Body**:
```json
{
  "number": "5511999999999",
  "text": "Mensagem formatada com placeholders substituídos"
}
```

**Response Success**:
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "ABCD1234..."
  },
  "message": {
    "conversation": "Mensagem formatada..."
  },
  "messageTimestamp": "1702558800",
  "status": "PENDING"
}
```

### Documentação Oficial
https://doc.evolution-api.com/v2/pt/endpoints/send-message

---

## 🚀 Deploy Evolution API no Render

### 1. Estrutura do Projeto

```
evolution-api/
├── Dockerfile
├── docker-compose.yml  (para teste local)
├── .env.example
└── README.md           (instruções completas)
```

### 2. Deploy no Render

1. Acesse https://dashboard.render.com
2. Clique em **New** → **Web Service**
3. Conecte ao repositório Git
4. Configure:
   - **Root Directory**: `evolution-api`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free` ou `Starter`

5. Adicione variáveis de ambiente:
```env
SERVER_URL=https://seu-servico.onrender.com
DATABASE_URL=postgresql://user:pass@host:5432/agenda_db?sslmode=require
AUTHENTICATION_API_KEY=sua_api_key_forte_aqui
```

6. Clique em **Create Web Service**

### 3. Após Deploy

1. Acesse a URL do serviço (ex: https://agenda-onsell-evolution.onrender.com)
2. Crie uma instância WhatsApp via API:
```bash
curl -X POST https://seu-servico.onrender.com/instance/create \
  -H "apikey: sua_api_key" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "agenda_onsell", "qrcode": true}'
```

3. Conecte lendo o QR Code:
```bash
curl -X GET https://seu-servico.onrender.com/instance/connect/agenda_onsell \
  -H "apikey: sua_api_key"
```

4. Leia o QR Code retornado no celular (WhatsApp → Dispositivos Conectados)

5. Configure no AgendaOnSell (`/whatsapp`):
   - **URL da Evolution API**: https://seu-servico.onrender.com
   - **API Key**: sua_api_key
   - **Nome da Instância**: agenda_onsell

---

## 🔄 Cron Job para Reciclagem

### Configuração Recomendada

**Frequência**: Diária às 3h da manhã (horário de baixo tráfego)

**Comando**:
```bash
curl -X POST https://your-api.com/whatsapp/process-reciclagem-cron
```

### Exemplo com Render Cron Jobs

1. No Render Dashboard, vá para o serviço do backend
2. Adicione um **Cron Job**:
   - **Schedule**: `0 3 * * *` (3h AM diário)
   - **Command**: `curl -X POST $BACKEND_URL/whatsapp/process-reciclagem-cron`

---

## ✅ Estado Atual da Implementação

### Backend Completo ✅
- ✅ Modelo `WhatsAppConfig` atualizado para Evolution API
- ✅ Migration `a56f52319943` criada (Meta → Evolution)
- ✅ Service layer completo com todos os métodos
- ✅ API endpoints para CRUD, envio e reciclagem
- ✅ Integração com Evolution API
- ✅ Sistema de templates com placeholders
- ✅ Lógica de reciclagem de clientes inativos
- ✅ Endpoint para Cron Job de reciclagem

### Frontend Completo ✅
- ✅ Página WhatsAppPage.tsx atualizada
- ✅ 3 tabs (Configurações, Templates, Clientes Inativos)
- ✅ Formulário de credenciais Evolution API
- ✅ Editor de templates com placeholders
- ✅ Lista de clientes inativos com botão enviar
- ✅ TypeScript types atualizados

### Evolution API Service Completo ✅
- ✅ Estrutura `evolution-api/` criada
- ✅ Dockerfile para deploy no Render
- ✅ docker-compose.yml para teste local
- ✅ .env.example com todas configurações
- ✅ README.md com instruções completas

---

## 🔮 Próximos Passos

1. **Deploy Evolution API**: Hospedar no Render seguindo README.md
2. **Criar Instância WhatsApp**: Via API do Evolution
3. **Conectar QR Code**: Ler QR Code no celular
4. **Configurar Backend**: Adicionar credenciais em `/whatsapp`
5. **Testar Envio**: Usar botão "Enviar Teste"
6. **Configurar Cron Jobs**: Para lembretes e reciclagem
7. **Aplicar Migration**: `alembic upgrade head` em produção

---

## 📚 Recursos Úteis

- **Evolution API Docs**: https://doc.evolution-api.com
- **Evolution API GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Render Docs**: https://render.com/docs
- **Deploy Guide**: Ver `evolution-api/README.md` neste repositório

---

**Última Atualização**: 2025-12-18
**Versão**: 2.0 (Evolution API)
**Autor**: Migração de Meta API para Evolution API
