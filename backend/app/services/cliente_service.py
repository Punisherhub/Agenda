from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException, status
from typing import Optional, List

from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate


class ClienteService:
    @staticmethod
    def get_clientes(
        db: Session,
        estabelecimento_id: int,
        skip: int = 0,
        limit: int = 50,
        nome: Optional[str] = None,
        telefone: Optional[str] = None,
        email: Optional[str] = None,
        ativo: Optional[bool] = True
    ) -> tuple[List[Cliente], int]:
        """Listar clientes com filtros."""

        query = db.query(Cliente).filter(
            Cliente.estabelecimento_id == estabelecimento_id
        )

        # Aplicar filtros
        if nome:
            query = query.filter(Cliente.nome.ilike(f"%{nome}%"))

        if telefone:
            query = query.filter(Cliente.telefone.ilike(f"%{telefone}%"))

        if email:
            query = query.filter(Cliente.email.ilike(f"%{email}%"))

        if ativo is not None:
            query = query.filter(Cliente.is_active == ativo)

        # Ordenar por nome
        query = query.order_by(Cliente.nome)

        total = query.count()
        clientes = query.offset(skip).limit(limit).all()

        return clientes, total

    @staticmethod
    def search_clientes(
        db: Session,
        estabelecimento_id: int,
        termo: str,
        limit: int = 10
    ) -> List[Cliente]:
        """Buscar clientes por termo (nome, telefone, email)."""

        clientes = db.query(Cliente).filter(
            Cliente.estabelecimento_id == estabelecimento_id,
            Cliente.is_active == True,
            or_(
                Cliente.nome.ilike(f"%{termo}%"),
                Cliente.telefone.ilike(f"%{termo}%"),
                Cliente.email.ilike(f"%{termo}%")
            )
        ).order_by(Cliente.nome).limit(limit).all()

        return clientes

    @staticmethod
    def get_cliente(db: Session, cliente_id: int) -> Cliente:
        """Obter cliente por ID."""

        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()

        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        return cliente

    @staticmethod
    def create_cliente(db: Session, cliente_data: ClienteCreate, estabelecimento_id: int) -> Cliente:
        """Criar novo cliente."""

        # Verificar se já existe cliente com mesmo CPF ou telefone no estabelecimento
        if cliente_data.cpf:
            existing_cpf = db.query(Cliente).filter(
                Cliente.cpf == cliente_data.cpf,
                Cliente.estabelecimento_id == estabelecimento_id
            ).first()
            if existing_cpf:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este CPF neste estabelecimento"
                )

        existing_telefone = db.query(Cliente).filter(
            Cliente.telefone == cliente_data.telefone,
            Cliente.estabelecimento_id == estabelecimento_id
        ).first()
        if existing_telefone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Já existe um cliente com este telefone neste estabelecimento"
            )

        if cliente_data.email:
            existing_email = db.query(Cliente).filter(
                Cliente.email == cliente_data.email,
                Cliente.estabelecimento_id == estabelecimento_id
            ).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este email neste estabelecimento"
                )

        # Criar cliente vinculado ao estabelecimento
        cliente_dict = cliente_data.dict()
        cliente_dict['estabelecimento_id'] = estabelecimento_id
        db_cliente = Cliente(**cliente_dict)
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)

        return db_cliente

    @staticmethod
    def update_cliente(
        db: Session,
        cliente_id: int,
        cliente_data: ClienteUpdate
    ) -> Cliente:
        """Atualizar cliente."""

        cliente = ClienteService.get_cliente(db, cliente_id)

        # Verificar conflitos apenas se os campos mudaram (dentro do estabelecimento)
        update_data = cliente_data.dict(exclude_unset=True)

        if 'cpf' in update_data and update_data['cpf'] != cliente.cpf:
            existing_cpf = db.query(Cliente).filter(
                Cliente.cpf == update_data['cpf'],
                Cliente.estabelecimento_id == cliente.estabelecimento_id,
                Cliente.id != cliente_id
            ).first()
            if existing_cpf:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este CPF neste estabelecimento"
                )

        if 'telefone' in update_data and update_data['telefone'] != cliente.telefone:
            existing_telefone = db.query(Cliente).filter(
                Cliente.telefone == update_data['telefone'],
                Cliente.estabelecimento_id == cliente.estabelecimento_id,
                Cliente.id != cliente_id
            ).first()
            if existing_telefone:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este telefone neste estabelecimento"
                )

        if 'email' in update_data and update_data['email'] != cliente.email:
            existing_email = db.query(Cliente).filter(
                Cliente.email == update_data['email'],
                Cliente.estabelecimento_id == cliente.estabelecimento_id,
                Cliente.id != cliente_id
            ).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Já existe um cliente com este email neste estabelecimento"
                )

        # Atualizar campos
        for field, value in update_data.items():
            setattr(cliente, field, value)

        db.commit()
        db.refresh(cliente)

        return cliente

    @staticmethod
    def deactivate_cliente(db: Session, cliente_id: int) -> Cliente:
        """Desativar cliente (soft delete)."""

        cliente = ClienteService.get_cliente(db, cliente_id)
        cliente.is_active = False
        db.commit()
        db.refresh(cliente)

        return cliente

    @staticmethod
    def get_cliente_agendamentos(
        db: Session,
        cliente_id: int,
        skip: int = 0,
        limit: int = 20
    ):
        """Listar histórico de agendamentos do cliente."""

        cliente = ClienteService.get_cliente(db, cliente_id)

        from app.models.agendamento import Agendamento

        query = db.query(Agendamento).filter(
            Agendamento.cliente_id == cliente_id
        ).order_by(Agendamento.data_inicio.desc())

        total = query.count()
        agendamentos = query.offset(skip).limit(limit).all()

        return {
            "cliente": cliente,
            "agendamentos": agendamentos,
            "total": total
        }