# Frontend - Agenda OnSell

Interface web para o sistema de agendamento empresarial.

## 🎯 Funcionalidades

### Para Funcionários:
- **Dashboard**: Visão geral da agenda do dia
- **Agendamentos**: Criar, listar, editar e cancelar
- **Clientes**: Gerenciar base de clientes
- **Serviços**: Visualizar serviços disponíveis
- **Calendário**: View visual da agenda

### Telas Principais:
1. **Login**: Autenticação de funcionários
2. **Dashboard**: Resumo do dia/semana
3. **Agenda**: Calendário de agendamentos
4. **Clientes**: Lista e busca de clientes
5. **Novo Agendamento**: Formulário de criação
6. **Perfil**: Dados do usuário

## 🛠️ Tecnologias Sugeridas

### Opção 1: React + TypeScript
```
- React 18
- TypeScript
- React Router
- Axios (API)
- React Query (Cache)
- Tailwind CSS
- React Hook Form
- Date-fns (Datas)
```

### Opção 2: Vue.js + TypeScript
```
- Vue 3
- TypeScript
- Vue Router
- Axios (API)
- Pinia (State)
- Tailwind CSS
- VueUse (Utils)
```

### Opção 3: Next.js (Full-Stack)
```
- Next.js 14
- TypeScript
- TailwindCSS
- React Query
- Zustand (State)
```

## 📱 Layout Responsivo

### Mobile First:
- Principalmente para tablets/celulares
- Interface touch-friendly
- Navegação simples
- Botões grandes

### Desktop:
- Layout dashboard
- Múltiplas colunas
- Atalhos de teclado
- Visão ampla da agenda

## 🔗 Integração com Backend

### API Base URL:
```
Development: http://localhost:8000
Production: https://api.agendaonsell.com
```

### Endpoints Principais:
```
GET /auth/me - Usuário atual
POST /auth/login - Login
GET /agendamentos/ - Lista agendamentos
POST /agendamentos/ - Criar agendamento
GET /clientes/buscar?q= - Buscar clientes
GET /servicos/ - Lista serviços
```

## 🎨 Design System

### Cores:
- Primary: #3B82F6 (Blue)
- Secondary: #10B981 (Green)
- Warning: #F59E0B (Orange)
- Danger: #EF4444 (Red)
- Gray: #6B7280

### Componentes:
- Buttons
- Forms
- Cards
- Modals
- Tables
- Calendar
- Loading States

## 📦 Estrutura Sugerida

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Integração com API
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Utilitários
│   ├── types/         # TypeScript types
│   └── styles/        # CSS/Styles
├── public/            # Assets estáticos
└── package.json       # Dependências
```

## 🚀 Próximos Passos

1. **Escolher tecnologia** (React/Vue/Next)
2. **Setup inicial** do projeto
3. **Configurar integração** com backend
4. **Criar componentes base**
5. **Implementar autenticação**
6. **Desenvolver telas principais**