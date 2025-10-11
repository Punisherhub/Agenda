@echo off
echo Iniciando Agenda OnSell...
echo.

echo 1. Iniciando Backend (FastAPI)...
start cmd /k "cd backend && python main.py"

echo 2. Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo 3. Iniciando Frontend (React)...
start cmd /k "cd frontend && npm run dev"

echo.
echo Sistemas iniciados!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause