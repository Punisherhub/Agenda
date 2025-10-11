from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, List

from app.models.material import Material
from app.models.consumo_material import ConsumoMaterial
from app.models.user import User
from app.schemas.material import MaterialCreate, MaterialUpdate, ConsumoMaterialCreate


class MaterialService:
    @staticmethod
    def get_materiais_by_estabelecimento(
        db: Session,
        estabelecimento_id: int,
        skip: int = 0,
        limit: int = 50,
        nome: Optional[str] = None,
        ativo: Optional[bool] = True
    ) -> tuple[List[Material], int]:
        """Listar materiais do estabelecimento com filtros."""

        query = db.query(Material).filter(
            Material.estabelecimento_id == estabelecimento_id
        )

        # Aplicar filtros
        if nome:
            query = query.filter(Material.nome.ilike(f"%{nome}%"))

        if ativo is not None:
            query = query.filter(Material.is_active == ativo)

        # Ordenar por nome
        query = query.order_by(Material.nome)

        total = query.count()
        materiais = query.offset(skip).limit(limit).all()

        return materiais, total

    @staticmethod
    def get_material(
        db: Session,
        material_id: int,
        estabelecimento_id: int
    ) -> Material:
        """Obter material por ID (apenas do estabelecimento)."""

        material = db.query(Material).filter(
            Material.id == material_id,
            Material.estabelecimento_id == estabelecimento_id
        ).first()

        if not material:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Material não encontrado"
            )

        return material

    @staticmethod
    def create_material(
        db: Session,
        material_data: MaterialCreate,
        current_user: User
    ) -> Material:
        """Criar novo material."""

        # Verificar se já existe material com mesmo nome no estabelecimento
        existing_material = db.query(Material).filter(
            Material.nome == material_data.nome,
            Material.estabelecimento_id == current_user.estabelecimento_id
        ).first()

        if existing_material:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um material com este nome no estabelecimento"
            )

        # Criar material
        material_dict = material_data.dict()
        material_dict['estabelecimento_id'] = current_user.estabelecimento_id
        db_material = Material(**material_dict)

        db.add(db_material)
        db.commit()
        db.refresh(db_material)

        return db_material

    @staticmethod
    def update_material(
        db: Session,
        material_id: int,
        material_data: MaterialUpdate,
        current_user: User
    ) -> Material:
        """Atualizar material."""

        material = MaterialService.get_material(
            db, material_id, current_user.estabelecimento_id
        )

        # Verificar conflito de nome apenas se mudou
        update_data = material_data.dict(exclude_unset=True)

        if 'nome' in update_data and update_data['nome'] != material.nome:
            existing_material = db.query(Material).filter(
                Material.nome == update_data['nome'],
                Material.estabelecimento_id == current_user.estabelecimento_id,
                Material.id != material_id
            ).first()

            if existing_material:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um material com este nome no estabelecimento"
                )

        # Atualizar campos
        for field, value in update_data.items():
            setattr(material, field, value)

        db.commit()
        db.refresh(material)

        return material

    @staticmethod
    def delete_material(
        db: Session,
        material_id: int,
        current_user: User
    ) -> Material:
        """Desativar material (soft delete)."""

        material = MaterialService.get_material(
            db, material_id, current_user.estabelecimento_id
        )

        material.is_active = False
        db.commit()
        db.refresh(material)

        return material

    @staticmethod
    def registrar_consumo(
        db: Session,
        agendamento_id: int,
        consumos: List[ConsumoMaterialCreate],
        current_user: User
    ) -> List[ConsumoMaterial]:
        """Registrar consumo de materiais em um agendamento."""

        from app.models.agendamento import Agendamento

        # Verificar se o agendamento existe e pertence ao estabelecimento
        agendamento = db.query(Agendamento).filter(
            Agendamento.id == agendamento_id,
            Agendamento.estabelecimento_id == current_user.estabelecimento_id
        ).first()

        if not agendamento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado"
            )

        consumos_criados = []

        for consumo_data in consumos:
            # Buscar material
            material = MaterialService.get_material(
                db, consumo_data.material_id, current_user.estabelecimento_id
            )

            # Verificar estoque disponível
            if material.quantidade_estoque < consumo_data.quantidade_consumida:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente para {material.nome}. Disponível: {material.quantidade_estoque}"
                )

            # Calcular valor total
            valor_total = consumo_data.quantidade_consumida * material.valor_custo

            # Criar registro de consumo
            consumo = ConsumoMaterial(
                agendamento_id=agendamento_id,
                material_id=consumo_data.material_id,
                quantidade_consumida=consumo_data.quantidade_consumida,
                valor_custo_unitario=material.valor_custo,
                valor_total=valor_total
            )

            db.add(consumo)

            # Atualizar estoque
            material.quantidade_estoque -= consumo_data.quantidade_consumida

            consumos_criados.append(consumo)

        db.commit()

        # Recarregar consumos com os dados do material
        from sqlalchemy.orm import joinedload
        consumos_com_material = db.query(ConsumoMaterial).options(
            joinedload(ConsumoMaterial.material)
        ).filter(
            ConsumoMaterial.id.in_([c.id for c in consumos_criados])
        ).all()

        return consumos_com_material

    @staticmethod
    def get_consumos_agendamento(
        db: Session,
        agendamento_id: int,
        current_user: User
    ) -> List[ConsumoMaterial]:
        """Listar consumos de materiais de um agendamento."""

        from app.models.agendamento import Agendamento
        from sqlalchemy.orm import joinedload

        # Verificar se o agendamento pertence ao estabelecimento
        agendamento = db.query(Agendamento).filter(
            Agendamento.id == agendamento_id,
            Agendamento.estabelecimento_id == current_user.estabelecimento_id
        ).first()

        if not agendamento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agendamento não encontrado"
            )

        # Carregar consumos com os dados do material (eager loading)
        consumos = db.query(ConsumoMaterial).options(
            joinedload(ConsumoMaterial.material)
        ).filter(
            ConsumoMaterial.agendamento_id == agendamento_id
        ).all()

        return consumos
