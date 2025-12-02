# 🔧 Troubleshooting - Guia de Solução de Problemas

## ❌ Problema: "stream did not contain valid UTF-8" durante build

### Sintoma
```
Nixpacks build failed
Error: Error reading app/schemas/__init__.py
Caused by: stream did not contain valid UTF-8
```

### Causa
Caracteres especiais mal codificados em arquivos Python (acentuação).

### ✅ Solução Aplicada
1. Corrigido encoding em `backend/app/schemas/__init__.py`
2. Removido caractere especial "ç" do comentário (linha 22)
3. Adicionado `pytz` ao `requirements.txt`

### Prevenção
- **Sempre use comentários sem acentuação em arquivos Python**
- Use apenas ASCII em comentários quando possível
- Se precisar usar acentos, garanta que o arquivo está em UTF-8

---

## ❌ Problema: "pip: command not found" durante build

### Sintoma
```
stage-0 RUN pip install -r requirements.txt
/bin/bash: line 1: pip: command not found
```

### Causa
Configuração customizada de Nixpacks pode interferir com auto-detecção do Python.

### ✅ Solução Aplicada
1. Removidos arquivos de configuração customizada:
   - `backend/nixpacks.toml`
   - `backend/runtime.txt`
   - `backend/.python-version`
   - `frontend/nixpacks.toml`
2. Mantida apenas configuração mínima em `railway.json`
3. Railway/Nixpacks agora detecta automaticamente Python a partir de `requirements.txt`

### Prevenção
- **Deixe Nixpacks auto-detectar quando possível**
- Só adicione configuração customizada se realmente necessário
- `requirements.txt` é suficiente para Railway detectar projeto Python

---

## ❌ Problema: ValueError: Unknown constraint decimal_places

### Sintoma
```
ValueError: Unknown constraint decimal_places
File "/app/app/schemas/servico.py", line 10
```

### Causa
**Incompatibilidade de versão do Pydantic**. Railway usa Pydantic 2.x mais recente, que não suporta o constraint `decimal_places` (foi removido na v2).

### ✅ Solução Aplicada
1. Removido `decimal_places=2` de todos os campos `Decimal` nos schemas
2. Mantido apenas `ge=0` para validação de valor mínimo
3. Validação de casas decimais deve ser feita na camada de modelo ou service se necessário

**Exemplo da mudança:**
```python
# ❌ Antes (Pydantic 1.x)
preco: Decimal = Field(..., ge=0, decimal_places=2)

# ✅ Depois (Pydantic 2.x)
preco: Decimal = Field(..., ge=0)
```

### Arquivos Corrigidos
- `backend/app/schemas/servico.py:10` - ServicoCreate
- `backend/app/schemas/servico.py:21` - ServicoUpdate

