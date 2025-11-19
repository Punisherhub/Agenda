"""Testa se o endpoint de fidelidade está funcionando"""
import requests

BASE_URL = "http://localhost:8000"

# 1. Fazer login
login_data = {
    "email": "admin@barbeariamoderna.com",
    "password": "123456"
}

print("1. Fazendo login...")
response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"   Token obtido: {token[:20]}...")

    # 2. Testar endpoint de configuração
    print("\n2. Testando GET /fidelidade/configuracao...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/fidelidade/configuracao", headers=headers)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")

    if response.status_code == 404:
        print("\n   [OK] Correto! Nenhuma configuracao existe ainda (404 esperado)")
    elif response.status_code == 200:
        print("\n   [OK] Configuracao encontrada!")
        print(f"   Dados: {response.json()}")
    else:
        print(f"\n   [ERRO] Erro inesperado: {response.status_code}")
else:
    print(f"   [ERRO] Erro no login: {response.text}")
