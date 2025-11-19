"""Script para testar o sistema de fidelidade"""
from app.database import SessionLocal
from app.services.fidelidade_service import FidelidadeService
from app.schemas.fidelidade import ConfiguracaoFidelidadeCreate, PremioCreate

def test_fidelidade():
    db = SessionLocal()

    try:
        print("=== Testando Sistema de Fidelidade ===\n")

        # 1. Verificar se configuração existe
        print("1. Verificando configuração de fidelidade...")
        config = FidelidadeService.get_configuracao(db, estabelecimento_id=1)

        if config:
            print(f"   [OK] Configuracao encontrada: R$ {config.reais_por_ponto} = 1 ponto")
            print(f"   Status: {'Ativo' if config.ativo else 'Inativo'}\n")
        else:
            print("   [!] Nenhuma configuracao encontrada (criar via interface)\n")

        # 2. Listar prêmios
        print("2. Listando premios cadastrados...")
        premios = FidelidadeService.list_premios(db, estabelecimento_id=1, apenas_ativos=False)

        if premios:
            print(f"   [OK] {len(premios)} premio(s) cadastrado(s):")
            for p in premios:
                status = "Ativo" if p.ativo else "Inativo"
                print(f"   - {p.nome}: {p.pontos_necessarios} pontos ({status})")
        else:
            print("   [!] Nenhum premio cadastrado ainda\n")

        # 3. Testar cálculo de pontos
        print("\n3. Testando calculo de pontos...")
        if config:
            valor_teste = 250.00
            pontos = FidelidadeService.calcular_pontos(db, estabelecimento_id=1, valor_gasto=valor_teste)
            print(f"   [OK] Gasto de R$ {valor_teste:.2f} = {pontos} pontos")
        else:
            print("   [!] Configure o sistema primeiro para testar calculo de pontos")

        print("\n[OK] Testes concluidos!")
        print("\n=== Proximos passos ===")
        print("   1. Acesse http://localhost:3000/fidelidade")
        print("   2. Configure o valor por ponto (ex: R$ 100,00)")
        print("   3. Crie premios para seus clientes")
        print("   4. Quando um agendamento for concluido, pontos serao adicionados automaticamente!")

    except Exception as e:
        print(f"\n[ERRO] Erro ao testar: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_fidelidade()
