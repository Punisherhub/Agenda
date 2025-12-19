from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api import auth, users, empresas, estabelecimentos, servicos, clientes, agendamentos, materiais, relatorios, fidelidade, whatsapp
from app.config import settings
from app.database import engine, Base

app = FastAPI(
    title="Agenda OnSell API",
    description="Sistema de agendamento empresarial para prestadores de serviços",
    version="2.0.0",
    debug=settings.debug
)

# Handler para erros de validação (modo desenvolvimento - mostra detalhes)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("=== ERRO DE VALIDACAO ===")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Erros: {exc.errors()}")
    print(f"Body: {exc.body}")
    print("========================")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Configuração CORS - Aceita múltiplas origens Railway
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://agenda-onsell.up.railway.app",
    "https://agenda-production-fdff.up.railway.app",
]

# Adicionar origens customizadas via env
if settings.cors_origins and settings.cors_origins != "*":
    allowed_origins.extend(settings.cors_origins.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporariamente permite todas até debug
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
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

# Rotas de fidelidade
app.include_router(fidelidade.router, tags=["🎁 Fidelidade"])

# Rotas de WhatsApp
app.include_router(whatsapp.router, tags=["💬 WhatsApp"])

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