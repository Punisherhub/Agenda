# 🚀 Guia de Deploy - Railway

Este guia detalha como fazer deploy do **Agenda OnSell** no Railway com backend e frontend separados.

## 📋 Pré-requisitos

- Conta no Railway (https://railway.app)
- Repositório Git com o código (GitHub, GitLab, etc.)
- Banco PostgreSQL já configurado (Render.com)

## 🏗️ Arquitetura de Deploy

```
Railway Backend Service → PostgreSQL (Render.com)
        ↑
        |
Railway Frontend Service
```

**URLs de Produção:**
- Backend: `https://seu-backend.up.railway.app`
- Frontend: `https://seu-frontend.up.railway.app`

---

## 🔧 PARTE 1: Deploy do Backend

### 1.1. Criar Novo Projeto no Railway

1. Acesse https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize o Railway a acessar seu repositório
5. Selecione o repositório do projeto

### 1.2. Configurar o Backend Service

1. Railway vai detectar automaticamente o projeto Python
2. Clique em **"Add variables"** e adicione as seguintes variáveis:

```env
# Variáveis de Ambiente do Backend
DATABASE_URL=postgresql://sasconv_user:d5DezoH9fkvGQvAldNebbIAU0FWcm4Fe@dpg-d2195c6uk2gs7380vemg-a.virginia-postgres.render.com:5432/agenda_db?sslmode=require

SECRET_KEY=seu-secret-key-super-secreto-aqui-mude-isso

DEBUG=False

CORS_ORIGINS=https://seu-frontend.up.railway.app
```

⚠️ **IMPORTANTE**:
- Substitua `SECRET_KEY` por uma chave aleatória e segura
- Substitua `CORS_ORIGINS` pela URL real do frontend após deploy

### 1.3. ⚠️ CRÍTICO: Configurar Root Directory

**IMPORTANTE**: Sem isso, o deploy falhará com erro 404!

1. No Railway, vá em **Settings**
2. Role até **"Root Directory"**
3. Digite: `backend` (sem barra no final)
4. Clique em **Save**
5. Railway fará redeploy automático

**Por que isso é necessário?**
- Seu repositório tem estrutura de monorepo: `/backend` e `/frontend`
- Railway precisa saber onde está o código a ser executado
- Sem isso, procurará `main.py` na raiz (não existe) → 404

### 1.4. Deploy Automático

O Railway vai automaticamente:
- Detectar `requirements.txt`
- Instalar dependências Python
- Executar o comando definido em `railway.json`
- Disponibilizar a API na porta especificada

### 1.5. Verificar Deploy

Após o deploy, acesse:
```
https://seu-backend.up.railway.app/health
```

Deve retornar:
```json
{"status": "healthy"}
```

---

## 🎨 PARTE 2: Deploy do Frontend

### 2.1. Criar Segundo Service no Projeto

1. No mesmo projeto Railway, clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Selecione o mesmo repositório
4. Nomeie o service como **"Frontend"**

### 2.2. Configurar o Frontend Service

1. Clique em **"Add variables"** e adicione:

```env
# Variáveis de Ambiente do Frontend
VITE_API_URL=https://seu-backend.up.railway.app

NODE_ENV=production
```

⚠️ **IMPORTANTE**: Substitua `VITE_API_URL` pela URL real do backend

### 2.3. Configurar Root Directory

1. No Railway, vá em **Settings**
2. Em **"Root Directory"**, defina: `frontend`
3. Em **"Build Command"**, defina: `npm run build`
4. Em **"Start Command"**, defina: `npm run preview -- --host 0.0.0.0 --port $PORT`

### 2.4. Deploy Automático

O Railway vai automaticamente:
- Detectar `package.json`
- Instalar dependências npm
- Executar build do Vite
- Servir a aplicação

### 2.5. Verificar Deploy

Após o deploy, acesse:
```
https://seu-frontend.up.railway.app
```

Deve abrir a página de login do sistema!

---

## 🔄 PARTE 3: Atualizar CORS

Após ambos os deploys, é necessário atualizar o CORS do backend:

1. Vá no service **Backend** no Railway
2. Edite a variável `CORS_ORIGINS`
3. Defina com a URL real do frontend:
```env
CORS_ORIGINS=https://seu-frontend.up.railway.app
```
4. Railway vai automaticamente fazer redeploy

---

## 📦 Estrutura de Arquivos Criados

### Backend
```
backend/
├── Procfile              # Comando para iniciar app (alternativa)
├── railway.json          # Configuração do Railway
├── runtime.txt           # Versão do Python
├── requirements.txt      # Dependências Python
└── main.py               # Entry point da aplicação
```

### Frontend
```
frontend/
├── railway.json          # Configuração do Railway
├── vite.config.ts        # Config Vite com preview
├── package.json          # Dependências e scripts
└── src/
    └── services/
        └── api.ts        # Configurado para usar VITE_API_URL
```

---

## ✅ Checklist de Deploy

### Backend
- [ ] Variável `DATABASE_URL` configurada
- [ ] Variável `SECRET_KEY` configurada (aleatória e segura!)
- [ ] Variável `DEBUG=False` configurada
- [ ] Variável `CORS_ORIGINS` configurada com URL do frontend
- [ ] Root directory = `backend`
- [ ] Endpoint `/health` respondendo

### Frontend
- [ ] Variável `VITE_API_URL` configurada com URL do backend
- [ ] Root directory = `frontend`
- [ ] Build command = `npm run build`
- [ ] Start command = `npm run preview -- --host 0.0.0.0 --port $PORT`
- [ ] Aplicação abre no navegador
- [ ] Login funciona (testa autenticação)

---

## 🔧 Comandos Úteis

### Testar Build Local

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Logs no Railway

1. Acesse o service no Railway
2. Clique na aba **"Deployments"**
3. Clique no deployment mais recente
4. Veja os logs em tempo real

---

## 🐛 Troubleshooting

### Problema: Backend não conecta ao banco

**Solução:** Verificar `DATABASE_URL`
```bash
# Testar conexão manualmente
psql "postgresql://sasconv_user:password@host:5432/agenda_db?sslmode=require"
```

### Problema: Frontend não acessa API

**Soluções:**
1. Verificar se `VITE_API_URL` está correta
2. Verificar se CORS está configurado no backend
3. Abrir DevTools → Network e ver se requisições chegam ao backend

### Problema: CORS Error

**Solução:**
1. No backend, atualizar `CORS_ORIGINS` com a URL correta do frontend
2. Formato: `https://seu-frontend.up.railway.app` (sem barra no final)
3. Railway vai fazer redeploy automaticamente

### Problema: Build falha no frontend

**Soluções:**
1. Verificar se `npm run build` funciona localmente
2. Ver logs de build no Railway
3. Verificar se todas as dependências estão em `package.json`

---

## 📝 Variáveis de Ambiente - Resumo

### Backend (`backend/.env` ou Railway Variables)
```env
DATABASE_URL=postgresql://...
SECRET_KEY=your-super-secret-key
DEBUG=False
CORS_ORIGINS=https://seu-frontend.up.railway.app
```

### Frontend (`frontend/.env.production` ou Railway Variables)
```env
VITE_API_URL=https://seu-backend.up.railway.app
NODE_ENV=production
```

---

## 🔒 Segurança em Produção

1. **SECRET_KEY**: SEMPRE use uma chave aleatória e segura em produção
2. **DEBUG**: SEMPRE `False` em produção
3. **CORS**: Configure apenas o domínio do frontend, não use `*`
4. **DATABASE_URL**: Nunca commite no Git, use variáveis de ambiente

---

## 📊 Monitoramento

O Railway fornece:
- ✅ Logs em tempo real
- ✅ Métricas de CPU e memória
- ✅ Histórico de deploys
- ✅ Rollback com um clique

Acesse em: **Deployments** → Deployment específico

---

## 🎉 Deploy Concluído!

Após seguir este guia, você terá:
- ✅ Backend rodando no Railway
- ✅ Frontend rodando no Railway
- ✅ Ambos conectados ao PostgreSQL do Render
- ✅ CORS configurado corretamente
- ✅ Variáveis de ambiente seguras

**URLs Finais:**
- Backend: `https://seu-backend.up.railway.app`
- Frontend: `https://seu-frontend.up.railway.app`
- API Docs: `https://seu-backend.up.railway.app/docs`

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Railway
2. Teste localmente com `npm run build` e `npm run preview`
3. Consulte a documentação do Railway: https://docs.railway.app
