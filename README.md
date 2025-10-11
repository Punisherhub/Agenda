# Agenda OnSell - Sistema de Agendamento Empresarial

Sistema completo de gestão de agendamentos para empresas de serviços (barbearias, oficinas, pet shops, salões de beleza, etc).

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM para Python
- **PostgreSQL** - Banco de dados relacional
- **Alembic** - Migrações de banco de dados
- **JWT** - Autenticação com tokens
- **Python 3.13**

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool moderna
- **TanStack Query** - Gerenciamento de estado servidor
- **React Router** - Roteamento
- **React Big Calendar** - Calendário com drag & drop
- **Recharts** - Gráficos e visualizações
- **Tailwind CSS** - Framework CSS utility-first

## 📋 Funcionalidades

### ✅ Implementado
- [x] Sistema de autenticação JWT completo
- [x] Gestão de clientes (CRUD completo)
- [x] Gestão de serviços (CRUD completo)
- [x] Gestão de materiais e estoque
- [x] Agendamentos com calendário drag & drop
- [x] Registro de consumo de materiais por serviço
- [x] Relatórios financeiros completos
  - Resumo financeiro (receita, custos, lucro)
  - Gráficos de receita diária
  - Análise de lucro por serviço
  - Consumo de materiais
  - Valor de estoque
- [x] Multi-estabelecimento
- [x] Sistema de roles (Admin, Manager, Vendedor, Atendente)
- [x] Atualização em tempo real dos relatórios

## 🗄️ Banco de Dados

### Conexão Render.com (PostgreSQL)
\`\`\`
Host: dpg-d2195c6uk2gs7380vemg-a.virginia-postgres.render.com
Port: 5432
Database: agenda_db
User: sasconv_user
Password: d5DezoH9fkvGQvAldNebbIAU0FWcm4Fe
SSL: Required
\`\`\`

**⚠️ IMPORTANTE**: Este banco já está configurado e populado com dados de teste. Não execute migrations sem backup!

### Estrutura
- **empresas** - Dados das empresas
- **estabelecimentos** - Filiais/locais
- **users** - Funcionários do sistema
- **clientes** - Clientes da empresa
- **servicos** - Serviços oferecidos
- **agendamentos** - Appointments
- **materiais** - Estoque de materiais
- **consumos_materiais** - Registro de uso de materiais

## 🛠️ Configuração do Ambiente

### Pré-requisitos
- Python 3.13+
- Node.js 18+
- PostgreSQL (já configurado no Render)

### 1. Clone o repositório
\`\`\`bash
git clone <url-do-repositorio>
cd AgendaOnSell
\`\`\`

### 2. Backend Setup

\`\`\`bash
# Navegar para pasta backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# A conexão com banco já está configurada no código
# Não é necessário criar .env pois usa conexão direta

# Executar servidor (porta 8000)
python main.py
# ou
uvicorn main:app --reload --port 8000
\`\`\`

### 3. Frontend Setup

\`\`\`bash
# Navegar para pasta frontend
cd frontend

# Instalar dependências
npm install

# Executar em desenvolvimento (porta 3000)
npm run dev

# Build para produção
npm run build
\`\`\`

## 🔐 Usuários de Teste

### Administrador
- **Email**: admin@barbeariamoderna.com
- **Senha**: 123456
- **Role**: ADMIN
- **Estabelecimento**: Barbearia Moderna - Centro

### Vendedor
- **Email**: carlos@barbeariamoderna.com
- **Senha**: 123456
- **Role**: VENDEDOR
- **Estabelecimento**: Barbearia Moderna - Centro

## 📁 Estrutura do Projeto

\`\`\`
AgendaOnSell/
├── backend/
│   ├── app/
│   │   ├── api/              # Endpoints FastAPI
│   │   │   ├── auth.py       # Autenticação
│   │   │   ├── agendamentos.py
│   │   │   ├── clientes.py
│   │   │   ├── servicos.py
│   │   │   ├── materiais.py
│   │   │   └── relatorios.py
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Lógica de negócio
│   │   ├── utils/            # Utilitários
│   │   ├── config.py         # Configurações
│   │   └── database.py       # Conexão DB
│   ├── alembic/              # Migrations
│   ├── main.py               # Entry point
│   └── requirements.txt      # Dependências Python
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   └── App.tsx           # Componente raiz
│   ├── package.json          # Dependências Node
│   └── vite.config.ts        # Configuração Vite
│
├── .gitignore
├── CLAUDE.md                 # Documentação do projeto
└── README.md                 # Este arquivo
\`\`\`

## 🔧 Comandos Úteis

### Backend

\`\`\`bash
# Testar conexão com banco
cd backend && python -c "from app.database import engine; print('DB OK')"

# Criar migration
cd backend && alembic revision --autogenerate -m "Description"

# Aplicar migrations
cd backend && alembic upgrade head

# Reverter migration
cd backend && alembic downgrade -1

# Executar testes
cd backend && pytest
\`\`\`

### Frontend

\`\`\`bash
# Desenvolvimento
cd frontend && npm run dev

# Build
cd frontend && npm run build

# Preview build
cd frontend && npm run preview

# Type check
cd frontend && npm run type-check

# Lint
cd frontend && npm run lint
\`\`\`

## 🌐 URLs

- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000

## 📊 Relatórios Financeiros

O sistema calcula automaticamente:
- **Receita Total**: Soma dos valores finais de agendamentos concluídos
- **Custos de Materiais**: Soma dos consumos de materiais registrados
- **Lucro Bruto**: Receita - Custos
- **Margem de Lucro**: (Lucro / Receita) × 100
- **Taxa de Conversão**: (Concluídos / Total) × 100

### Gráficos Disponíveis
1. Receita Diária (linha)
2. Lucro por Serviço (barras)
3. Valor do Estoque (barras)
4. Distribuição de Custos (pizza)

## 🎯 Próximos Passos (Sugestões)

- [ ] Sistema de notificações (email/SMS)
- [ ] Relatório de comissões de vendedores
- [ ] Dashboard administrativo avançado
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Sistema de avaliações de clientes
- [ ] Integração com pagamentos online
- [ ] App mobile (React Native)
- [ ] Multi-idioma (i18n)

## 📝 Convenções de Código

### Backend
- PEP 8 para Python
- Nomenclatura em português para domínio de negócio
- Type hints sempre que possível
- Docstrings em funções importantes

### Frontend
- ESLint + TypeScript strict mode
- Nomenclatura em camelCase
- Componentes em PascalCase
- Tailwind CSS para estilização

## 🐛 Problemas Conhecidos

- Warning do bcrypt (funcional, mas mostra aviso)
- Precisa configurar CORS se deployar em domínios diferentes

## 📄 Licença

Este é um projeto de demonstração/educacional.

## 👥 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (\`git checkout -b feature/AmazingFeature\`)
3. Commit suas mudanças (\`git commit -m 'Add some AmazingFeature'\`)
4. Push para a branch (\`git push origin feature/AmazingFeature\`)
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação completa em \`CLAUDE.md\`.

---

**Desenvolvido com ❤️ usando FastAPI + React**