### Prevenção
- **Sempre use constraints compatíveis com Pydantic 2.x**
- Evite: `decimal_places`, `max_digits` (removidos na v2)
- Use: `ge`, `le`, `gt`, `lt`, `min_length`, `max_length` (compatíveis)
- Consulte: [Pydantic v2 Migration Guide](https://docs.pydantic.dev/latest/migration/)

---

## ❌ Problema: SyntaxError: Unexpected token 'export' no postcss.config.js

### Sintoma
```
Failed to load PostCSS config
SyntaxError: Unexpected token 'export'
/app/postcss.config.js:1
export default {
^^^^^^
```

### Causa
**Sintaxe ESM em arquivo CommonJS**. Railway/Node.js está esperando sintaxe CommonJS mas o arquivo usa `export default` (ESM).

### ✅ Solução Aplicada
Mudar `postcss.config.js` de sintaxe ESM para CommonJS:

```javascript
// ❌ Antes (ESM)
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// ✅ Depois (CommonJS)
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Prevenção
- **Use CommonJS em arquivos de configuração** quando não tiver `"type": "module"` no package.json
- Ou adicione `"type": "module"` no package.json e mude TODOS os arquivos config para ESM
- Railway/Docker geralmente funciona melhor com CommonJS por padrão

---

## ❌ Problema: Blocked request - host not allowed (Vite preview)

### Sintoma
```
Blocked request. This host ("agenda-onsell.up.railway.app") is not allowed.
To allow this host, add "agenda-onsell.up.railway.app" to `preview.allowedHosts` in vite.config.js.
```

### Causa
**Vite preview mode bloqueia hosts não autorizados** por segurança. Railway usa domínios dinâmicos que precisam ser explicitamente permitidos.

### ✅ Solução Aplicada
Adicionar `allowedHosts` no `vite.config.ts`:

```typescript
preview: {
  host: '0.0.0.0',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  allowedHosts: [
    'agenda-onsell.up.railway.app',  // Seu domínio específico
    '.railway.app',                   // Wildcard para qualquer subdomínio railway.app
  ],
},
```

### Prevenção
- **Sempre adicione allowedHosts em preview mode** para produção
- Use wildcards (`.railway.app`) para cobrir todos os subdomínios
- Para desenvolvimento local, `0.0.0.0` é suficiente

---

## ❌ Problema: CORS Error no Frontend

### Sintoma
```
Access to XMLHttpRequest at 'https://backend.app' from origin 'https://frontend.app'
has been blocked by CORS policy
```

### Causa
Backend não tem o domínio do frontend na lista de origens permitidas.

### ✅ Solução
1. No Railway, acesse o service **Backend**
2. Vá em **Variables**
3. Edite `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://seu-frontend.up.railway.app
   ```
4. Railway faz redeploy automático

### Múltiplas Origens
Para permitir múltiplas origens (dev + prod):
```env
CORS_ORIGINS=https://frontend-prod.up.railway.app,http://localhost:3000
```

---

## ❌ Problema: Backend não conecta ao banco

### Sintoma
```
sqlalchemy.exc.OperationalError: could not connect to server
```

### Causa
`DATABASE_URL` incorreta ou banco inacessível.

### ✅ Solução
1. Verificar se `DATABASE_URL` está correta:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
   ```
2. Testar conexão manualmente:
   ```bash
   psql "postgresql://sasconv_user:password@dpg-XXX.render.com:5432/agenda_db?sslmode=require"
   ```
3. Verificar se o banco está ativo no Render.com
4. Verificar se `?sslmode=require` está presente

---

## ❌ Problema: Frontend não encontra API

### Sintoma
```
GET /api/auth/me 404 (Not Found)
```

### Causa
`VITE_API_URL` não configurado ou incorreto.

### ✅ Solução
1. No Railway, acesse o service **Frontend**
2. Vá em **Variables**
3. Adicione/Edite:
   ```env
   VITE_API_URL=https://seu-backend.up.railway.app
   ```
4. **IMPORTANTE**: Não coloque barra `/` no final da URL!

### Verificação
Teste diretamente no navegador:
```
https://seu-backend.up.railway.app/health
```
Deve retornar: `{"status": "healthy"}`

---

## ❌ Problema: Build do Frontend falha

### Sintoma
```
npm ERR! code ELIFECYCLE
npm ERR! errno 2
```

### Causa
Erros de TypeScript ou dependências faltando.

### ✅ Solução
1. **Testar build localmente:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Se falhar localmente:**
   ```bash
   npm run type-check
   ```
   Corrigir erros de TypeScript

3. **Limpar cache e reinstalar:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

4. **No Railway:**
   - Verificar logs de build
   - Garantir que todas as dependências estão em `package.json`

---

## ❌ Problema: Python version mismatch

### Sintoma
```
ERROR: This project requires Python 3.13
```

### Causa
Railway detectou versão errada do Python.

### ✅ Solução
1. Verificar `backend/runtime.txt`:
   ```
   python-3.13.0
   ```

2. Verificar `backend/.python-version`:
   ```
   3.13.0
   ```

3. Verificar `backend/nixpacks.toml`:
   ```toml
   [phases.setup]
   nixPkgs = ["python313", "postgresql"]
   ```

---

## ❌ Problema: Variável de ambiente não é reconhecida

### Sintoma
Aplicação usa valor padrão ao invés do configurado.

### Causa
Variável não foi definida no Railway ou tem nome errado.

### ✅ Solução
1. No Railway, ir em **Variables**
2. Verificar se variável está presente
3. Verificar se nome está exatamente igual ao código
4. **IMPORTANTE**: Variáveis são case-sensitive!

### Variáveis Obrigatórias

**Backend:**
- `DATABASE_URL` ✅
- `SECRET_KEY` ✅
- `DEBUG` ✅
- `CORS_ORIGINS` ✅

**Frontend:**
- `VITE_API_URL` ✅
- `NODE_ENV` (opcional)

---

## ❌ Problema: Nixpacks não detecta corretamente o projeto

### Sintoma
```
ERROR: No supported language detected
```

### Causa
Arquivos de configuração não estão no root correto.

### ✅ Solução
1. **Verificar Root Directory no Railway:**
   - Backend: `backend`
   - Frontend: `frontend`

2. **Verificar arquivos necessários:**
   - Backend: `requirements.txt` em `backend/`
   - Frontend: `package.json` em `frontend/`

3. **Verificar se Root Directory está correto**:
   - No Railway Dashboard → Settings → Root Directory
   - Backend deve estar em: `backend`
   - Frontend deve estar em: `frontend`

---

## ❌ Problema: Endpoint /health retorna 404 após deploy

### Sintoma
```
GET https://seu-backend.up.railway.app/health
404 Not Found
```

### Causa
**Root Directory não configurado no Railway** - Aplicação está procurando `main.py` no lugar errado.

### ✅ Solução
1. **No Railway Dashboard do service Backend:**
   - Vá em **Settings**
   - Role até **Root Directory**
   - Configure como: `backend`
   - Salve (Railway faz redeploy automático)

2. **Verificar se aplicação está rodando:**
   - Vá em **Deployments** → Último deployment
   - Clique em **View Logs**
   - Procure por: `Application startup complete`
   - Deve mostrar: `Uvicorn running on http://0.0.0.0:XXXX`

3. **Testar endpoints:**
   ```bash
   # Endpoint raiz
   curl https://seu-backend.up.railway.app/
   # Deve retornar: {"message": "Agenda OnSell API", "version": "1.0.0"}

   # Health check
   curl https://seu-backend.up.railway.app/health
   # Deve retornar: {"status": "healthy"}
   ```

### Verificação Rápida
Se após configurar Root Directory ainda não funcionar:
1. Verificar se `requirements.txt` está em `backend/requirements.txt`
2. Verificar se `main.py` está em `backend/main.py`
3. Ver logs de build para erros durante instalação de dependências

---

## ❌ Problema: App crashes após deploy

### Sintoma
```
Application error
```

### Causa
Erro no código, variável faltando, ou comando de start incorreto.

### ✅ Solução
1. **Ver logs no Railway:**
   - Deployments → Deployment mais recente → Logs

2. **Verificar Start Command:**
   - Backend: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Frontend: `npm run preview -- --host 0.0.0.0 --port $PORT`

3. **Testar localmente:**
   ```bash
   # Backend
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000

   # Frontend
   cd frontend
   npm run build
   npm run preview
   ```

---

## ❌ Problema: ValueError - password cannot be longer than 72 bytes (bcrypt)

### Sintoma
```
ValueError: password cannot be longer than 72 bytes, truncate manually if necessary
File "/app/app/utils/security.py", line 12, in verify_password
```

### Causa
**Bcrypt tem limite de 72 bytes**. Senhas longas ou com caracteres especiais podem exceder esse limite quando convertidas para bytes.

### ✅ Solução Aplicada
Truncar senhas para 72 bytes antes de hash/verificação em `security.py`:

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Bcrypt has a 72 byte limit, truncate if necessary
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    # Bcrypt has a 72 byte limit, truncate if necessary
    if isinstance(password, str):
        password = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(password)
```

### Prevenção
- **Sempre truncar senhas para 72 bytes** ao usar bcrypt
- Ou usar outro algoritmo como Argon2 (sem limite de tamanho)
- Considerar usar hash da senha (SHA256) antes do bcrypt para senhas muito longas

---

## ❌ Problema: Login não funciona

### Sintoma
Erro 401 ou "Invalid credentials" sempre.

### Causa
`SECRET_KEY` não está configurada ou mudou após criar usuários.

### ✅ Solução
1. Verificar se `SECRET_KEY` está definida no Railway
2. **NUNCA mude `SECRET_KEY` em produção!**
3. Se precisar mudar, todos os usuários precisam fazer login novamente

---

## ❌ Problema: Migrations não rodaram

### Sintoma
Erro ao acessar tabelas: "relation does not exist".

### Causa
Banco existe mas tabelas não foram criadas.

### ✅ Solução
**As migrations não rodam automaticamente no Railway!**

Opções:

1. **Rodar migrations localmente:**
   ```bash
   cd backend
   # Configure DATABASE_URL local
   export DATABASE_URL="postgresql://..."
   alembic upgrade head
   ```

2. **Railway CLI:**
   ```bash
   railway run alembic upgrade head
   ```

3. **Adicionar ao start command (não recomendado):**
   ```bash
   alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

**⚠️ Atenção:** No nosso caso, o banco já está populado no Render.com, então não precisa rodar migrations!

---

## 🆘 Checklist de Debug

Quando algo não funciona:

1. [ ] Ver logs no Railway (Deployments → Latest)
2. [ ] Testar endpoints diretamente no navegador
3. [ ] Verificar variáveis de ambiente
4. [ ] Testar build localmente
5. [ ] Verificar Root Directory
6. [ ] Verificar Start Command
7. [ ] Verificar CORS no DevTools → Network
8. [ ] Verificar conexão com banco

---

## 📚 Recursos Úteis

- **Railway Docs**: https://docs.railway.app
- **Nixpacks Docs**: https://nixpacks.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Vite Docs**: https://vitejs.dev

---

## ✅ Tudo Funcionando?

Se seguiu este guia e tudo está OK:

- ✅ Backend responde em `/health`
- ✅ Frontend abre sem erros
- ✅ Login funciona
- ✅ API responde corretamente
- ✅ Sem erros CORS

**Parabéns! Deploy concluído com sucesso! 🎉**
