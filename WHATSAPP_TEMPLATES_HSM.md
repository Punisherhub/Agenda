# 📱 Guia de Aprovação de Templates HSM - Meta WhatsApp Business

## Visão Geral

Para que o sistema WhatsApp funcione em **PRODUÇÃO**, é necessário aprovar os templates de mensagem (HSM - Highly Structured Messages) na plataforma Meta Business Manager.

> **⚠️ Importante**: Mensagens iniciadas pela empresa (transacionais, reciclagem, lembretes) só podem ser enviadas usando templates pré-aprovados pela Meta. O modo "texto simples" funciona apenas para testes com número de teste.

---

## 📋 Templates Recomendados para Aprovação

### 1. Novo Agendamento
**Nome sugerido na Meta**: `confirmacao_servico_saas`
**Categoria**: TRANSACTIONAL
**Idioma**: Portuguese (BR)

**Estrutura do Template:**
```
**Cabeçalho**: Nenhum (opcional)

**Corpo**:
Olá {{1}}! Seu agendamento foi confirmado para {{2}} às {{3}}. Serviço: {{4}}. Valor: {{5}}. Até lá!

**Rodapé**: Nenhum (opcional)

**Botões**: Nenhum
```

**Mapeamento de Parâmetros**:
- `{{1}}` → `{nome_cliente}`
- `{{2}}` → `{data}` (formato: dd/mm/yyyy)
- `{{3}}` → `{hora}` (formato: HH:MM)
- `{{4}}` → `{servico}`
- `{{5}}` → `{valor}` (formato: R$ XX,XX)

---

### 2. Lembrete 24h Antes
**Nome sugerido na Meta**: `lembrete_24h_saas`
**Categoria**: TRANSACTIONAL
**Idioma**: Portuguese (BR)

**Estrutura do Template:**
```
**Corpo**:
Olá {{1}}! Lembramos que você tem agendamento amanhã às {{2}}. Serviço: {{3}}. Aguardamos você!

**Rodapé**: Nenhum

**Botões**: Nenhum
```

**Mapeamento de Parâmetros**:
- `{{1}}` → `{nome_cliente}`
- `{{2}}` → `{hora}` (formato: HH:MM)
- `{{3}}` → `{servico}`

---

### 3. Confirmação de Agendamento
**Nome sugerido na Meta**: `confirmacao_servico_saas`
**Categoria**: TRANSACTIONAL
**Idioma**: Portuguese (BR)

**Estrutura do Template:**
```
**Corpo**:
Olá {{1}}! Seu agendamento para {{2}} às {{3}} foi CONFIRMADO. Nos vemos em breve!

**Rodapé**: Nenhum

**Botões**: Nenhum
```

**Mapeamento de Parâmetros**:
- `{{1}}` → `{nome_cliente}`
- `{{2}}` → `{data}` (formato: dd/mm/yyyy)
- `{{3}}` → `{hora}` (formato: HH:MM)

---

### 4. Cancelamento
**Nome sugerido na Meta**: `cancelamento_servico_saas`
**Categoria**: TRANSACTIONAL
**Idioma**: Portuguese (BR)

**Estrutura do Template:**
```
**Corpo**:
Olá {{1}}. Informamos que seu agendamento de {{2}} às {{3}} foi cancelado. Entre em contato para reagendar.

**Rodapé**: Nenhum

**Botões**: Nenhum
```

**Mapeamento de Parâmetros**:
- `{{1}}` → `{nome_cliente}`
- `{{2}}` → `{data}` (formato: dd/mm/yyyy)
- `{{3}}` → `{hora}` (formato: HH:MM)

---

### 5. Reciclagem de Clientes Inativos ⭐
**Nome sugerido na Meta**: `aviso_inatividade_personalizado`
**Categoria**: MARKETING
**Idioma**: Portuguese (BR)

**Estrutura do Template:**
```
**Corpo**:
Olá {{1}}! Vimos que faz {{2}} meses que você não utiliza os serviços da {{3}} (última visita em {{4}}). Que tal agendar sua próxima manutenção agora?

**Rodapé**:
Toque no botão para agendar!

**Botões**:
[VISITAR SITE] → URL dinâmica: {{1}}
```

**Mapeamento de Parâmetros**:
- **Corpo**:
  - `{{1}}` → `{nome_cliente}`
  - `{{2}}` → `{meses_inativo}`
  - `{{3}}` → `{nome_empresa}`
  - `{{4}}` → `{data_ultimo_servico}` (formato: dd/Mês)
