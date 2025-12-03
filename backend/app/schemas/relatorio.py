from pydantic import BaseModel
from typing import List, Optional
from datetime import date


class MaterialEstoque(BaseModel):
    """Dados de estoque de um material"""
    material_id: int
    nome: str
    quantidade_estoque: float
    quantidade_minima: Optional[float]
    unidade_medida: str
    valor_total_estoque: float  # quantidade * valor_custo


class ResumoFinanceiro(BaseModel):
    """Resumo financeiro de um período"""
    data_inicio: date
    data_fim: date
    total_receita: float  # Soma de valores finais dos agendamentos concluídos
    total_custos_materiais: float  # Soma dos custos de materiais consumidos
    lucro_bruto: float  # receita - custos
    margem_lucro: float  # (lucro_bruto / total_receita) * 100
    total_agendamentos: int
    total_agendamentos_concluidos: int


class ServicoLucro(BaseModel):
    """Lucro por serviço"""
    servico_id: int
    servico_nome: str
    quantidade_vendida: int
    receita_total: float
    custo_materiais_total: float
    lucro_total: float
    ticket_medio: float


class MaterialConsumo(BaseModel):
    """Consumo de material por período"""
    material_id: int
    material_nome: str
    quantidade_consumida: float
    unidade_medida: str
    custo_total: float
    vezes_utilizado: int  # Número de agendamentos que usaram


class ReceitaDiaria(BaseModel):
    """Receita diária"""
    data: date
    receita: float
    custos: float
    lucro: float
    agendamentos: int


class DashboardRelatorios(BaseModel):
    """Dashboard completo de relatórios"""
    resumo_financeiro: ResumoFinanceiro
    estoque_materiais: List[MaterialEstoque]
    servicos_lucro: List[ServicoLucro]
    materiais_consumo: List[MaterialConsumo]
    receita_diaria: List[ReceitaDiaria]
