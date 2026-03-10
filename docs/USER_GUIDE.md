# User Guide

This guide explains how to use Better Startup Win as a daily startup automation tool.

## First launch behavior
- New installs start with no flows.
- Create your first flow using `New flow`, then add nodes and edges.
- Set that flow as default when you are ready for startup auto-run.

## 1) Start the app
- Development run:
  - `npm install`
  - `npm start`

The app opens a GUI and creates a tray icon.

## 2) Understand the layout
- **Top bar**: undo/redo, run/stop/validate/save, Task Scheduler setup, Help, Support.
- **Left panel**: flow selection, global settings, project repository link, edge builder, edge list.
- **Center panel**: graph canvas.
- **Right panel**: node editor.
- **Bottom panel**: runtime logs.

## 3) Create or select a flow
- Use `Flows` selector on the left.
- `New flow`: opens a small modal to name a flow.
- `Clone flow`: copy the current flow.
- `Delete flow`: remove current flow.
- If you start empty, use the graph area button `Start first-run wizard` for quick setup.

## 4) Build a graph

### Add a node
1. Click `New node`.
2. In the modal, choose node type and label.
4. Fill typed config fields in `Config fields`.
5. Click `Save node`.

### Advanced config mode
- If you need full control, open `Advanced JSON` in the node editor.
- Edit JSON and click `Apply JSON to fields`.
- Save node to persist.

### Connect nodes
- Use one of these methods:
  - `Edge builder` in the left panel.
  - Graph manipulation mode to add/remove connectors directly.

### Move nodes
- Drag nodes in the graph to arrange them vertically.
- Node positions are persisted in flow state.

## 5) Validate and run
- Click `Validate` before running.
- Click `Run flow` to execute selected flow.
- Click `Stop` to request cancellation.
- Watch status chip and logs for result details.

## 6) Configure startup auto-run

### In-app setup
1. Choose default flow in `Global settings`.
2. Enable `Auto-run default flow when started with --startup`.
3. Click `Install Task Scheduler`.

The app creates/updates a task named `Better Startup Win`.

### Runtime behavior
- At Windows logon, Task Scheduler launches app with `--startup`.
- App starts tray-first and auto-runs default flow.

## 7) Donation link
- Top bar `Support` button and tray `Support This Project` open donation URL.
- Default URL: `https://buymeacoffee.com/lucach`.
- Donation URL is not user-editable in settings.

## 8) Help link
- Top bar `Help` and sidebar `Open project repository` open:
  - `https://github.com/Cesarsk/better_startup_win`

## 9) Node config quick reference

### `delay`
```json
{ "milliseconds": 1000 }
```

### `start_process`
```json
{ "path": "C:\\Path\\App.exe", "args": "--flag", "workingDirectory": "" }
```

### `stop_process`
```json
{ "processName": "StreamDeck" }
```

### `close_window`
```json
{ "processName": "aida64", "waitMilliseconds": 5000 }
```

### `run_script`
```json
{ "path": "C:\\Scripts\\job.ps1", "args": "-DryRun", "waitForExit": true }
```

### `wait_display`
```json
{
  "adapterNameLike": "*RTX*",
  "width": 3440,
  "height": 1440,
  "refresh": 164,
  "pollSeconds": 10,
  "timeoutSeconds": 300
}
```

### `wait_monitor`
```json
{ "edidName": "XENEON EDGE", "pollSeconds": 10, "timeoutSeconds": 600 }
```

## 10) Troubleshooting
- **Flow does not start**: click `Validate`, fix graph errors first.
- **Task install fails**: run app as Administrator.
- **Process node fails**: confirm executable path and process name.
- **Wait nodes timeout**: reduce strictness (name matching, refresh target) or increase timeout.
