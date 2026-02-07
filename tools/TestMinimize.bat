@echo off
setlocal enabledelayedexpansion

:: Launch NZXT CAM
echo Launching NZXT CAM...
start "NZXT CAM" "C:\Program Files\NZXT CAM\NZXT CAM.exe"

:: Wait 5 seconds for window to appear
echo Waiting 5 seconds...
timeout /t 5 /nobreak > nul

:: Try to close NZXT CAM
echo Attempting to close NZXT CAM...
powershell -NoProfile -Command "(Get-Process 'NZXT CAM' -ErrorAction SilentlyContinue).ForEach({ $_.CloseMainWindow() })" 2>&1

echo Done
pause


