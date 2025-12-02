from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService
from app.utils.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    print(f"[REGISTER] Tentando registrar: email={user_data.email}, username={user_data.username}")

    # Check if user already exists
    existing_user = AuthService.get_user_by_email(db, user_data.email)
    if existing_user:
        print(f"[REGISTER] Email já existe: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    existing_username = AuthService.get_user_by_username(db, user_data.username)
    if existing_username:
        print(f"[REGISTER] Username já existe: {user_data.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    print(f"[REGISTER] Criando usuário...")
    try:
        user = AuthService.create_user(db, user_data)
        print(f"[REGISTER] Usuário criado com sucesso: {user.email}")
        return user
    except Exception as e:
        print(f"[REGISTER] ERRO ao criar usuário: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating user: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token."""
    login_result = AuthService.login_user(db, login_data)

    return Token(
        access_token=login_result["access_token"],
        token_type=login_result["token_type"],
        expires_in=login_result["expires_in"],
        user=login_result["user"]
    )


@router.post("/refresh", response_model=Token)
async def refresh_token():
    """Refresh access token using refresh token."""
    return {"message": "Token refresh endpoint - to be implemented"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current authenticated user."""
    # Carregar o estabelecimento para obter o nome
    user = db.query(User).options(joinedload(User.estabelecimento)).filter(User.id == current_user.id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Criar response com estabelecimento_nome
    estabelecimento_nome = user.estabelecimento.nome if user.estabelecimento else None

    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        cpf=user.cpf,
        telefone=user.telefone,
        cargo=user.cargo,
        role=user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        avatar_url=user.avatar_url,
        timezone=user.timezone,
        horario_inicio=user.horario_inicio,
        horario_fim=user.horario_fim,
        dias_trabalho=user.dias_trabalho,
        estabelecimento_id=user.estabelecimento_id,
        estabelecimento_nome=estabelecimento_nome
    )