# Startup Win11

A small set of Windows startup scripts that wait for the display to reach a preferred resolution, then launch or trim background apps and optionally run touch calibration for the XENEON EDGE monitor.

## What's inside
- StartupAll.bat: main orchestration script
- StartupAll.vbs: hidden launcher for Task Scheduler
- TouchCalibration.bat / TouchCalibration.ps1: EDID-gated touch calibration helper
- killall.bat: helper to terminate tray apps (optional)
- TestStreamDeck.bat, TestMinimize.bat: manual test helpers

## Usage
1. Keep all files in the same folder.
2. Update the preferred resolution in `StartupAll.bat` (search for `WaitForResolution`).
3. If needed, change the EDID name:
   - `StartupAll.bat` in the XENEON EDGE detection
   - `TouchCalibration.ps1` default `EdidName`
4. Create a Task Scheduler entry that runs:
   - `StartupAll.vbs`
   - Run with highest privileges
   - At logon (or at startup)

## Logging
- `StartupAll.log` is written in the same folder as the scripts.
- `TouchCalibration.log` is written to `%TEMP%`.

## Notes
- The scripts use WMI to read current resolution and EDID names.
- Calibration runs only if the startup resolution was initially wrong and then becomes correct.
