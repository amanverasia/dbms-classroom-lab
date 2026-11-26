@echo off
setlocal enabledelayedexpansion
pushd "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo Docker is not installed or not on PATH. Please install Docker Desktop and try again.
  pause
  popd
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo Docker Compose v2 is unavailable. Please update Docker Desktop and try again.
  pause
  popd
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker daemon is not running. Please start Docker Desktop and try again.
  pause
  popd
  exit /b 1
)

set _CONSOLE_PORT=%CONSOLE_PORT%
if "%_CONSOLE_PORT%"=="" set _CONSOLE_PORT=8080
set _ADMINER_PORT=%ADMINER_PORT%
if "%_ADMINER_PORT%"=="" set _ADMINER_PORT=8081
if exist .env (
  for /f "usebackq eol=# tokens=1,2 delims==" %%A in (".env") do (
    set "_KEY=%%A"
    set "_KEY=!_KEY: =!"
    for /f "delims=#" %%C in ("%%~B") do set "_VAL=%%C"
    set "_VAL=!_VAL: =!"
    set "_VAL=!_VAL:"=!"
    if /i "!_KEY!"=="CONSOLE_PORT" if not "!_VAL!"=="" set "_CONSOLE_PORT=!_VAL!"
    if /i "!_KEY!"=="ADMINER_PORT" if not "!_VAL!"=="" set "_ADMINER_PORT=!_VAL!"
  )
)

echo Building and starting DBMS Classroom Lab...
docker compose up -d --build --wait
if errorlevel 1 (
  echo.
  echo Failed to start Docker containers. Check the messages above.
  pause
  popd
  exit /b 1
)

echo.
echo DBMS Classroom Lab (MSCNS406) is ready!
echo   Console (Units 1-4): http://localhost:!_CONSOLE_PORT!
echo   Adminer DB UI:       http://localhost:!_ADMINER_PORT!
echo.
echo Stop later with: docker compose down
pause
popd
