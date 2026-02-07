@echo off
setlocal

:: Relaunch as admin if needed
net session >nul 2>&1
if %errorlevel% neq 0 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

:: Run EDID-gated calibration script (no touch injection; user taps manually)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0TouchCalibration.ps1" %*

endlocal
