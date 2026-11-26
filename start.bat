@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker daemon is not running. Please start Docker Desktop and try again.
  pause
  exit /b 1
)

set CONSOLE_PORT=8080
set ADMINER_PORT=8081
if exist .env (
  for /f "usebackq tokens=1,2 delims==" %%A in (".env") do (
    if "%%A"=="CONSOLE_PORT" set CONSOLE_PORT=%%B
    if "%%A"=="ADMINER_PORT" set ADMINER_PORT=%%B
  )
)

echo Building and starting DBMS Classroom Lab...
docker compose up -d --build --wait
if errorlevel 1 (
  echo.
  echo Failed to start Docker containers. Check the messages above.
  pause
  exit /b 1
)

echo.
echo DBMS Classroom Lab (MSCNS406) is ready!
echo   Console (Units 1-4): http://localhost:!CONSOLE_PORT!
echo   Adminer DB UI:       http://localhost:!ADMINER_PORT!
echo.
echo Stop later with: docker compose down
pause
