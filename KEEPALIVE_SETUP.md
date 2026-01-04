# Configuração de Keep-Alive para WAHA

## 🎯 Objetivo

Evitar que o serviço WAHA (Render free tier) hiberne após 15 minutos de inatividade, garantindo que o WhatsApp esteja sempre disponível para enviar notificações.

---

## 🏗️ Arquitetura

```
UptimeRobot (10min)
    ↓
Backend Railway (/keepalive/ping-waha)
    ↓
WAHA Render (/health)
```

**Fluxo:**
1. UptimeRobot faz ping no backend a cada 10 minutos
2. Backend automaticamente faz ping em todas as instâncias WAHA configuradas
3. WAHA se mantém ativo no Render (evita hibernação)

---

## ⚙️ Componentes Implementados

### 1. Serviço de Keep-Alive
**Arquivo:** `backend/app/services/keepalive_service.py`

- Busca todas as configurações WAHA ativas no banco
- Faz ping no endpoint `/health` de cada instância WAHA
- Retorna estatísticas (total, sucesso, falhas)

### 2. API Endpoints
**Arquivo:** `backend/app/api/keepalive.py`

**Endpoints criados:**

#### `GET /keepalive/health`
Health check simples do backend.
- Sem autenticação
- Retorna: `{"status": "ok"}`
- Use para monitors básicos

#### `GET /keepalive/ping-waha`
Faz ping em todas as instâncias WAHA.
- Sem autenticação (permite pings automáticos)
- Retorna estatísticas detalhadas
- **Este é o endpoint principal para uptime monitors**

#### `GET /keepalive/status`
Status geral do sistema incluindo WAHA.
- Sem autenticação
- Retorna contadores de configs ativas

### 3. Scheduler Automático
**Arquivo:** `backend/main.py`

- APScheduler executando em background
- Ping automático a cada **10 minutos**
- Inicia automaticamente no startup do backend
- Para graciosamente no shutdown

---

## 🚀 Configuração no UptimeRobot

### Passo 1: Criar conta no UptimeRobot
- Acesse: https://uptimerobot.com
- Crie uma conta gratuita (50 monitors)

### Passo 2: Criar Monitor
1. Click em **"+ Add New Monitor"**
2. Configure:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** AgendaOnSell Backend KeepAlive
   - **URL:** `https://agenda-production-fdff.up.railway.app/keepalive/ping-waha`
   - **Monitoring Interval:** 10 minutes (plano free)
   - **Monitor Timeout:** 30 seconds
   - **HTTP Method:** GET
   - **Alert Contacts:** Seu email

3. Click em **"Create Monitor"**

### Passo 3: Verificar Funcionamento
- Aguarde 10 minutos
- Verifique logs do backend no Railway
- Deve aparecer: `[KEEP-ALIVE] ✓ WAHA ping OK - Estabelecimento X`

---

## 📊 Monitoramento

### Logs do Backend (Railway)
```
[STARTUP] Iniciando scheduler de keep-alive...
[STARTUP] Scheduler iniciado - Pings a cada 10 minutos

[KEEP-ALIVE] ✓ WAHA ping OK - Estabelecimento 1
[KEEP-ALIVE] Resumo: 1/1 pings bem-sucedidos
```

### Logs do WAHA (Render)
```
GET /health 200 - 15ms
```

### Teste Manual
```bash
# Testar endpoint do backend
curl https://agenda-production-fdff.up.railway.app/keepalive/ping-waha

# Resposta esperada:
{
  "status": "completed",
  "statistics": {
    "total_instances": 1,
    "successful_pings": 1,
    "failed_pings": 0
  },
  "details": [
    {
      "estabelecimento_id": 1,
      "status": "success",
      "url": "https://waha-xxxxx.onrender.com/health"
    }
  ],
  "message": "Ping realizado em 1 instâncias WAHA"
}
```

---

## ⏱️ Intervalos Recomendados

| Tier | Intervalo | Custo |
|------|-----------|-------|
| Render Free | 10 min | $0 |
| Render Paid | - | $7/mês (sem hibernação) |

**Recomendação:** Usar UptimeRobot free (10min) + Render free é suficiente e 100% gratuito.

---

## 🔧 Troubleshooting

### Problema: WAHA ainda hiberna

**Causa:** Intervalo de ping > 15 minutos

**Solução:**
- Verificar se UptimeRobot está pingando a cada 10min
- Verificar logs do backend para confirmar pings automáticos

### Problema: Backend não faz ping automático

**Causa:** Scheduler não iniciou

**Verificação:**
```bash
# Logs do Railway devem mostrar:
[STARTUP] Iniciando scheduler de keep-alive...
[STARTUP] Scheduler iniciado - Pings a cada 10 minutos
```

**Solução:**
- Reiniciar backend no Railway
- Verificar se APScheduler está instalado: `pip show apscheduler`

### Problema: Erro ao pingar WAHA

**Causa:** URL ou API Key incorretos

**Verificação:**
```sql
-- Verificar configurações WAHA no banco
SELECT estabelecimento_id, waha_url, ativado
FROM whatsapp_configs
WHERE waha_url IS NOT NULL;
```

**Solução:**
- Corrigir `waha_url` e `waha_api_key` no banco via pgAdmin
- Garantir que `ativado = true`

---

## 📝 Checklist de Implementação

- [x] APScheduler instalado (`requirements.txt`)
- [x] Serviço KeepAliveService criado
- [x] Endpoints /keepalive/* criados
- [x] Router registrado no main.py
- [x] Scheduler configurado no lifespan
- [ ] Deploy do backend no Railway
- [ ] Monitor criado no UptimeRobot
- [ ] Testar endpoint manualmente
- [ ] Verificar logs após 10 minutos
- [ ] Confirmar que WAHA não hiberna mais

---

## 🎁 Benefícios

✅ WAHA sempre ativo (sem cold starts)
✅ Notificações WhatsApp instantâneas
✅ 100% gratuito (UptimeRobot + Render free tier)
✅ Configuração automática (scheduler interno)
✅ Monitoramento incluído (logs detalhados)

---

## 📚 Dependências

```txt
apscheduler==3.10.4  # Scheduler de tarefas
requests==2.31.0     # HTTP client para pings
```

---

## 🔗 URLs Importantes

- **Backend Health:** https://agenda-production-fdff.up.railway.app/keepalive/health
- **Ping WAHA:** https://agenda-production-fdff.up.railway.app/keepalive/ping-waha
- **Status:** https://agenda-production-fdff.up.railway.app/keepalive/status
- **UptimeRobot:** https://uptimerobot.com
- **WAHA Docs:** https://waha.devlike.pro

---

**Criado em:** 2026-01-04
**Versão:** 1.0.0
