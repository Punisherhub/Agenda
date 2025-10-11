# Formatação Automática de Campos - Cliente

## 📝 Implementação

Adicionada formatação automática nos campos CPF, telefone e CEP no modal de criação/edição de clientes.

## 🔧 Funções de Formatação

### 1. **formatCPF**
- **Input**: `12345678901`
- **Output**: `123.456.789-01`
- **Máscara**: `000.000.000-00`
- **Limite**: 14 caracteres (com formatação)

### 2. **formatTelefone**
- **Input (fixo)**: `1133334444`
- **Output**: `(11) 3333-4444`
- **Input (celular)**: `11999887766`
- **Output**: `(11) 99988-7766`
- **Máscara**: `(00) 00000-0000` ou `(00) 0000-0000`
- **Limite**: 15 caracteres (com formatação)

### 3. **formatCEP**
- **Input**: `12345678`
- **Output**: `12345-678`
- **Máscara**: `00000-000`
- **Limite**: 9 caracteres (com formatação)

## ✅ Funcionalidades

### Durante a Digitação
- ✅ Aplica formatação em tempo real
- ✅ Remove caracteres não numéricos automaticamente
- ✅ Limita o tamanho máximo do campo
- ✅ Suporta copiar/colar com formatação automática

### Ao Salvar
- ✅ Remove toda formatação antes de enviar para API
- ✅ Envia apenas números para o backend
- ✅ Validação de campos obrigatórios

### Ao Editar Cliente Existente
- ✅ Carrega dados já formatados
- ✅ Mantém formatação ao editar

## 📍 Arquivos Modificados

### 1. **`frontend/src/utils/formatters.ts`** (NOVO)
Arquivo utilitário centralizado com funções de formatação reutilizáveis:
- `formatCPF(value: string): string`
- `formatTelefone(value: string): string`
- `formatCEP(value: string): string`
- `removeFormatting(value: string): string`

### 2. **`frontend/src/components/ClienteModal.tsx`**
- Importa funções de `formatters.ts`
- Aplica formatação em tempo real nos inputs
- Remove formatação antes de enviar para API

### 3. **`frontend/src/pages/ClientesPage.tsx`**
- Importa `formatCPF` e `formatTelefone`
- Aplica formatação na **busca rápida** (linha 139)
- Aplica formatação na **tabela principal**:
  - CPF na coluna "Cliente" (linha 306)
  - Telefone na coluna "Contato" (linha 312)

## 🧪 Como Testar

### 1. Criação de Cliente
1. Abra o sistema e navegue para **Clientes**
2. Clique em **"Novo Cliente"**
3. Digite os seguintes valores:

   - **Telefone**: `11999887766`
     - Resultado: `(11) 99988-7766`

   - **CPF**: `12345678901`
     - Resultado: `123.456.789-01`

   - **CEP**: `01310100`
     - Resultado: `01310-100`

4. Salve o cliente

### 2. Visualização na Lista
1. Na página de **Clientes**, veja a tabela principal
2. Verifique que o **telefone** aparece formatado: `(11) 99988-7766`
3. Verifique que o **CPF** aparece formatado: `123.456.789-01`
4. Use a **Busca Rápida** e veja que também exibe formatado

### 3. Edição de Cliente
1. Clique em **"Editar"** em qualquer cliente
2. Veja que os campos aparecem já formatados
3. Altere os valores e veja a formatação automática
4. Salve e confirme que a lista atualiza com formatação

## 🎯 Benefícios

- ✅ Melhor UX - usuário não precisa digitar pontos/traços
- ✅ Validação visual - usuário vê formato correto imediatamente
- ✅ Consistência - todos os dados seguem mesmo padrão
- ✅ Compatibilidade - backend recebe apenas números
- ✅ Flexibilidade - suporta telefone fixo e celular

## 📚 Padrões Brasileiros

- **CPF**: 11 dígitos numéricos (formato: 000.000.000-00)
- **Telefone Fixo**: 10 dígitos (formato: (00) 0000-0000)
- **Telefone Celular**: 11 dígitos (formato: (00) 00000-0000)
- **CEP**: 8 dígitos (formato: 00000-000)
