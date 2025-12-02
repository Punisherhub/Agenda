#!/bin/bash
# Script de inicialização para Railway

# Verificar se estamos no diretório correto
echo "Current directory: $(pwd)"
echo "Files in directory:"
ls -la

# Iniciar aplicação
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
