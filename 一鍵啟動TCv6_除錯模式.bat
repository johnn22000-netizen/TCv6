@echo off
setlocal
chcp 65001 >nul
title TCv6 一鍵啟動（除錯模式）

set "BASE_DIR=%~dp0"
set "INDEX_FILE=%BASE_DIR%html\index.html"
set "SERVER_SCRIPT=%BASE_DIR%scripts\serve-tcv6.ps1"
set "PORT=8787"
set "APP_URL=http://127.0.0.1:%PORT%/html/index.html"

echo [TCv6] BASE_DIR = %BASE_DIR%
echo [TCv6] INDEX_FILE = %INDEX_FILE%
echo [TCv6] SERVER_SCRIPT = %SERVER_SCRIPT%

if not exist "%INDEX_FILE%" (
  echo [Error] 找不到檔案: %INDEX_FILE%
  pause
  exit /b 1
)
if not exist "%SERVER_SCRIPT%" (
  echo [Error] 找不到伺服器腳本: %SERVER_SCRIPT%
  pause
  exit /b 1
)

echo [TCv6] 啟動伺服器...
start "TCv6 Static Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%SERVER_SCRIPT%" -Root "%BASE_DIR%" -Port %PORT%

set "SERVER_READY="
for /l %%i in (1,1,8) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',%PORT%)).Close(); exit 0} catch {exit 1}"
  if not errorlevel 1 (
    set "SERVER_READY=1"
    goto :ready
  )
  echo [TCv6] 等待伺服器中... %%i/8
  timeout /t 1 >nul
)

:ready
if defined SERVER_READY (
  echo [TCv6] 伺服器可用，開啟: %APP_URL%
  start "" "%APP_URL%"
) else (
  echo [Warn] 伺服器未啟動，改開本機檔案: %INDEX_FILE%
  start "" "%INDEX_FILE%"
)

echo.
echo [TCv6] 執行完成，按任意鍵關閉。
pause >nul
exit /b 0
