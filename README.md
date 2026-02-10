# Startup Win11

A small set of Windows startup scripts that wait for the display to reach a preferred resolution, then launch or trim background apps and optionally run touch calibration for the XENEON EDGE monitor.

## What's inside
- bin/StartupAll.bat: thin wrapper used by Task Scheduler
- bin/StartupAll.ps1: main orchestration script
- bin/StartupAll.vbs: hidden launcher for Task Scheduler
- bin/TouchCalibration.bat / bin/TouchCalibration.ps1: EDID-gated touch calibration helper
- config/startup.config.psd1: editable startup settings (paths, resolution, monitor, delays)
- tools/killall.bat: helper to terminate tray apps (optional)
- tools/TestStreamDeck.bat, tools/TestMinimize.bat: manual test helpers
- shortcuts/Touch.lnk: touch shortcut

## Usage
1. Keep the folder structure intact.
2. Update settings in `config/startup.config.psd1`:
   - display resolution and refresh target
   - monitor EDID name
   - app executable paths
   - startup delays and polling timeouts
3. If needed, change the EDID name:
   - `config/startup.config.psd1` in `Monitor.EdidName`
   - `bin/TouchCalibration.ps1` default `EdidName` (optional fallback)
4. Create a Task Scheduler entry that runs:
   - `bin/StartupAll.vbs`
   - Run with highest privileges
   - At logon (or at startup)

## Task Scheduler setup
1. Open Task Scheduler and select your task (or create a new one).
2. General tab:
   - Run only when user is logged on (recommended)
   - Run with highest privileges
   - Configure for: Windows 10/11
3. Triggers tab:
   - At log on (or At startup)
4. Actions tab:
   - Action: Start a program
   - Program/script: `C:\Users\lucac\Documents\Projects\startup\bin\StartupAll.vbs`
   - Start in (optional): `C:\Users\lucac\Documents\Projects\startup\bin`
5. Conditions tab (recommended):
   - Disable `Start the task only if the computer is on AC power` when not needed
   - Disable idle-only requirements
6. Settings tab (recommended):
   - Allow task to be run on demand
   - If task is already running: `Do not start a new instance`

## Testing
- Dry run (safe, no app starts/stops):
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\bin\StartupAll.ps1 -DryRun`
- Real run:
  - `cscript //nologo .\bin\StartupAll.vbs`

## Logging
- `logs/StartupAll.log` is written under the repo root (the folder is created if missing).
- `TouchCalibration.log` is written to `%TEMP%`.

## Notes
- The startup orchestrator uses `Get-CimInstance` for display and EDID checks.
- Calibration runs only if the startup resolution was initially wrong and then becomes correct.
