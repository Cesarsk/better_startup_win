@echo off
:: ============================================================================
:: STARTUP ALL - Combined Startup Script
:: ============================================================================
:: 
:: This script orchestrates the startup of multiple applications with specific
:: timing and conditions
::
:: All apps minimize to system tray for clean desktop.
:: Designed to run at startup via Task Scheduler with admin privileges.
::
:: ============================================================================

setlocal enabledelayedexpansion

:: Ensure logs directory exists
if not exist "%~dp0..\logs" mkdir "%~dp0..\logs" > nul 2>&1

:: Simple log to track flow
set "STARTUP_LOG=%~dp0..\logs\StartupAll.log"
echo [%date% %time%] StartupAll begin> "%STARTUP_LOG%"

:: Track whether startup resolution was wrong
set "RES_WAS_MISMATCHED=0"

:: Check main monitor resolution and refresh rate (3440x1440 @ 164Hz) - wait until it's correct
:WaitForResolution
set "width="
set "height="
set "refresh="
for /f "delims=" %%a in ('powershell -NoProfile -Command "Get-WmiObject Win32_VideoController | Where-Object {$_.Name -like '*RTX*'} | Select-Object -ExpandProperty CurrentHorizontalResolution"') do set "width=%%a"
for /f "delims=" %%a in ('powershell -NoProfile -Command "Get-WmiObject Win32_VideoController | Where-Object {$_.Name -like '*RTX*'} | Select-Object -ExpandProperty CurrentVerticalResolution"') do set "height=%%a"
for /f "delims=" %%a in ('powershell -NoProfile -Command "Get-WmiObject Win32_VideoController | Where-Object {$_.Name -like '*RTX*'} | Select-Object -ExpandProperty CurrentRefreshRate"') do set "refresh=%%a"

if "!width!"=="3440" if "!height!"=="1440" if "!refresh!"=="164" (
    :: Resolution is correct, proceed
    goto ResolutionOK
) else (
    set "RES_WAS_MISMATCHED=1"
    :: Wait 10 seconds and check again
    timeout /t 10 /nobreak > nul
    goto WaitForResolution
)

:ResolutionOK

echo [%date% %time%] RES_WAS_MISMATCHED=!RES_WAS_MISMATCHED!>> "%STARTUP_LOG%"

:: Kill all apps first for true idempotency
taskkill /f /im "NZXT CAM.exe" > nul 2>&1
taskkill /f /im "aida64.exe" > nul 2>&1
taskkill /f /im "StreamDeck.exe" > nul 2>&1
taskkill /f /im "SignalRGB.exe" > nul 2>&1

:: Delay for 20 seconds before launching Software
timeout /t 20 /nobreak >nul

:: Launch NZXT CAM
start "NZXT CAM" "C:\Program Files\NZXT CAM\NZXT CAM.exe"

:: Delay for 10 seconds before killing NZXT CAM
timeout /t 10 /nobreak >nul

:: Kill NZXT CAM
taskkill /f /im "NZXT CAM.exe" > nul 2>&1

:: Start SignalRGB
taskkill /f /im "SignalRgbLauncher.exe" > nul 2>&1
start "SignalRGB" "C:\Users\lucac\AppData\Local\VortxEngine\SignalRgbLauncher.exe"

:: Close SignalRGB window (goes to tray)
timeout /t 5 /nobreak > nul
powershell -NoProfile -Command "(Get-Process 'SignalRgbLauncher' -ErrorAction SilentlyContinue).ForEach({ $_.CloseMainWindow() })" > nul 2>&1

:: Wait up to 10 minutes for XENEON EDGE monitor, then run tray apps if found
set /a monitor_wait_seconds=0
:WaitForXeneon
powershell -Command "Get-WmiObject WmiMonitorID -Namespace root\wmi | ForEach-Object {[System.Text.Encoding]::ASCII.GetString($_.UserFriendlyName -ne 0)}" | find /i "XENEON EDGE" > nul
if %errorlevel% equ 0 (
    echo [%date% %time%] XENEON EDGE detected>> "%STARTUP_LOG%"
    if "!RES_WAS_MISMATCHED!"=="1" (
        :: Run touch calibration for XENEON EDGE (EDID-gated; user taps manually)
        echo [%date% %time%] Running TouchCalibration.bat>> "%STARTUP_LOG%"
        call "%~dp0TouchCalibration.bat"
    ) else (
        :: Skip calibration; startup resolution was already correct
        echo [%date% %time%] Skipping calibration; startup resolution already correct>> "%STARTUP_LOG%"
    )
    :: Monitor found, kill and restart Aida64
    echo [%date% %time%] Restarting Aida64 and Stream Deck>> "%STARTUP_LOG%"
    taskkill /f /im "aida64.exe" > nul 2>&1
    start "Aida64" "D:\Aida64\aida64.exe"
    
    :: Close Aida64 window (goes to tray)
    timeout /t 5 /nobreak > nul
    powershell -NoProfile -Command "(Get-Process 'aida64' -ErrorAction SilentlyContinue).ForEach({ $_.CloseMainWindow() })" > nul 2>&1
    
    :: Kill and restart Stream Deck with --runinbk flag (runs in background/tray)
    taskkill /f /im "StreamDeck.exe" > nul 2>&1
    start "Stream Deck" "C:\Program Files\Elgato\StreamDeck\StreamDeck.exe" --runinbk
    goto MonitorWaitDone
) else (
    echo [%date% %time%] XENEON EDGE not detected yet>> "%STARTUP_LOG%"
    if %monitor_wait_seconds% geq 600 goto MonitorWaitDone
    timeout /t 10 /nobreak > nul
    set /a monitor_wait_seconds+=10
    goto WaitForXeneon
)
:MonitorWaitDone
echo [%date% %time%] StartupAll done>> "%STARTUP_LOG%"

exit
