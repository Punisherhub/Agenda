# 📱 Versão Mobile - Agenda OnSell

## 🎯 Objetivo

Criar uma versão mobile completamente separada do desktop, sem misturar códigos, com layout otimizado para dispositivos móveis.

## ✅ O Que Foi Criado

### 1. Estrutura de Pastas
```
frontend/src/
├── mobile/
│   ├── pages/                    # Páginas mobile
│   │   └── MobileLoginPage.tsx   ✅ CRIADO
│   ├── components/               # Componentes mobile
│   │   ├── MobileProtectedRoute.tsx       ✅ CRIADO
│   │   └── MobileRoleProtectedRoute.tsx   ✅ CRIADO
│   ├── layouts/
│   │   └── MobileLayout.tsx      ✅ CRIADO
│   ├── styles/
│   │   └── mobile.css            ✅ CRIADO
│   └── MobileApp.tsx             ✅ CRIADO
├── utils/
│   ├── deviceDetector.ts         ✅ CRIADO
│   └── useDeviceDetect.ts        ✅ CRIADO
```

### 2. Arquivos Principais Criados

#### `utils/deviceDetector.ts`
```typescript
// Funções para detectar dispositivo
- isMobileDevice(): boolean
- getDeviceType(): 'mobile' | 'tablet' | 'desktop'
- isIOS(): boolean
- isAndroid(): boolean
```

#### `utils/useDeviceDetect.ts`
```typescript
// Hook React para detecção de dispositivo
export const useDeviceDetect = () => {
  const { isMobile, deviceType } = useDeviceDetect()
  // ...
}
```

#### `mobile/MobileApp.tsx`
- Aplicação mobile completa
- Roteamento separado
- QueryClient configurado
- Rotas protegidas por autenticação e role

#### `mobile/layouts/MobileLayout.tsx`
**Features:**
- ✅ Bottom Navigation (4 botões principais)
- ✅ Slide-out Menu lateral
- ✅ Header fixo com nome do usuário
- ✅ Logout integrado
- ✅ Controle de acesso por role (admin/manager)

#### `mobile/components/MobileProtectedRoute.tsx`
- Proteção de rotas por autenticação
- Previne pull-to-refresh
- Redireciona para /login se não autenticado

#### `mobile/components/MobileRoleProtectedRoute.tsx`
- Proteção por roles (admin, manager, vendedor, atendente)
- Tela de acesso negado mobile-friendly

#### `mobile/pages/MobileLoginPage.tsx`
**Features:**
- ✅ Design mobile-first
- ✅ Botões touch-friendly (44px mínimo)
- ✅ Show/hide password
- ✅ Loading state
- ✅ Error handling
- ✅ Auto-focus e auto-complete
- ✅ Credenciais de teste visíveis

#### `mobile/styles/mobile.css`
**Includes:**
- Touch-friendly styles
- Mobile-specific animations
- Safe area support (notch devices)
- Swipe indicators
- Mobile modals
- Action sheets
- FAB button styles
- List items com active states

## 🚀 Como Integrar ao App Atual

### Opção 1: Device Detection Automático

Edite `frontend/src/main.tsx` ou crie `frontend/src/index.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { isMobileDevice } from './utils/deviceDetector'
import MobileApp from './mobile/MobileApp'
import App from './App' // Desktop app

const root = ReactDOM.createRoot(document.getElementById('root')!)

// Detecta dispositivo e renderiza versão apropriada
if (isMobileDevice()) {
  root.render(
    <React.StrictMode>
      <MobileApp />
    </React.StrictMode>
  )
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
```

### Opção 2: Componente Router Universal

Crie `frontend/src/AppRouter.tsx`:

```typescript
import React from 'react'
import { useDeviceDetect } from './utils/useDeviceDetect'
import MobileApp from './mobile/MobileApp'
import DesktopApp from './App'

const AppRouter: React.FC = () => {
  const { isMobile } = useDeviceDetect()

  return isMobile ? <MobileApp /> : <DesktopApp />
}

export default AppRouter
```

Então em `main.tsx`:
```typescript
import AppRouter from './AppRouter'

root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)
```

## 📋 Próximas Páginas a Criar

### 1. MobileDashboardPage.tsx
```typescript
import React from 'react'
import MobileLayout from '../layouts/MobileLayout'

const MobileDashboardPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="p-4">
        {/* Cards de resumo */}
        {/* Quick actions */}
        {/* Próximos agendamentos */}
      </div>
    </MobileLayout>
  )
}
```

**Features a implementar:**
- Cards touch-friendly com métricas
- Lista de próximos agendamentos
- Quick actions (novo agendamento, novo cliente)
- Pull-to-refresh

### 2. MobileAgendamentosPage.tsx
**Features a implementar:**
- Calendário mobile otimizado (considerar `react-calendar` ou versão simplificada)
- Lista de agendamentos por data
- Swipe para editar/deletar
- FAB para criar novo agendamento
- Modal fullscreen para detalhes
- Filtros por status

