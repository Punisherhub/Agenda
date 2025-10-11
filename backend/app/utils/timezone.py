"""
Utilitários para gerenciamento de timezone do Brasil (UTC-3)
"""
from datetime import datetime, date, time
from zoneinfo import ZoneInfo
from typing import Optional

# Timezone do Brasil (Horário de Brasília - BRT)
BRAZIL_TZ = ZoneInfo("America/Sao_Paulo")


def get_brazil_now() -> datetime:
    """Retorna datetime atual no timezone do Brasil"""
    return datetime.now(BRAZIL_TZ)


def to_brazil_tz(dt: datetime) -> datetime:
    """Converte datetime para timezone do Brasil"""
    if dt.tzinfo is None:
        # Se não tem timezone, assume UTC e converte
        dt = dt.replace(tzinfo=ZoneInfo("UTC"))
    return dt.astimezone(BRAZIL_TZ)


def from_brazil_tz(dt: datetime) -> datetime:
    """Converte datetime do Brasil para UTC (para armazenar no banco)"""
    if dt.tzinfo is None:
        # Se não tem timezone, assume que é do Brasil
        dt = dt.replace(tzinfo=BRAZIL_TZ)
    return dt.astimezone(ZoneInfo("UTC"))


def combine_date_time_brazil(date_obj: date, time_obj: time) -> datetime:
    """Combina date e time assumindo timezone do Brasil"""
    dt = datetime.combine(date_obj, time_obj)
    return dt.replace(tzinfo=BRAZIL_TZ)


def start_of_day_brazil(date_obj: date) -> datetime:
    """Retorna início do dia (00:00:00) no timezone do Brasil"""
    return combine_date_time_brazil(date_obj, time.min)


def end_of_day_brazil(date_obj: date) -> datetime:
    """Retorna fim do dia (23:59:59) no timezone do Brasil"""
    return combine_date_time_brazil(date_obj, time.max)


def date_to_brazil_datetime(date_obj: date, hour: int = 0, minute: int = 0) -> datetime:
    """Converte date para datetime no timezone do Brasil"""
    return combine_date_time_brazil(date_obj, time(hour=hour, minute=minute))


def get_brazil_date_range(data_inicio: date, data_fim: date):
    """
    Retorna range de datas no timezone do Brasil para queries.
    Útil para filtros de relatórios.
    """
    inicio_brazil = start_of_day_brazil(data_inicio)
    fim_brazil = end_of_day_brazil(data_fim)

    return {
        'inicio': inicio_brazil,
        'fim': fim_brazil,
        'inicio_utc': from_brazil_tz(inicio_brazil),
        'fim_utc': from_brazil_tz(fim_brazil)
    }


def format_brazil_datetime(dt: datetime, format_str: str = "%d/%m/%Y %H:%M") -> str:
    """Formata datetime para exibição no Brasil"""
    brazil_dt = to_brazil_tz(dt) if dt.tzinfo else dt.replace(tzinfo=BRAZIL_TZ)
    return brazil_dt.strftime(format_str)
