# Lawwise Final Year Project - Startup Script
# This script starts the Chroma DB, Backend, and Frontend in separate windows.

Write-Host "🚀 Starting Lawwise Application..." -ForegroundColor Cyan

# 0. Check and Install Dependencies
Write-Host "Checking/Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install fastapi uvicorn chromadb opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation opentelemetry-instrumentation-fastapi --quiet

# 1. Start Chroma DB
Write-Host "Starting Chroma DB Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd lawwise-app/backend; python run_chroma.py" -WindowStyle Normal

# Wait a few seconds for Chroma to initialize
Start-Sleep -Seconds 5

# 2. Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd lawwise-app/backend; npm run dev" -WindowStyle Normal

# 3. Start Frontend (Next.js)
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd lawwise-app/lawwise-next; npm run dev" -WindowStyle Normal

Write-Host "✅ All services are starting in separate windows!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5001"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Chroma DB: http://localhost:8000"