### 3. MobileClientesPage.tsx
**Features a implementar:**
- Lista de clientes com search
- Swipe para quick actions
- FAB para novo cliente
- Modal fullscreen para detalhes/edição
- Ver histórico de agendamentos do cliente

### 4. MobileServicosPage.tsx (Admin/Manager apenas)
**Features a implementar:**
- Grid de serviços
- Modal fullscreen para criar/editar
- Indicadores visuais de categoria/cor

### 5. MobileMateriaisPage.tsx (Admin/Manager apenas)
**Features a implementar:**
- Lista de materiais
- Badge de alerta para estoque baixo
- Modal fullscreen para criar/editar
- Controle de quantidade com +/-

### 6. MobileRelatoriosPage.tsx (Admin/Manager apenas)
**Features a implementar:**
- Cards de resumo financeiro
- Gráficos mobile-friendly (Recharts funciona bem)
- Filtros por data
- Scroll horizontal para múltiplos gráficos

## 🎨 Design Guidelines

### Espaçamento
- Padding padrão: 16px (p-4)
- Gap entre elementos: 12px (gap-3)
- Touch targets mínimos: 44x44px

### Typography
- Títulos: text-xl ou text-2xl
- Corpo: text-base (16px - evita zoom no iOS)
- Labels: text-sm
- Font-weight: medium ou semibold para destaque

### Colors (Tailwind)
- Primary: blue-600
- Success: green-600
- Error: red-600
- Warning: yellow-600
- Gray scale: gray-50 a gray-900

### Buttons
```tsx
// Primary
className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"

// Secondary
className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold"

// Danger
className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold"
```

### Cards
```tsx
className="bg-white rounded-lg shadow-sm p-4 active:bg-gray-50"
```

### Lists
```tsx
className="divide-y divide-gray-200"
// Item
className="py-4 px-4 active:bg-gray-50"
```

## 🔧 Componentes Reutilizáveis a Criar

### MobileModal.tsx
```typescript
interface MobileModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}
```

### MobileActionSheet.tsx
```typescript
// Bottom sheet com ações
interface MobileActionSheetProps {
  isOpen: boolean
  onClose: () => void
  actions: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    variant?: 'default' | 'danger'
  }>
}
```

### MobileFAB.tsx
```typescript
interface MobileFABProps {
  onClick: () => void
  icon: ReactNode
}
```

### MobileCard.tsx
```typescript
interface MobileCardProps {
  title?: string
  children: React.ReactNode
  onClick?: () => void
}
```

## 🧪 Como Testar

### 1. Chrome DevTools
1. Abra DevTools (F12)
2. Clique no ícone de dispositivo (Toggle device toolbar)
3. Selecione iPhone ou Android
4. Recarregue a página

### 2. Teste Real
- Acesse via IP local no celular
- Exemplo: `http://192.168.1.100:3000`
- Use ngrok para teste externo

### 3. Responsivo
Teste nos breakpoints:
- Mobile: 375px (iPhone SE)
- Mobile: 390px (iPhone 12/13)
- Mobile: 414px (iPhone Plus)
- Tablet: 768px (iPad)

## 📱 PWA (Opcional - Futuro)

Para transformar em PWA:

1. Criar `public/manifest.json`
2. Adicionar Service Worker
3. Icons em diferentes tamanhos
4. Meta tags no index.html

## 🚀 Deployment

A versão mobile e desktop compartilham o mesmo build!

**Não precisa de deploy separado.**

O navegador detecta automaticamente e serve a versão apropriada.

## 📚 Recursos

- [React Big Calendar](https://github.com/jquense/react-big-calendar) - Para desktop
- [React Calendar](https://github.com/wojtekmaj/react-calendar) - Alternativa mobile-friendly
- [React Swipeable](https://github.com/FormidableLabs/react-swipeable) - Gestos swipe
- [Framer Motion](https://www.framer.com/motion/) - Animações suaves

## ⚡ Performance

- Lazy load páginas: `React.lazy(() => import('./page'))`
- Virtualize listas longas: `react-window`
- Optimize images
- Code splitting por rota

## 🎯 Status Atual

```
✅ Core Infrastructure (100%)
✅ Device Detection (100%)
✅ Mobile Routing (100%)
✅ Mobile Layout (100%)
✅ Login Page (100%)
⏳ Dashboard Page (0%)
⏳ Agendamentos Page (0%)
⏳ Clientes Page (0%)
⏳ Servicos Page (0%)
⏳ Materiais Page (0%)
⏳ Relatorios Page (0%)
⏳ Shared Components (0%)
```

## 🤝 Próximos Passos Recomendados

1. ✅ Integrar MobileApp no main.tsx/index.tsx
2. Criar MobileDashboardPage
3. Criar componentes reutilizáveis (Modal, FAB, Card)
4. Implementar MobileAgendamentosPage
5. Implementar demais páginas
6. Testes em dispositivos reais
7. Otimizações de performance
8. Considerar PWA

---

**Estrutura criada com maestria para não misturar código desktop e mobile!** 🎉
