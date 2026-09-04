@echo off
title Track.Art - lancement local
cd /d "%~dp0"
echo [1/4] Docker (PostgreSQL + MinIO)...
docker compose up -d || (echo Docker Desktop doit etre demarre. & pause & exit /b 1)
echo [2/4] Migrations Prisma + seed admin...
cd backend
if not exist node_modules call npm install
call npx prisma migrate dev --name photo_paid --skip-seed
call npm run seed
echo [3/4] Backend sur http://localhost:3001
start "Track.Art backend" cmd /k "npm run start:dev"
cd ..\frontend
if not exist node_modules call npm install
echo [4/4] Frontend sur http://localhost:3000
start "Track.Art frontend" cmd /k "npm run dev"
timeout /t 8 >nul
start http://localhost:3000/admin/login
echo.
echo Tout est lance. Admin : admin@track.art / ChangeMe123!
pause
