from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from app.api import auth, users, empresas, estabelecimentos, servicos, clientes, agendamentos, materiais, relatorios, fidelidade, whatsapp, waha, waha_webhook, keepalive
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.keepalive_service import KeepAliveService

# Scheduler global para keep-alive
scheduler = BackgroundScheduler()


def scheduled_waha_ping():
    """Job agendado para fazer ping no WAHA a cada 10 minutos"""
    db = SessionLocal()
    try:
        KeepAliveService.ping_waha_instances(db)
    except Exception as e:
        print(f"[SCHEDULER] Erro ao executar ping WAHA: {str(e)}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia ciclo de vida da aplicação"""
    # Startup: Iniciar scheduler
    print("[STARTUP] Iniciando scheduler de keep-alive...")
    scheduler.add_job(
        scheduled_waha_ping,
        'interval',
        minutes=5,
        id='waha_keepalive',
        replace_existing=True
    )
    scheduler.start()
    print("[STARTUP] Scheduler iniciado - Pings a cada 5 minutos")

    yield  # Aplicação rodando

    # Shutdown: Parar scheduler
    print("[SHUTDOWN] Parando scheduler...")
    scheduler.shutdown()
    print("[SHUTDOWN] Scheduler parado")

app = FastAPI(
    title="Agenda OnSell API",
    description="Sistema de agendamento empresarial para prestadores de serviços",
    version="2.0.0",
    debug=settings.debug,
    lifespan=lifespan
)

# Handler para erros de validação (modo desenvolvimento - mostra detalhes)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("=== ERRO DE VALIDACAO ===")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Body: {exc.body}")
    print("========================")

    # Extrair erros de forma segura (evitar ValueError não serializável)
    errors = []
    for error in exc.errors():
        error_dict = {
            "loc": error.get("loc", []),
            "msg": error.get("msg", ""),
            "type": error.get("type", "")
        }
        # Adicionar input apenas se for serializável
        if "input" in error:
            try:
                error_dict["input"] = str(error["input"])
            except:
                error_dict["input"] = "<não serializável>"
        errors.append(error_dict)

    print(f"Erros formatados: {errors}")
    print("========================")

    return JSONResponse(
        status_code=422,
        content={"detail": errors}
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
    allow_origins=allowed_origins,  # Lista específica de origens
    allow_credentials=True,  # Permite envio de tokens de autenticação
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

# Rotas de WhatsApp (WAHA)
app.include_router(whatsapp.router, tags=["💬 WhatsApp"])
app.include_router(waha.router, prefix="/waha", tags=["📱 WAHA"])
app.include_router(waha_webhook.router, tags=["🔔 WAHA Webhooks"])

# Rotas de relatórios
app.include_router(relatorios.router, prefix="/relatorios", tags=["📊 Relatórios"])

# Rotas de keep-alive
app.include_router(keepalive.router, tags=["🔄 Keep-Alive"])


@app.get("/")
async def root():
    return {"message": "Agenda OnSell API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)