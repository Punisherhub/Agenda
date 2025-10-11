from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, users, empresas, estabelecimentos, servicos, clientes, agendamentos, materiais, relatorios
from app.config import settings
from app.database import engine, Base

app = FastAPI(
    title="Agenda OnSell API",
    description="Sistema de agendamento empresarial para prestadores de serviços",
    version="2.0.0",
    debug=settings.debug
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas de autenticação
app.include_router(auth.router, prefix="/auth", tags=["🔐 Autenticação"])

# Rotas de usuários (funcionários)
app.include_router(users.router, prefix="/users", tags=["👥 Usuários"])

# Rotas empresariais
app.include_router(empresas.router, prefix="/empresas", tags=["🏢 Empresas"])
app.include_router(estabelecimentos.router, prefix="/estabelecimentos", tags=["🏪 Estabelecimentos"])
app.include_router(servicos.router, prefix="/servicos", tags=["⚙️ Serviços"])
app.include_router(materiais.router, prefix="/materiais", tags=["📦 Materiais"])

# Rotas de clientes e agendamentos
app.include_router(clientes.router, prefix="/clientes", tags=["👤 Clientes"])
app.include_router(agendamentos.router, prefix="/agendamentos", tags=["📅 Agendamentos"])

# Rotas de relatórios
app.include_router(relatorios.router, prefix="/relatorios", tags=["📊 Relatórios"])


@app.get("/")
async def root():
    return {"message": "Agenda OnSell API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)