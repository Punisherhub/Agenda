from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from datetime import date, datetime, timedelta
from typing import List, Dict

from app.models.agendamento import Agendamento, StatusAgendamento
from app.models.material import Material
from app.models.consumo_material import ConsumoMaterial
from app.models.servico import Servico
from app.schemas.relatorio import (
    MaterialEstoque, ResumoFinanceiro, ServicoLucro,
    MaterialConsumo, ReceitaDiaria, DashboardRelatorios
)


class RelatorioService:

    @staticmethod
    def get_estoque_materiais(db: Session, estabelecimento_id: int) -> List[MaterialEstoque]:
        """Retorna o estoque atual de materiais com valor total."""

        materiais = db.query(Material).filter(
            Material.estabelecimento_id == estabelecimento_id,
            Material.is_active == True
        ).all()

        return [
            MaterialEstoque(
                material_id=m.id,
                nome=m.nome,
                quantidade_estoque=m.quantidade_estoque,
                quantidade_minima=m.quantidade_minima,
                unidade_medida=m.unidade_medida.value,
                valor_total_estoque=m.quantidade_estoque * m.valor_custo
            )
            for m in materiais
        ]

    @staticmethod
    def get_resumo_financeiro(
        db: Session,
        estabelecimento_id: int,
        data_inicio: date,
        data_fim: date
    ) -> ResumoFinanceiro:
        """Calcula resumo financeiro do período."""

        # Agendamentos concluídos no período
        agendamentos_concluidos = db.query(Agendamento).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            Agendamento.status == StatusAgendamento.CONCLUIDO,
            func.date(Agendamento.data_inicio) >= data_inicio,
            func.date(Agendamento.data_inicio) <= data_fim
        ).all()

        # Total de agendamentos (todos os status)
        total_agendamentos = db.query(func.count(Agendamento.id)).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            func.date(Agendamento.data_inicio) >= data_inicio,
            func.date(Agendamento.data_inicio) <= data_fim
        ).scalar() or 0

        # Calcular receita e custos
        total_receita = float(sum(a.valor_final for a in agendamentos_concluidos))

        # Buscar custos de materiais dos agendamentos concluídos
        agendamento_ids = [a.id for a in agendamentos_concluidos]

        total_custos = 0.0
        if agendamento_ids:
            custos = db.query(func.sum(ConsumoMaterial.valor_total)).filter(
                ConsumoMaterial.agendamento_id.in_(agendamento_ids)
            ).scalar()
            total_custos = float(custos) if custos else 0.0

        return ResumoFinanceiro(
            data_inicio=data_inicio,
            data_fim=data_fim,
            total_receita=total_receita,
            total_custos_materiais=total_custos,
            lucro_bruto=total_receita - total_custos,
            total_agendamentos=total_agendamentos,
            total_agendamentos_concluidos=len(agendamentos_concluidos)
        )

    @staticmethod
    def get_servicos_lucro(
        db: Session,
        estabelecimento_id: int,
        data_inicio: date,
        data_fim: date
    ) -> List[ServicoLucro]:
        """Retorna análise de lucro por serviço."""

        # Query para agrupar por serviço
        query = db.query(
            Servico.id,
            Servico.nome,
            func.count(Agendamento.id).label('quantidade'),
            func.sum(Agendamento.valor_final).label('receita'),
            func.coalesce(func.sum(ConsumoMaterial.valor_total), 0).label('custos')
        ).join(
            Agendamento, Agendamento.servico_id == Servico.id
        ).outerjoin(
            ConsumoMaterial, ConsumoMaterial.agendamento_id == Agendamento.id
        ).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            Agendamento.status == StatusAgendamento.CONCLUIDO,
            func.date(Agendamento.data_inicio) >= data_inicio,
            func.date(Agendamento.data_inicio) <= data_fim
        ).group_by(
            Servico.id, Servico.nome
        ).all()

        resultado = []
        for servico_id, nome, quantidade, receita, custos in query:
            receita = float(receita) if receita else 0
            custos = float(custos) if custos else 0
            lucro = receita - custos
            ticket_medio = receita / quantidade if quantidade > 0 else 0

            resultado.append(ServicoLucro(
                servico_id=servico_id,
                servico_nome=nome,
                quantidade_vendida=quantidade,
                receita_total=receita,
                custo_materiais_total=custos,
                lucro_total=lucro,
                ticket_medio=ticket_medio
            ))

        return resultado

    @staticmethod
    def get_materiais_consumo(
        db: Session,
        estabelecimento_id: int,
        data_inicio: date,
        data_fim: date
    ) -> List[MaterialConsumo]:
        """Retorna consumo de materiais no período."""

        query = db.query(
            Material.id,
            Material.nome,
            Material.unidade_medida,
            func.sum(ConsumoMaterial.quantidade_consumida).label('quantidade'),
            func.sum(ConsumoMaterial.valor_total).label('custo'),
            func.count(func.distinct(ConsumoMaterial.agendamento_id)).label('vezes')
        ).join(
            ConsumoMaterial, ConsumoMaterial.material_id == Material.id
        ).join(
            Agendamento, Agendamento.id == ConsumoMaterial.agendamento_id
        ).filter(
            Material.estabelecimento_id == estabelecimento_id,
            func.date(Agendamento.data_inicio) >= data_inicio,
            func.date(Agendamento.data_inicio) <= data_fim
        ).group_by(
            Material.id, Material.nome, Material.unidade_medida
        ).all()

        return [
            MaterialConsumo(
                material_id=material_id,
                material_nome=nome,
                quantidade_consumida=float(quantidade) if quantidade else 0,
                unidade_medida=unidade.value,
                custo_total=float(custo) if custo else 0,
                vezes_utilizado=vezes
            )
            for material_id, nome, unidade, quantidade, custo, vezes in query
        ]

    @staticmethod
    def get_receita_diaria(
        db: Session,
        estabelecimento_id: int,
        data_inicio: date,
        data_fim: date
    ) -> List[ReceitaDiaria]:
        """Retorna receita diária do período."""

        # Query agrupada por dia
        query = db.query(
            func.date(Agendamento.data_inicio).label('data'),
            func.sum(
                case(
                    (Agendamento.status == StatusAgendamento.CONCLUIDO, Agendamento.valor_final),
                    else_=0
                )
            ).label('receita'),
            func.coalesce(func.sum(ConsumoMaterial.valor_total), 0).label('custos'),
            func.count(Agendamento.id).label('agendamentos')
        ).outerjoin(
            ConsumoMaterial, ConsumoMaterial.agendamento_id == Agendamento.id
        ).filter(
            Agendamento.estabelecimento_id == estabelecimento_id,
            func.date(Agendamento.data_inicio) >= data_inicio,
            func.date(Agendamento.data_inicio) <= data_fim
        ).group_by(
            func.date(Agendamento.data_inicio)
        ).order_by(
            func.date(Agendamento.data_inicio)
        ).all()

        resultado = []
        for data, receita, custos, agendamentos in query:
            receita = float(receita) if receita else 0
            custos = float(custos) if custos else 0

            resultado.append(ReceitaDiaria(
                data=data,
                receita=receita,
                custos=custos,
                lucro=receita - custos,
                agendamentos=agendamentos
            ))

        return resultado

    @staticmethod
    def get_dashboard_completo(
        db: Session,
        estabelecimento_id: int,
        data_inicio: date,
        data_fim: date
    ) -> DashboardRelatorios:
        """Retorna dashboard completo com todos os relatórios."""

        return DashboardRelatorios(
            resumo_financeiro=RelatorioService.get_resumo_financeiro(
                db, estabelecimento_id, data_inicio, data_fim
            ),
            estoque_materiais=RelatorioService.get_estoque_materiais(
                db, estabelecimento_id
            ),
            servicos_lucro=RelatorioService.get_servicos_lucro(
                db, estabelecimento_id, data_inicio, data_fim
            ),
            materiais_consumo=RelatorioService.get_materiais_consumo(
                db, estabelecimento_id, data_inicio, data_fim
            ),
            receita_diaria=RelatorioService.get_receita_diaria(
                db, estabelecimento_id, data_inicio, data_fim
            )
        )
