#!/bin/bash

echo "Iniciando Agenda OnSell..."
echo

echo "1. Iniciando Backend (FastAPI)..."
cd backend && python main.py &
BACKEND_PID=$!

echo "2. Aguardando 3 segundos..."
sleep 3

echo "3. Iniciando Frontend (React)..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo
echo "Sistemas iniciados!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo
echo "Pressione Ctrl+C para parar ambos os serviços"

# Trap Ctrl+C and kill both processes
trap 'echo "Parando serviços..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT

# Wait for both processes
wait