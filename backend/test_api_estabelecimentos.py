"""
Testar endpoint de estabelecimentos via API
"""
import requests

# Login como suporte
login_response = requests.post(
    'http://localhost:8000/auth/login',
    json={
        'email': 'eduardo@suporte.com',
        'password': 'suporte123'
    }
)

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    print(f"Login OK - Token obtido")

    # Testar endpoint de estabelecimentos
    headers = {'Authorization': f'Bearer {token}'}
    estab_response = requests.get('http://localhost:8000/estabelecimentos/', headers=headers)

    print(f"\nStatus Code: {estab_response.status_code}")

    if estab_response.status_code == 200:
        data = estab_response.json()
        print(f"OK - Resposta recebida!")
        print(f"Total: {data.get('total')}")
        print(f"Estabelecimentos: {len(data.get('estabelecimentos', []))}")

        # Mostrar primeiro estabelecimento
        if data.get('estabelecimentos'):
            primeiro = data['estabelecimentos'][0]
            print(f"\nPrimeiro estabelecimento:")
            print(f"  ID: {primeiro.get('id')}")
            print(f"  Nome: {primeiro.get('nome')}")
            print(f"  Abertura: {primeiro.get('horario_abertura')}")
            print(f"  Fechamento: {primeiro.get('horario_fechamento')}")
    else:
        print(f"ERRO: {estab_response.status_code}")
        print(estab_response.text)
else:
    print(f"ERRO no login: {login_response.status_code}")
    print(login_response.text)
