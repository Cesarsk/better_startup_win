@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%StartupAll.ps1" %*
set "EXIT_CODE=%errorlevel%"

endlocal & exit /b %EXIT_CODE%
