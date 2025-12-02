"""
Script para testar endpoint de estabelecimentos
"""
from app.database import SessionLocal
from app.models.estabelecimento import Estabelecimento
from app.schemas.estabelecimento import EstabelecimentoResponse, EstabelecimentoList
from sqlalchemy.orm import joinedload

db = SessionLocal()

try:
    # Buscar estabelecimentos
    query = db.query(Estabelecimento).options(joinedload(Estabelecimento.empresa)).filter(Estabelecimento.is_active == True)
    estabelecimentos = query.limit(5).all()

    print(f"Total de estabelecimentos ativos: {len(estabelecimentos)}")

    # Tentar serializar com Pydantic
    print("\nTestando serializacao:")
    for estab in estabelecimentos:
        try:
            serialized = EstabelecimentoResponse.model_validate(estab)
            print(f"OK - {estab.nome}")
            print(f"  Abertura: {serialized.horario_abertura}")
            print(f"  Fechamento: {serialized.horario_fechamento}")
        except Exception as e:
            print(f"ERRO - {estab.nome}: {e}")

    # Testar EstabelecimentoList
    print("\nTestando EstabelecimentoList:")
    try:
        result = EstabelecimentoList(
            estabelecimentos=[EstabelecimentoResponse.model_validate(e) for e in estabelecimentos],
            total=len(estabelecimentos)
        )
        print(f"OK - EstabelecimentoList serializado com sucesso!")
        print(f"  Total: {result.total}")
        print(f"  Estabelecimentos: {len(result.estabelecimentos)}")

        # Testar conversão para JSON
        import json
        json_data = result.model_dump()
        print(f"OK - Conversao para dict OK")
        json_str = json.dumps(json_data, default=str)
        print(f"OK - Conversao para JSON OK")

    except Exception as e:
        print(f"ERRO ao serializar lista: {e}")
        import traceback
        traceback.print_exc()

finally:
    db.close()
