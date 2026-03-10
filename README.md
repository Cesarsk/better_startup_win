# Better Startup Win

Windows startup automation with a tray app and a visual DAG editor.

This project started as startup scripts and now includes a desktop GUI where you can build flows that run app launches, kills, waits, and scripts in a predictable graph.

## Why this app exists
- Windows startup can be unreliable when multiple apps compete for resources at logon.
- Some app combinations are compatibility-sensitive and need a strict startup order.
- This tool exists to make those startup sequences explicit, repeatable, and editable.

Reference use case from this repo:
- Wait for specific display readiness (resolution/refresh).
- Restart or sequence apps like NZXT CAM, SignalRGB, AIDA64, and Stream Deck.
- Wait for monitor EDID detection before running dependent actions.
- Apply delays and conditional behavior so tray apps settle correctly.

## Core idea
- One profile for startup behavior.
- Multiple flows inside that profile.
- One default flow is selected for auto-run.
- Task Scheduler launches the tray app; the app can auto-run the default flow.
- Fresh installs start empty so users can design flows for their own setup.

## What is implemented now (MVP)
- Electron desktop app with tray menu.
- DAG flow editor with vertical graph visualization.
- Draggable nodes with persisted positions.
- Connector manipulation on canvas (add/remove edges) plus edge builder panel.
- Typed node configuration fields with optional advanced JSON mode.
- First-run wizard for empty projects.
- Undo/redo support for flow editing.
- Node types:
  - `delay`
  - `start_process`
  - `stop_process`
  - `close_window`
  - `run_script`
  - `wait_display`
  - `wait_monitor`
- Flow validation (missing nodes/edges, self-edge, cycle detection).
- Runtime execution with node status (`running`, `success`, `failed`, `skipped`).
- Startup auto-run support with `--startup` flag.
- Simple donation button (`Support`) in GUI and tray.

## Documentation
- Architecture reference: `docs/ARCHITECTURE.md`
- User guide: `docs/USER_GUIDE.md`

## Install (end users)
Use the Windows installer from GitHub Releases.

- Download `BetterStartupWin-Setup-<version>.exe` from the latest release.
- Run installer and follow prompts.
- Launch `Better Startup Win` from Start menu.

End users do not need Node.js or any manual prerequisite setup.

## Project structure
- `electron/main.js`: tray app, window lifecycle, IPC, Task Scheduler installer.
- `electron/runner.js`: DAG validation and execution engine.
- `electron/store.js`: persisted state load/save.
- `electron/default-state.js`: default profile and flow.
- `electron/preload.js`: secure renderer API bridge.
- `renderer/index.html`, `renderer/styles.css`, `renderer/app.js`: GUI.
- `bin/`: legacy script entrypoints kept for compatibility.

## Local development
1. Install dependencies:
   - `npm install`
2. Start GUI app:
   - `npm start`
3. Start in startup mode (hidden window intention, tray-first):
   - `npm run start:startup`
4. Run automated tests:
   - `npm test`
5. Build installer locally:
   - `npm run dist`

## Help and support links in app
- `Help` opens project repository:
  - `https://github.com/Cesarsk/better_startup_win`
- `Support ❤️` opens donation page:
  - `https://buymeacoffee.com/lucach`

The donation URL is fixed in-app and not exposed as an editable field.

## Task Scheduler integration (tray mode)
The app includes a GUI button (`Install Task Scheduler`) that creates/updates a startup task named `Better Startup Win`.

Manual equivalent command pattern:
- Action target should launch the app with `--startup`.
- In development that is effectively:
  - `"<electron.exe>" "<repo-path>" --startup`

Recommended Task Scheduler settings:
- Trigger: `At log on`
- General: `Run with highest privileges`
- Settings: `If task is already running, do not start a new instance`

## Legacy scripts
The original script automation still exists in `bin/` and can still be used while migrating flows into the GUI tool.

## CI build pipeline
- GitHub Actions workflow builds Windows installer and uploads artifacts:
  - `.github/workflows/windows-build.yml`

## License
MIT. See `LICENSE`.

## Donations
The app exposes a small `Support` button (top bar and tray menu) that opens the configured donation link.

Default donation URL:
- `https://buymeacoffee.com/lucach`
