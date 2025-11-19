from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from fastapi import HTTPException, status

from app.models import (
    ConfiguracaoFidelidade,
    Premio,
    ResgatePremio,
    Cliente,
    Agendamento,
    StatusAgendamento
)
from app.schemas.fidelidade import (
    ConfiguracaoFidelidadeCreate,
    ConfiguracaoFidelidadeUpdate,
    PremioCreate,
    PremioUpdate,
    ResgatePremioCreate,
    ResgatePremioUpdate,
    PremiosDisponiveisResponse,
    PontosClienteResponse
)


class FidelidadeService:
    """Service para gerenciar sistema de fidelidade"""

    # ==================== ConfiguracaoFidelidade ====================

    @staticmethod
    def get_configuracao(db: Session, estabelecimento_id: int) -> Optional[ConfiguracaoFidelidade]:
        """Busca configuração de fidelidade do estabelecimento"""
        return db.query(ConfiguracaoFidelidade).filter(
            ConfiguracaoFidelidade.estabelecimento_id == estabelecimento_id
        ).first()

    @staticmethod
    def create_configuracao(
        db: Session,
        config_data: ConfiguracaoFidelidadeCreate
    ) -> ConfiguracaoFidelidade:
        """Cria ou atualiza configuração de fidelidade"""
        # Verifica se já existe configuração
        existing = FidelidadeService.get_configuracao(db, config_data.estabelecimento_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Configuração de fidelidade já existe para este estabelecimento"
            )

        config = ConfiguracaoFidelidade(**config_data.model_dump())
        db.add(config)
        db.commit()
        db.refresh(config)
        return config

    @staticmethod
    def update_configuracao(
        db: Session,
        estabelecimento_id: int,
        config_data: ConfiguracaoFidelidadeUpdate
    ) -> ConfiguracaoFidelidade:
        """Atualiza configuração de fidelidade"""
        config = FidelidadeService.get_configuracao(db, estabelecimento_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuração de fidelidade não encontrada"
            )

        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)

        db.commit()
        db.refresh(config)
        return config

    # ==================== Premio ====================

    @staticmethod
    def list_premios(
        db: Session,
        estabelecimento_id: int,
        apenas_ativos: bool = True
    ) -> List[Premio]:
        """Lista prêmios do estabelecimento"""
        query = db.query(Premio).filter(
            Premio.estabelecimento_id == estabelecimento_id
        )

        if apenas_ativos:
            query = query.filter(Premio.ativo == True)

        return query.all()

    @staticmethod
    def get_premio(db: Session, premio_id: int) -> Optional[Premio]:
        """Busca prêmio por ID"""
        return db.query(Premio).filter(Premio.id == premio_id).first()

    @staticmethod
    def create_premio(db: Session, premio_data: PremioCreate) -> Premio:
        """Cria novo prêmio"""
        premio = Premio(**premio_data.model_dump())
        db.add(premio)
        db.commit()
        db.refresh(premio)
        return premio

    @staticmethod
    def update_premio(
        db: Session,
        premio_id: int,
        premio_data: PremioUpdate
    ) -> Premio:
        """Atualiza prêmio"""
        premio = FidelidadeService.get_premio(db, premio_id)
        if not premio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prêmio não encontrado"
            )

        update_data = premio_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(premio, field, value)

        db.commit()
        db.refresh(premio)
        return premio

    @staticmethod
    def delete_premio(db: Session, premio_id: int) -> None:
        """Desativa prêmio"""
        premio = FidelidadeService.get_premio(db, premio_id)
        if not premio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prêmio não encontrado"
            )

        premio.ativo = False
        db.commit()

    # ==================== Pontos ====================

    @staticmethod
    def calcular_pontos(
        db: Session,
        estabelecimento_id: int,
        valor_gasto: Decimal
    ) -> int:
        """Calcula quantos pontos o cliente deve receber"""
        print(f"[FIDELIDADE] Calculando pontos - Estabelecimento: {estabelecimento_id}, Valor: {valor_gasto}")

        config = FidelidadeService.get_configuracao(db, estabelecimento_id)
        if not config:
            print(f"[FIDELIDADE] Configuração não encontrada para estabelecimento {estabelecimento_id}")
            return 0

        if not config.ativo:
            print(f"[FIDELIDADE] Configuração está inativa para estabelecimento {estabelecimento_id}")
            return 0

        print(f"[FIDELIDADE] Configuração encontrada - Reais por ponto: {config.reais_por_ponto}")

        # Ex: R$ 250 / R$ 100 por ponto = 2.5 = 2 pontos
        # Garante que ambos são Decimal para evitar erro de tipos
        valor = Decimal(str(valor_gasto))
        reais_por_ponto = Decimal(str(config.reais_por_ponto))
        pontos = int(valor / reais_por_ponto)

        print(f"[FIDELIDADE] Cálculo: {valor} / {reais_por_ponto} = {pontos} pontos")

        return pontos

    @staticmethod
    def adicionar_pontos_cliente(
        db: Session,
        cliente_id: int,
        pontos: int
    ) -> Cliente:
        """Adiciona pontos ao cliente"""
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        cliente.pontos += pontos
        db.commit()
        db.refresh(cliente)
        return cliente

    @staticmethod
    def processar_pontos_agendamento(
        db: Session,
        agendamento_id: int
    ) -> Optional[int]:
        """Processa pontos de um agendamento concluído"""
        print(f"[FIDELIDADE] Processando pontos para agendamento ID: {agendamento_id}")

        agendamento = db.query(Agendamento).filter(
            Agendamento.id == agendamento_id
        ).first()

        if not agendamento:
            print(f"[FIDELIDADE] Agendamento {agendamento_id} não encontrado")
            return None

        print(f"[FIDELIDADE] Status do agendamento: {agendamento.status}")
        print(f"[FIDELIDADE] Valor final: {agendamento.valor_final}")
        print(f"[FIDELIDADE] Cliente ID: {agendamento.cliente_id}")
        print(f"[FIDELIDADE] Estabelecimento ID: {agendamento.estabelecimento_id}")

        # Só adiciona pontos se agendamento estiver concluído
        # Comparar por .value porque pode vir do schema (Pydantic) e não do model (SQLAlchemy)
        status_valor = agendamento.status.value if hasattr(agendamento.status, 'value') else str(agendamento.status)

        if status_valor != StatusAgendamento.CONCLUIDO.value:
            print(f"[FIDELIDADE] Agendamento não está concluído, pulando... (status_valor: {status_valor}, esperado: {StatusAgendamento.CONCLUIDO.value})")
            return None

        print(f"[FIDELIDADE] Status confirmado como CONCLUIDO! Processando pontos...")

        # Calcula pontos baseado no valor final
        pontos = FidelidadeService.calcular_pontos(
            db,
            agendamento.estabelecimento_id,
            agendamento.valor_final
        )

        print(f"[FIDELIDADE] Pontos calculados: {pontos}")

        if pontos > 0:
            print(f"[FIDELIDADE] Adicionando {pontos} pontos ao cliente {agendamento.cliente_id}")
            FidelidadeService.adicionar_pontos_cliente(
                db,
                agendamento.cliente_id,
                pontos
            )
            print(f"[FIDELIDADE] Pontos adicionados com sucesso!")
        else:
            print(f"[FIDELIDADE] Nenhum ponto para adicionar")

        return pontos

    # ==================== Resgates ====================

    @staticmethod
    def resgatar_premio(
        db: Session,
        resgate_data: ResgatePremioCreate
    ) -> ResgatePremio:
        """Resga um prêmio para o cliente"""
        # Busca cliente
        cliente = db.query(Cliente).filter(
            Cliente.id == resgate_data.cliente_id
        ).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        # Busca prêmio
        premio = FidelidadeService.get_premio(db, resgate_data.premio_id)
        if not premio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prêmio não encontrado"
            )

        if not premio.ativo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prêmio não está ativo"
            )

        # Verifica se cliente tem pontos suficientes
        if cliente.pontos < premio.pontos_necessarios:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Pontos insuficientes. Necessário: {premio.pontos_necessarios}, Disponível: {cliente.pontos}"
            )

        # Deduz pontos do cliente
        cliente.pontos -= premio.pontos_necessarios

        # Cria resgate
        resgate = ResgatePremio(
            cliente_id=resgate_data.cliente_id,
            premio_id=resgate_data.premio_id,
            pontos_utilizados=premio.pontos_necessarios,
            status="DISPONIVEL"
        )

        db.add(resgate)
        db.commit()
        db.refresh(resgate)
        return resgate

    @staticmethod
    def listar_resgates_cliente(
        db: Session,
        cliente_id: int
    ) -> List[ResgatePremio]:
        """Lista resgates do cliente"""
        return db.query(ResgatePremio).filter(
            ResgatePremio.cliente_id == cliente_id
        ).order_by(ResgatePremio.data_resgate.desc()).all()

    @staticmethod
    def usar_resgate(
        db: Session,
        resgate_id: int,
        agendamento_id: int
    ) -> ResgatePremio:
        """Marca resgate como usado em um agendamento"""
        resgate = db.query(ResgatePremio).filter(
            ResgatePremio.id == resgate_id
        ).first()

        if not resgate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resgate não encontrado"
            )

        if resgate.status != "DISPONIVEL":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Resgate já foi usado ou expirou"
            )

        resgate.status = "USADO"
        resgate.usado_em_agendamento_id = agendamento_id
        db.commit()
        db.refresh(resgate)
        return resgate

    @staticmethod
    def listar_premios_disponiveis(
        db: Session,
        cliente_id: int,
        estabelecimento_id: int
    ) -> List[PremiosDisponiveisResponse]:
        """Lista prêmios que o cliente pode resgatar"""
        cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente não encontrado"
            )

        premios = FidelidadeService.list_premios(db, estabelecimento_id, apenas_ativos=True)

        resultado = []
        for premio in premios:
            pode_resgatar = cliente.pontos >= premio.pontos_necessarios
            pontos_faltantes = max(0, premio.pontos_necessarios - cliente.pontos)

            resultado.append(PremiosDisponiveisResponse(
                premio=premio,
                pode_resgatar=pode_resgatar,
                pontos_faltantes=pontos_faltantes
            ))

        return resultado
