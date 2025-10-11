from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.utils.auth import get_current_active_user
from app.models.user import User
from app.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialResponse, MaterialList,
    ConsumoMaterialCreate, ConsumoMaterialResponse
)
from app.services.material_service import MaterialService

router = APIRouter()


def check_user_has_estabelecimento(current_user: User):
    """Verificar se usuário está vinculado a um estabelecimento."""
    if not current_user.estabelecimento_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário deve estar vinculado a um estabelecimento"
        )


@router.get("/", response_model=MaterialList)
async def listar_materiais(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    nome: Optional[str] = None,
    ativo: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar materiais do estabelecimento"""
    check_user_has_estabelecimento(current_user)

    materiais, total = MaterialService.get_materiais_by_estabelecimento(
        db=db,
        estabelecimento_id=current_user.estabelecimento_id,
        skip=skip,
        limit=limit,
        nome=nome,
        ativo=ativo
    )

    return MaterialList(materiais=materiais, total=total)


@router.post("/", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def criar_material(
    material_data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Criar novo material"""
    check_user_has_estabelecimento(current_user)

    material = MaterialService.create_material(
        db=db,
        material_data=material_data,
        current_user=current_user
    )
    return material


@router.get("/{material_id}", response_model=MaterialResponse)
async def obter_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Obter material por ID"""
    check_user_has_estabelecimento(current_user)

    material = MaterialService.get_material(
        db=db,
        material_id=material_id,
        estabelecimento_id=current_user.estabelecimento_id
    )
    return material


@router.put("/{material_id}", response_model=MaterialResponse)
async def atualizar_material(
    material_id: int,
    material_data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Atualizar material"""
    check_user_has_estabelecimento(current_user)

    material = MaterialService.update_material(
        db=db,
        material_id=material_id,
        material_data=material_data,
        current_user=current_user
    )
    return material


@router.delete("/{material_id}")
async def desativar_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Desativar material"""
    check_user_has_estabelecimento(current_user)

    material = MaterialService.delete_material(
        db=db,
        material_id=material_id,
        current_user=current_user
    )
    return {"message": f"Material {material_id} desativado", "material": material}


@router.post("/agendamentos/{agendamento_id}/consumos", response_model=List[ConsumoMaterialResponse])
async def registrar_consumo_materiais(
    agendamento_id: int,
    consumos: List[ConsumoMaterialCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Registrar consumo de materiais em um agendamento"""
    check_user_has_estabelecimento(current_user)

    consumos_criados = MaterialService.registrar_consumo(
        db=db,
        agendamento_id=agendamento_id,
        consumos=consumos,
        current_user=current_user
    )
    return consumos_criados


@router.get("/agendamentos/{agendamento_id}/consumos", response_model=List[ConsumoMaterialResponse])
async def listar_consumos_agendamento(
    agendamento_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Listar consumos de materiais de um agendamento"""
    check_user_has_estabelecimento(current_user)

    consumos = MaterialService.get_consumos_agendamento(
        db=db,
        agendamento_id=agendamento_id,
        current_user=current_user
    )
    return consumos
