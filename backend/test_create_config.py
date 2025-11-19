"""Testa criação de configuração de fidelidade"""
import requests

BASE_URL = "http://localhost:8000"

# 1. Fazer login
print("1. Fazendo login...")
response = requests.post(
    f"{BASE_URL}/auth/login",
    json={
        "email": "admin@barbeariamoderna.com",
        "password": "123456"
    }
)

if response.status_code != 200:
    print(f"   [ERRO] Login falhou: {response.text}")
    exit(1)

token = response.json()["access_token"]
print(f"   [OK] Login bem-sucedido")

# 2. Criar configuração
print("\n2. Criando configuração de fidelidade...")
headers = {"Authorization": f"Bearer {token}"}
data = {
    "reais_por_ponto": 100,
    "ativo": True
}

response = requests.post(
    f"{BASE_URL}/fidelidade/configuracao",
    json=data,
    headers=headers
)

print(f"   Status: {response.status_code}")
print(f"   Response: {response.text}")

if response.status_code == 200:
    print("\n   [OK] Configuracao criada com sucesso!")
    print(f"   Dados: {response.json()}")
else:
    print(f"\n   [ERRO] Falha ao criar configuracao")
    if response.status_code == 500:
        print("   ERRO 500: Verifique o console do backend para detalhes")
