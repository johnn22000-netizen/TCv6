@echo off
setlocal
chcp 65001 >nul
title TCv6 一鍵啟動

set "BASE_DIR=%~dp0"
set "INDEX_FILE=%BASE_DIR%html\index.html"
set "SERVER_SCRIPT=%BASE_DIR%scripts\serve-tcv6.ps1"
set "PORT=8787"
set "APP_URL=http://127.0.0.1:%PORT%/html/index.html"
echo [TCv6] 啟動中...

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

powershell -NoProfile -ExecutionPolicy Bypass -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',%PORT%)).Close(); exit 0} catch {exit 1}"
if errorlevel 1 (
  echo [TCv6] 正在啟動本地伺服器...
  start "TCv6 Static Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%SERVER_SCRIPT%" -Root "%BASE_DIR%" -Port %PORT%
)

set "SERVER_READY="
for /l %%i in (1,1,8) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',%PORT%)).Close(); exit 0} catch {exit 1}"
  if not errorlevel 1 (
    set "SERVER_READY=1"
    goto :after_wait
  )
  timeout /t 1 >nul
)

:after_wait
set "CHROME_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
set "EDGE_EXE="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined EDGE_EXE if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if defined SERVER_READY (
  echo [TCv6] 伺服器啟動成功，正在開啟網頁...
  if defined CHROME_EXE (
    start "" "%CHROME_EXE%" --new-window "%APP_URL%"
  ) else if defined EDGE_EXE (
    start "" "%EDGE_EXE%" --new-window "%APP_URL%"
  ) else (
    echo [Info] 找不到 Chrome，改用系統預設瀏覽器開啟。
    start "" "%APP_URL%"
  )
  exit /b 0
)

echo [Warn] 本地伺服器啟動失敗，改用本機檔案模式開啟。
if defined CHROME_EXE (
  set "CHROME_PROFILE=%TEMP%\tcv6-local-profile"
  start "" "%CHROME_EXE%" --new-window --allow-file-access-from-files --disable-web-security --user-data-dir="%CHROME_PROFILE%" "%INDEX_FILE%"
  exit /b 0
) else if defined EDGE_EXE (
  start "" "%EDGE_EXE%" --new-window "%INDEX_FILE%"
  exit /b 0
) else (
  echo [Info] 找不到 Chrome，改用系統預設瀏覽器開啟。
  start "" "%INDEX_FILE%"
)

exit /b 0