- **Botão**:
  - `{{1}}` → `{link_agendamento}` (URL completa)

---

## 🎯 Como Criar Templates no Meta Business Manager

### Passo 1: Acessar o Gerenciador de Templates
1. Acesse [Meta Business Manager](https://business.facebook.com/)
2. Selecione sua conta de negócios
3. Vá em **"WhatsApp Business"** → **"Gerenciador de Templates"**
4. Clique em **"Criar Template"**

### Passo 2: Configurar Template
1. **Nome**: Digite o nome sugerido (ex: `confirmacao_servico_saas`)
2. **Categoria**: Selecione `TRANSACTIONAL` ou `MARKETING` conforme indicado
3. **Idioma**: Selecione `Portuguese (BR)`

### Passo 3: Adicionar Conteúdo
1. **Cabeçalho** (opcional): Pode deixar em branco
2. **Corpo**: Cole o texto do template usando `{{1}}`, `{{2}}`, etc.
3. **Rodapé** (opcional): Adicione se especificado
4. **Botões** (opcional): Configure conforme necessário

### Passo 4: Enviar para Aprovação
1. Clique em **"Enviar"**
2. A Meta revisará o template (geralmente leva 24-48 horas)
3. Você receberá notificação quando for aprovado

### Passo 5: Configurar no AgendaOnSell
Após aprovação:
1. Acesse **WhatsApp** → **Templates** no AgendaOnSell
2. Role até **"Nomes dos Templates HSM (Meta)"**
3. Digite os nomes exatos dos templates aprovados
4. Clique em **Salvar**

---

## ⚙️ Configuração no Sistema

Após aprovar os templates na Meta, você deve configurar os **nomes dos templates aprovados** no AgendaOnSell:

### Na Interface Web
1. Acesse: **WhatsApp** → **Templates**
2. Seção: **"Nomes dos Templates HSM (Meta)"**
3. Preencha os campos:
   - **Novo Agendamento**: `confirmacao_servico_saas`
   - **Lembrete 24h**: `lembrete_24h_saas`
   - **Confirmação**: `confirmacao_servico_saas`
   - **Cancelamento**: `cancelamento_servico_saas`
   - **Reciclagem**: `aviso_inatividade_personalizado`
4. Salve as alterações

### Como o Sistema Funciona

```
┌─────────────────────────────────────────┐
│ Sistema Envia Mensagem                  │
└────────────┬────────────────────────────┘
             │
             ▼
      ┌──────────────────┐
      │ Meta Template     │ ◄── Se configurado
      │ Configurado?      │
      └─────┬─────┬──────┘
            │     │
        SIM │     │ NÃO
            │     │
            ▼     ▼
   ┌──────────┐  ┌───────────────┐
   │ USA HSM  │  │ USA FALLBACK  │
   │ Template │  │ Texto Simples │
   └──────────┘  └───────────────┘
       │               │
       └───────┬───────┘
               ▼
        ✅ Mensagem Enviada
```

**Modos de Operação**:
1. **Produção** (HSM): Usa templates aprovados → Funciona com qualquer cliente
2. **Desenvolvimento** (Fallback): Usa texto simples → Funciona só com número de teste

---

## ❓ FAQ

### Por que preciso aprovar templates?
Meta WhatsApp Business exige aprovação prévia para evitar spam e garantir qualidade das mensagens.

### Posso editar os templates depois?
Sim, mas qualquer edição precisa passar por nova aprovação da Meta.

### E se eu não configurar os templates HSM?
O sistema funcionará em modo "fallback" usando texto simples, que só funciona com números de teste da Meta.

### Quanto tempo leva para aprovar?
Geralmente 24-48 horas. Templates transacionais costumam ser mais rápidos.

### Posso ter templates diferentes?
Sim! Você pode criar seus próprios templates, desde que:
1. Sejam aprovados pela Meta
2. Mantenha a mesma ordem de parâmetros `{{1}}`, `{{2}}`, etc.
3. Configure os nomes corretos no AgendaOnSell

---

## 📞 Suporte

Se tiver dúvidas sobre a aprovação de templates:
- Documentação Meta: https://developers.facebook.com/docs/whatsapp/message-templates
- Suporte AgendaOnSell: Abra um ticket no sistema

---

**Última atualização**: 2025-12-15
