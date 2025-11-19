# 📱 Como Testar no Celular Real

## Passo 1: Descobrir o IP da sua máquina

### No Windows:
```bash
ipconfig
```

Procure por **"Endereço IPv4"** na seção da sua conexão ativa (Wi-Fi ou Ethernet).

Exemplo de saída:
```
Adaptador de Rede sem Fio Wi-Fi:
   Endereço IPv4. . . . . . . . . : 192.168.1.100  ← ESTE É SEU IP
```

### No Linux/Mac:
```bash
ifconfig
# ou
ip addr show
```

Procure pelo IP que começa com `192.168.x.x` ou `10.0.x.x`

---

## Passo 2: Iniciar o Backend

⚠️ **IMPORTANTE:** Se o backend já estava rodando, **REINICIE** (Ctrl+C e inicie novamente) para aplicar as configurações de CORS!

Abra um terminal e execute:

```bash
cd C:\dev\AgendaOnSell\backend
python main.py
```

Deve mostrar algo como:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Deixe este terminal aberto!**

---

## Passo 3: Iniciar o Frontend

⚠️ **IMPORTANTE:** Se o frontend já estava rodando, **REINICIE** (Ctrl+C e inicie novamente) para aplicar as configurações de rede!

Abra **OUTRO terminal** e execute:

```bash
cd C:\dev\AgendaOnSell\frontend
npm run dev
```

Deve mostrar algo como:
```
  VITE v4.5.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.100:3000/  ← ESTE É O QUE VOCÊ VAI USAR
```

**O Vite já mostra o IP automaticamente na linha "Network"!**

**Deixe este terminal aberto também!**

---

## Passo 4: Conectar o Celular na MESMA Rede Wi-Fi

⚠️ **IMPORTANTE:** Seu celular **DEVE estar na mesma rede Wi-Fi** que seu computador!

1. Abra as configurações de Wi-Fi do celular
2. Conecte na **MESMA rede** que seu computador está conectado
3. Verifique se está conectado (ícone de Wi-Fi ativo)

---

## Passo 5: Acessar no Celular

### Abra o navegador do celular e digite:

```
http://192.168.1.100:3000
```

**Substitua `192.168.1.100` pelo SEU IP real que você descobriu no Passo 1!**

---

## ✅ O Que Você Deve Ver

1. **Primeira vez:** Tela de login mobile
   - Design mobile-first
   - Bottom com campos grandes
   - Botão "Entrar" grande e touch-friendly

2. **Após login:** Dashboard mobile
   - Bottom navigation na parte inferior
   - Cards de estatísticas
   - Quick actions

---

## 🔧 Troubleshooting (Se não funcionar)

### Problema 1: "Site não pode ser acessado"

**Solução A - Firewall do Windows:**
```bash
1. Abra "Firewall do Windows Defender"
2. Clique em "Permitir um aplicativo pelo Firewall"
3. Procure por "Node.js" ou "Python"
4. Marque as caixas "Privado" e "Público"
5. Clique em OK
```

**Solução B - Permitir manualmente:**
```bash
# Execute como Administrador no PowerShell:
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "FastAPI Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### Problema 2: "IP não encontrado"

1. Verifique se celular está na **MESMA rede Wi-Fi**
2. Tente desligar/ligar o Wi-Fi do celular
3. Tente desligar/ligar o Wi-Fi do computador

### Problema 3: "Vite não mostra o IP Network"

Configure manualmente no `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0', // Permite acesso externo
    port: 3000,
    // ... resto da config
  }
})
```

Reinicie o Vite depois.

---

## 🎯 Teste Rápido - Checklist

- [ ] Backend rodando na porta 8000
- [ ] Frontend rodando na porta 3000
- [ ] IP descoberto (192.168.x.x)
- [ ] Celular na mesma rede Wi-Fi
- [ ] Firewall permitindo conexões
- [ ] Acessou http://SEU_IP:3000 no celular
- [ ] ✅ Viu a tela de login mobile!

---

## 📸 Como Deve Ficar

### No Celular:
```
┌──────────────────────┐
│   [Agenda OnSell]    │  ← Header
│  Sistema de Agendam. │
├──────────────────────┤
│                      │
│   [Email field]      │  ← Input grande
│                      │
│   [Password field]   │  ← Input grande
│                      │
│   [  ENTRAR  ]       │  ← Botão grande
│                      │
│   Credenciais teste  │
├──────────────────────┤
│ 🏠  📅  👥  ☰       │  ← Bottom Nav (após login)
└──────────────────────┘
```

---

## 🚀 Comandos Resumidos

```bash
# Terminal 1 - Backend
cd C:\dev\AgendaOnSell\backend
python main.py

# Terminal 2 - Frontend
cd C:\dev\AgendaOnSell\frontend
npm run dev

# Descubra o IP
ipconfig

# No celular (Chrome/Safari)
http://SEU_IP:3000
```

---

## 💡 Dicas Extras

### Para facilitar o teste:

1. **Adicione aos favoritos** do navegador do celular
2. **Use QR Code** (gere em sites como qr-code-generator.com)
3. **Instale como PWA** (futuro): Adicionar à tela inicial

### Para testar diferentes resoluções:

- iPhone SE: 375x667
- iPhone 12/13: 390x844
- iPhone 12/13 Pro Max: 428x926
- Samsung Galaxy S21: 360x800

### Para debug remoto:

**Chrome:**
1. Conecte celular via USB
2. Ative "Depuração USB" no Android
3. Chrome DevTools → More tools → Remote devices

**Safari (iPhone):**
1. Conecte iPhone via USB
2. Ative "Web Inspector" no iPhone (Configurações → Safari → Avançado)
3. Safari no Mac → Develop → [Seu iPhone]

---

## 🎉 Pronto!

Agora você pode testar a versão mobile em um dispositivo real e ver:

✅ Touch feedback real
✅ Gestos nativos
✅ Velocidade real
✅ Layout em tela real
✅ Bottom navigation funcionando
✅ Slide-out menu

**Divirta-se testando! 📱🚀**
