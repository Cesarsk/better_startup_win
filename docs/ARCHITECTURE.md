# Architecture Reference

This document describes the current MVP architecture for Better Startup Win.

## Goals
- Windows-only startup orchestration.
- Tray-first runtime, with an editable desktop GUI.
- Flows are modeled as DAGs for deterministic execution.
- One profile with multiple flows, one default flow for auto-run.
- Fresh installs start empty to avoid hidden assumptions.

## Problem statement
- At Windows logon, several hardware/control apps can race each other.
- In some setups, launch order and timing materially affect stability.
- Better Startup Win provides an explicit execution graph to encode that order.

Reference scenario (from this repository history):
- Sequence NZXT CAM, SignalRGB, AIDA64, and Stream Deck.
- Wait for target display readiness (resolution/refresh).
- Wait for monitor EDID presence before dependent actions.
- Apply delays and conditional transitions to reduce startup conflicts.

## Runtime model

The application has two execution modes:
- Normal mode: GUI window + tray.
- Startup mode (`--startup`): tray-first launch from Task Scheduler, optional auto-run of default flow.

Single-instance lock is enforced so duplicate startup invocations do not create multiple runtimes.

## Main components

### Main process (`electron/main.js`)
- Owns app lifecycle, tray menu, window visibility behavior.
- Registers IPC handlers exposed to renderer.
- Starts/stops flow execution through the runner.
- Installs/updates Task Scheduler startup task.
- Handles external links for project help repo and support page.

### Runner (`electron/runner.js`)
- Validates flow topology and references.
- Executes nodes in topological order.
- Evaluates edge conditions (`success`, `failure`, `always`).
- Emits run events:
  - `log`
  - `node`
  - `state`

### Store (`electron/store.js`)
- Persists app state as JSON in Electron userData.
- Uses default bootstrap state when first run.

### Default state (`electron/default-state.js`)
- Contains initial settings and a default flow mirroring legacy startup behavior.

### Preload bridge (`electron/preload.js`)
- Exposes a minimal API to renderer via context bridge.

### Renderer (`renderer/*`)
- Flow selection and settings.
- DAG graph view.
- Node and edge editor.
- Runtime log and status UI.
- UX layer includes first-run wizard, typed forms, and undo/redo controls.

## Data model (simplified)

```json
{
  "version": 1,
  "settings": {
    "autoRunOnStartup": true,
    "defaultFlowId": "flow-id",
    "donationUrl": "https://buymeacoffee.com/lucach"
  },
  "flows": [
    {
      "id": "flow-id",
      "name": "Flow Name",
      "description": "...",
      "nodes": [
        {
          "id": "node-id",
          "type": "start_process",
          "label": "Start X",
          "config": {},
          "position": { "x": 0, "y": 0 }
        }
      ],
      "edges": [
        {
          "id": "edge-id",
          "from": "node-a",
          "to": "node-b",
          "condition": "success"
        }
      ]
    }
  ]
}
```

## DAG behavior
- Cycles are rejected by validation.
- Node execution order uses topological sort.
- A node runs only when all inbound edge conditions are satisfied.

## Node execution contracts
- `delay`: waits configured milliseconds.
- `start_process`: uses PowerShell `Start-Process`.
- `stop_process`: force stops process by name.
- `close_window`: attempts graceful `CloseMainWindow()`.
- `run_script`: executes `.ps1`, `.bat`, `.cmd`, or executable.
- `wait_display`: polls `Win32_VideoController` via CIM.
- `wait_monitor`: polls EDID names via `WmiMonitorID`.

## Graph interaction model
- Vertical flow orientation for readability.
- Nodes are draggable; positions are persisted in flow state.
- Connectors can be created/removed directly from graph manipulation mode.
- UI includes undo/redo history for graph and settings edits.
- Empty-state first-run wizard bootstraps a first flow.

## Startup integration
- Task Scheduler launches app with `--startup`.
- App can auto-run default flow if `autoRunOnStartup` is enabled.
- Tray app remains running for manual re-run/stop operations.

## Known MVP limitations
- One profile only (multiple flows inside).
- No role-based permissions or multi-user sync.
- No packaged installer yet.
- Edge condition editing on-canvas is basic (detailed editing is still in side panel).
