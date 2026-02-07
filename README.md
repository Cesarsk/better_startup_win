# Startup Win11

A small set of Windows startup scripts that wait for the display to reach a preferred resolution, then launch or trim background apps and optionally run touch calibration for the XENEON EDGE monitor.

## What's inside
- bin/StartupAll.bat: main orchestration script
- bin/StartupAll.vbs: hidden launcher for Task Scheduler
- bin/TouchCalibration.bat / bin/TouchCalibration.ps1: EDID-gated touch calibration helper
- tools/killall.bat: helper to terminate tray apps (optional)
- tools/TestStreamDeck.bat, tools/TestMinimize.bat: manual test helpers
- shortcuts/Touch.lnk: touch shortcut

## Usage
1. Keep the folder structure intact.
2. Update the preferred resolution in `bin/StartupAll.bat` (search for `WaitForResolution`).
3. If needed, change the EDID name:
   - `bin/StartupAll.bat` in the XENEON EDGE detection
   - `bin/TouchCalibration.ps1` default `EdidName`
4. Create a Task Scheduler entry that runs:
   - `bin/StartupAll.vbs`
   - Run with highest privileges
   - At logon (or at startup)

## Task Scheduler setup
1. Open Task Scheduler and select your task (or create a new one).
2. General tab:
   - Run only when user is logged on (recommended)
   - Run with highest privileges
3. Triggers tab:
   - At log on (or At startup)
4. Actions tab:
   - Action: Start a program
   - Program/script: `C:\Users\lucac\Documents\Projects\startup\bin\StartupAll.vbs`
   - Start in (optional): `C:\Users\lucac\Documents\Projects\startup\bin`

## Logging
- `logs/StartupAll.log` is written under the repo root (the folder is created if missing).
- `TouchCalibration.log` is written to `%TEMP%`.

## Notes
- The scripts use WMI to read current resolution and EDID names.
- Calibration runs only if the startup resolution was initially wrong and then becomes correct.
