const api = window.startupApi;

const elements = {
  openWorkflowsBtn: document.getElementById("open-workflows-btn"),
  openTemplatesBtn: document.getElementById("open-templates-btn"),
  openSettingsBtn: document.getElementById("open-settings-btn"),
  openLogBtn: document.getElementById("open-log-btn"),
  workflowSelect: document.getElementById("workflow-select"),
  workflowNameInput: document.getElementById("workflow-name-input"),
  workflowDescriptionInput: document.getElementById("workflow-description-input"),
  workflowParallelismInput: document.getElementById("workflow-parallelism-input"),
  defaultWorkflowSelect: document.getElementById("default-workflow-select"),
  autoRunCheckbox: document.getElementById("auto-run-checkbox"),
  minimizeToTrayCheckbox: document.getElementById("minimize-to-tray-checkbox"),
  startHiddenCheckbox: document.getElementById("start-hidden-checkbox"),
  startupStatusText: document.getElementById("startup-status-text"),
  enableStartupBtn: document.getElementById("enable-startup-btn"),
  disableStartupBtn: document.getElementById("disable-startup-btn"),
  validationBox: document.getElementById("validation-box"),
  templateSelect: document.getElementById("template-select"),
  loadTemplateBtn: document.getElementById("load-template-btn"),
  templateDescription: document.getElementById("template-description"),
  newWorkflowBtn: document.getElementById("new-workflow-btn"),
  cloneWorkflowBtn: document.getElementById("clone-workflow-btn"),
  deleteWorkflowBtn: document.getElementById("delete-workflow-btn"),
  newStepBtn: document.getElementById("new-step-btn"),
  deleteStepBtn: document.getElementById("delete-step-btn"),
  editorTitle: document.getElementById("editor-title"),
  editorSubtitle: document.getElementById("editor-subtitle"),
  stepSelectWrap: document.getElementById("step-select-wrap"),
  stepSelect: document.getElementById("step-select"),
  connectionEditor: document.getElementById("connection-editor"),
  connectionSourceLabel: document.getElementById("connection-source-label"),
  connectionTargetLabel: document.getElementById("connection-target-label"),
  connectionEventSelect: document.getElementById("connection-event-select"),
  deleteConnectionBtn: document.getElementById("delete-connection-btn"),
  deleteStepRow: document.getElementById("delete-step-row"),
  stepEditorEmpty: document.getElementById("step-editor-empty"),
  stepEditorBody: document.getElementById("step-editor-body"),
  stepLabelInput: document.getElementById("step-label-input"),
  stepActionSelect: document.getElementById("step-action-select"),
  stepGateSelect: document.getElementById("step-gate-select"),
  stepTimeoutInput: document.getElementById("step-timeout-input"),
  stepRetryCountInput: document.getElementById("step-retry-count-input"),
  stepRetryDelayInput: document.getElementById("step-retry-delay-input"),
  stepOnFailureSelect: document.getElementById("step-on-failure-select"),
  actionFields: document.getElementById("action-fields"),
  actionExample: document.getElementById("action-example"),
  stepConfigStatus: document.getElementById("step-config-status"),
  dependencySourceSelect: document.getElementById("dependency-source-select"),
  dependencyEventSelect: document.getElementById("dependency-event-select"),
  addDependencyBtn: document.getElementById("add-dependency-btn"),
  dependencyList: document.getElementById("dependency-list"),
  graphCanvas: document.getElementById("graph-canvas"),
  layoutResizer: document.getElementById("layout-resizer"),
  graphSelectToolBtn: document.getElementById("graph-select-tool-btn"),
  graphHandToolBtn: document.getElementById("graph-hand-tool-btn"),
  zoomOutBtn: document.getElementById("zoom-out-btn"),
  zoomInBtn: document.getElementById("zoom-in-btn"),
  fitGraphBtn: document.getElementById("fit-graph-btn"),
  runtimeChip: document.getElementById("runtime-chip"),
  saveStateBtn: document.getElementById("save-state-btn"),
  validateWorkflowBtn: document.getElementById("validate-workflow-btn"),
  runWorkflowBtn: document.getElementById("run-workflow-btn"),
  stopWorkflowBtn: document.getElementById("stop-workflow-btn"),
  themeLightBtn: document.getElementById("theme-light-btn"),
  themeDarkBtn: document.getElementById("theme-dark-btn"),
  helpBtn: document.getElementById("help-btn"),
  clearLogsBtn: document.getElementById("clear-logs-btn"),
  logOutput: document.getElementById("log-output"),
  graphContextMenu: document.getElementById("graph-context-menu"),
  graphContextTitle: document.getElementById("graph-context-title"),
  graphContextRunBtn: document.getElementById("graph-context-run-btn"),
  graphContextDeleteBtn: document.getElementById("graph-context-delete-btn"),
  graphContextNewBtn: document.getElementById("graph-context-new-btn"),
  workflowManagerModal: document.getElementById("workflow-manager-modal"),
  workflowManagerClose: document.getElementById("workflow-manager-close"),
  settingsModal: document.getElementById("settings-modal"),
  settingsCloseBtn: document.getElementById("settings-close-btn"),
  openHostPageBtn: document.getElementById("open-host-page-btn"),
  openGithubProfileBtn: document.getElementById("open-github-profile-btn"),
  openDonationPageBtn: document.getElementById("open-donation-page-btn"),
  templateModal: document.getElementById("template-modal"),
  templateModalClose: document.getElementById("template-modal-close"),
  workflowModal: document.getElementById("workflow-modal"),
  workflowModalName: document.getElementById("workflow-modal-name"),
  workflowModalCancel: document.getElementById("workflow-modal-cancel"),
  workflowModalCreate: document.getElementById("workflow-modal-create"),
  stepModal: document.getElementById("step-modal"),
  stepModalLabel: document.getElementById("step-modal-label"),
  stepModalAction: document.getElementById("step-modal-action"),
  stepModalCancel: document.getElementById("step-modal-cancel"),
  stepModalCreate: document.getElementById("step-modal-create"),
  logModal: document.getElementById("log-modal"),
  logModalClose: document.getElementById("log-modal-close"),
  supportModal: document.getElementById("support-modal"),
  supportDontShowCheckbox: document.getElementById("support-dont-show-checkbox"),
  supportYesBtn: document.getElementById("support-yes-btn"),
  supportNoBtn: document.getElementById("support-no-btn"),
  tutorialOverlay: document.getElementById("tutorial-overlay"),
  tutorialHighlight: document.getElementById("tutorial-highlight"),
  tutorialCard: document.getElementById("tutorial-card"),
  tutorialStepCount: document.getElementById("tutorial-step-count"),
  tutorialTitle: document.getElementById("tutorial-title"),
  tutorialBody: document.getElementById("tutorial-body"),
  tutorialSkipBtn: document.getElementById("tutorial-skip-btn"),
  tutorialBackBtn: document.getElementById("tutorial-back-btn"),
  tutorialNextBtn: document.getElementById("tutorial-next-btn")
};

let catalog = null;
let state = null;
let selectedWorkflowId = null;
let selectedStepId = null;
let selectedEdgeId = null;
let graphContextStepId = null;
let graphContextMode = "canvas";
let graphMetrics = null;
let graphViewState = {
  scale: 1
};
let graphTool = "select";
const graphPanState = {
  active: false,
  button: null,
  pointerId: null,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0,
  moved: false,
  suppressClick: false
};
const linkDraft = {
  sourceStepId: null,
  sourceHandle: null,
  pointerSceneX: 0,
  pointerSceneY: 0
};
const paneResizeState = {
  active: false,
  startX: 0,
  startWidth: 0
};
let runtime = {
  running: false,
  workflowId: null,
  stepStatus: {},
  stepEvents: {},
  failed: false,
  cancelled: false
};
const logs = [];
let currentTheme = "light";
let startupStatus = {
  enabled: false,
  elevated: false
};
const tutorial = {
  index: 0,
  steps: [
    {
      title: "Open workflows and templates from the top",
      body: "Use these buttons when you want to switch workflows, load an example, save your changes, or run the current setup.",
      target: ".top-actions"
    },
    {
      title: "Use the graph as the main view",
      body: "The graph is the main workspace. Click an action to edit the action itself, or click a dependency label like Started to edit what that link means.",
      target: "#tutorial-graph"
    },
    {
      title: "Edit the selected action or dependency",
      body: "The right panel changes based on what you clicked. It lets you adjust action details, retries, failure behavior, or the event that unlocks the next action.",
      target: "#tutorial-editor"
    },
    {
      title: "Check the run log",
      body: "Open the run log from the top bar whenever you want to inspect the last run in detail without shrinking the main workspace.",
      target: "#open-log-btn"
    }
  ]
};

function buildStartupAllTemplate() {
  const repoRoot = "C:\\Users\\lucac\\Documents\\Projects\\better-startup";
  const touchCalibrationPath = `${repoRoot}\\bin\\TouchCalibration.bat`;

  return {
    name: "StartupAll migration",
    description: "Translated from bin\\StartupAll.ps1 and config\\startup.config.psd1 so the old startup script becomes a visible BetterStartup graph.",
    maxParallelism: 1,
    steps: [
      {
        label: "Wait for preferred display",
        actionType: "run_powershell",
        action: {
          script: [
            "$deadline = (Get-Date).AddSeconds(300)",
            "$ready = $false",
            "while ((Get-Date) -lt $deadline) {",
            "  $adapter = Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.Name -like '*RTX*' -and $_.CurrentHorizontalResolution -and $_.CurrentVerticalResolution -and $_.CurrentRefreshRate } | Select-Object -First 1",
            "  if ($adapter -and $adapter.CurrentHorizontalResolution -eq 3440 -and $adapter.CurrentVerticalResolution -eq 1440 -and $adapter.CurrentRefreshRate -eq 164) { $ready = $true; break }",
            "  Start-Sleep -Seconds 10",
            "}",
            "if (-not $ready) { throw 'Timeout waiting for preferred resolution.' }"
          ].join("\n"),
          timeoutSeconds: 320
        },
        gate: "all",
        policy: { timeoutSeconds: 330, retryCount: 0, retryDelayMilliseconds: 1000, onFailure: "stop_workflow" }
      },
      {
        label: "Stop OpenRGB",
        actionType: "stop_process",
        action: { processName: "OpenRGB", force: true },
        gate: "all"
      },
      {
        label: "Wait before launching OpenRGB",
        actionType: "wait",
        action: { milliseconds: 20000 },
        gate: "all"
      },
      {
        label: "Start OpenRGB server and load default profile",
        actionType: "run_powershell",
        action: {
          script: [
            "$path = 'C:\\Program Files\\OpenRGB\\OpenRGB.exe'",
            "if (-not (Test-Path -LiteralPath $path)) { throw \"Missing executable path: $path\" }",
            "Start-Process -FilePath $path -ArgumentList @('--noautoconnect', '--server', '--server-host', '127.0.0.1', '--server-port', '6742', '--startminimized') -WindowStyle Minimized | Out-Null",
            "$deadline = (Get-Date).AddSeconds(30)",
            "$connected = $false",
            "do {",
            "  $listener = Get-NetTCPConnection -LocalAddress '127.0.0.1' -LocalPort 6742 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1",
            "  if ($listener) { $connected = $true; break }",
            "  Start-Sleep -Milliseconds 500",
            "} while ((Get-Date) -lt $deadline)",
            "if (-not $connected) { throw 'Timed out waiting for OpenRGB SDK server.' }",
            "$client = [System.Net.Sockets.TcpClient]::new()",
            "$connect = $client.BeginConnect('127.0.0.1', 6742, $null, $null)",
            "if (-not $connect.AsyncWaitHandle.WaitOne(10000)) { throw 'Timed out connecting to OpenRGB SDK server.' }",
            "$client.EndConnect($connect)",
            "$stream = $client.GetStream()",
            "$stream.ReadTimeout = 10000; $stream.WriteTimeout = 10000",
            "function Write-Packet([UInt32]$packetId, [byte[]]$payload = [byte[]]::new(0), [UInt32]$deviceIndex = 0) {",
            "  $header = [byte[]]::new(16)",
            "  [System.Text.Encoding]::ASCII.GetBytes('ORGB').CopyTo($header, 0)",
            "  [BitConverter]::GetBytes($deviceIndex).CopyTo($header, 4)",
            "  [BitConverter]::GetBytes($packetId).CopyTo($header, 8)",
            "  [BitConverter]::GetBytes([UInt32]$payload.Length).CopyTo($header, 12)",
            "  $stream.Write($header, 0, $header.Length)",
            "  if ($payload.Length -gt 0) { $stream.Write($payload, 0, $payload.Length) }",
            "  $stream.Flush()",
            "}",
            "function Read-Exact([int]$length) {",
            "  $buffer = [byte[]]::new($length); $offset = 0",
            "  while ($offset -lt $length) { $read = $stream.Read($buffer, $offset, $length - $offset); if ($read -le 0) { throw 'OpenRGB SDK connection closed while reading.' }; $offset += $read }",
            "  $buffer",
            "}",
            "function Read-Packet() {",
            "  $header = Read-Exact 16",
            "  if ([System.Text.Encoding]::ASCII.GetString($header, 0, 4) -ne 'ORGB') { throw 'Unexpected OpenRGB SDK packet magic.' }",
            "  $size = [BitConverter]::ToUInt32($header, 12)",
            "  $payload = [byte[]]::new(0); if ($size -gt 0) { $payload = Read-Exact ([int]$size) }",
            "  [PSCustomObject]@{ DeviceIndex = [BitConverter]::ToUInt32($header, 4); PacketId = [BitConverter]::ToUInt32($header, 8); Payload = $payload }",
            "}",
            "function Read-Response([UInt32]$packetId) {",
            "  do { $reply = Read-Packet } while ($reply.PacketId -eq 100)",
            "  if ($reply.PacketId -ne $packetId) { throw \"Unexpected OpenRGB SDK packet id: $($reply.PacketId); expected $packetId.\" }",
            "  $reply",
            "}",
            "function Read-U16([byte[]]$data, [ref]$offset) { $value = [BitConverter]::ToUInt16($data, $offset.Value); $offset.Value += 2; $value }",
            "function Read-I32([byte[]]$data, [ref]$offset) { $value = [BitConverter]::ToInt32($data, $offset.Value); $offset.Value += 4; $value }",
            "function Skip-Str([byte[]]$data, [ref]$offset) { $length = Read-U16 $data $offset; $offset.Value += $length }",
            "function Skip-Mode([byte[]]$data, [ref]$offset, [int]$protocol) {",
            "  Skip-Str $data $offset; $offset.Value += 16; if ($protocol -ge 3) { $offset.Value += 8 }; $offset.Value += 12; if ($protocol -ge 3) { $offset.Value += 4 }; $offset.Value += 8",
            "  $colorCount = Read-U16 $data $offset; $offset.Value += (4 * $colorCount)",
            "}",
            "function Get-ActiveModePayload([byte[]]$data, [int]$protocol) {",
            "  $offset = 8; $ref = [ref]$offset",
            "  Skip-Str $data $ref; if ($protocol -ge 1) { Skip-Str $data $ref }; Skip-Str $data $ref; Skip-Str $data $ref; Skip-Str $data $ref; Skip-Str $data $ref",
            "  $modeCount = Read-U16 $data $ref; $activeMode = Read-I32 $data $ref",
            "  if ($activeMode -lt 0 -or $activeMode -ge $modeCount) { throw 'OpenRGB SDK active mode index out of range.' }",
            "  for ($modeIndex = 0; $modeIndex -lt $modeCount; $modeIndex++) {",
            "    $modeStart = $ref.Value; Skip-Mode $data $ref $protocol",
            "    if ($modeIndex -eq $activeMode) { $modeLength = $ref.Value - $modeStart; $payloadLength = 8 + $modeLength; $payload = [byte[]]::new($payloadLength); [BitConverter]::GetBytes([UInt32]$payloadLength).CopyTo($payload, 0); [BitConverter]::GetBytes([Int32]$activeMode).CopyTo($payload, 4); [Array]::Copy($data, $modeStart, $payload, 8, $modeLength); return $payload }",
            "  }",
            "  throw 'OpenRGB SDK active mode not found in controller data.'",
            "}",
            "function Get-ColorPayload([byte[]]$data, [int]$protocol) {",
            "  $offset = 8; $ref = [ref]$offset",
            "  Skip-Str $data $ref; if ($protocol -ge 1) { Skip-Str $data $ref }; Skip-Str $data $ref; Skip-Str $data $ref; Skip-Str $data $ref; Skip-Str $data $ref",
            "  $modeCount = Read-U16 $data $ref; $ref.Value += 4",
            "  for ($modeIndex = 0; $modeIndex -lt $modeCount; $modeIndex++) { Skip-Mode $data $ref $protocol }",
            "  $zoneCount = Read-U16 $data $ref",
            "  for ($zoneIndex = 0; $zoneIndex -lt $zoneCount; $zoneIndex++) {",
            "    Skip-Str $data $ref; $ref.Value += 16; $matrixLength = Read-U16 $data $ref; $ref.Value += $matrixLength",
            "    if ($protocol -ge 4) { $segmentCount = Read-U16 $data $ref; for ($segmentIndex = 0; $segmentIndex -lt $segmentCount; $segmentIndex++) { Skip-Str $data $ref; $ref.Value += 12 } }",
            "    if ($protocol -ge 5) { $ref.Value += 4 }",
            "  }",
            "  $ledCount = Read-U16 $data $ref",
            "  for ($ledIndex = 0; $ledIndex -lt $ledCount; $ledIndex++) { Skip-Str $data $ref; $ref.Value += 4 }",
            "  $colorStart = $ref.Value; $colorCount = Read-U16 $data $ref; $colorDataLength = 2 + (4 * $colorCount); $payloadLength = 4 + $colorDataLength",
            "  $payload = [byte[]]::new($payloadLength); [BitConverter]::GetBytes([UInt32]$payloadLength).CopyTo($payload, 0); [Array]::Copy($data, $colorStart, $payload, 4, $colorDataLength); $payload",
            "}",
            "function Get-ControllerName([byte[]]$data) { $offset = 8; $ref = [ref]$offset; $length = Read-U16 $data $ref; [System.Text.Encoding]::UTF8.GetString($data, $ref.Value, $length).TrimEnd([char]0) }",
            "function Get-ControllerNames() {",
            "  Write-Packet 0; $countReply = Read-Response 0",
            "  if ($countReply.Payload.Length -lt 4) { throw 'OpenRGB SDK controller count request failed.' }",
            "  $count = [BitConverter]::ToUInt32($countReply.Payload, 0); $names = @()",
            "  for ($controllerIndex = 0; $controllerIndex -lt $count; $controllerIndex++) { Write-Packet 1 ([byte[]]::new(0)) ([UInt32]$controllerIndex); $names += Get-ControllerName (Read-Response 1).Payload }",
            "  $names",
            "}",
            "function Wait-Controllers([string[]]$patterns, [int]$timeoutSeconds) {",
            "  $deadline = (Get-Date).AddSeconds($timeoutSeconds); $lastNames = @()",
            "  do {",
            "    $lastNames = @(Get-ControllerNames)",
            "    $missing = @($patterns | Where-Object { $pattern = $_; -not ($lastNames | Where-Object { $_ -like \"*$pattern*\" }) })",
            "    if ($missing.Count -eq 0) { return }",
            "    Start-Sleep -Seconds 2",
            "  } while ((Get-Date) -lt $deadline)",
            "  Write-Output (\"OpenRGB controllers not all detected before profile load. Missing: {0}. Available: {1}\" -f ($missing -join ', '), ($lastNames -join ', '))",
            "}",
"Wait-Controllers @('Govee') 45",
"Start-Sleep -Seconds 5",
"$protocol = 0",
"$profileBytes = [System.Text.Encoding]::UTF8.GetBytes('default' + [char]0)",
"Write-Packet 152 $profileBytes",
"Start-Sleep -Milliseconds 500",
"function Update-SomeControllers([string]$namePattern, [int]$repeatCount, [int]$delayMs) {",
"  Write-Packet 0; $countReply = Read-Response 0",
"  if ($countReply.Payload.Length -lt 4) { throw 'OpenRGB SDK controller count request failed.' }",
"  $controllerCount = [BitConverter]::ToUInt32($countReply.Payload, 0); $indexes = @()",
"  for ($controllerIndex = 0; $controllerIndex -lt $controllerCount; $controllerIndex++) {",
"    Write-Packet 1 ([byte[]]::new(0)) ([UInt32]$controllerIndex); $dataReply = Read-Response 1",
"    if ($namePattern -eq '*' -or (Get-ControllerName $dataReply.Payload) -like $namePattern) { $indexes += [int]$controllerIndex }",
"  }",
"  for ($repeatIndex = 0; $repeatIndex -lt $repeatCount; $repeatIndex++) {",
"    foreach ($controllerIndex in $indexes) {",
"      Write-Packet 1 ([byte[]]::new(0)) ([UInt32]$controllerIndex); $dataReply = Read-Response 1",
"      Write-Packet 1101 (Get-ActiveModePayload $dataReply.Payload $protocol) ([UInt32]$controllerIndex)",
"      Write-Packet 1050 (Get-ColorPayload $dataReply.Payload $protocol) ([UInt32]$controllerIndex)",
"    }",
"    if ($repeatIndex -lt ($repeatCount - 1)) { Start-Sleep -Milliseconds $delayMs }",
"  }",
"}",
"Update-SomeControllers '*Corsair Vengeance*' 1 0",
"Update-SomeControllers '*Govee*' 3 2000",
            "$client.Close()"
          ].join("\n"),
          timeoutSeconds: 100
        },
        gate: "all"
      },
      {
        label: "Run touch calibration when display is ready",
        actionType: "run_powershell",
        action: {
          script: [
            "$touchScript = 'C:\\Users\\lucac\\Documents\\Projects\\better-startup\\bin\\TouchCalibration.bat'",
            "$adapter = Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.Name -like '*RTX*' -and $_.CurrentHorizontalResolution -and $_.CurrentVerticalResolution -and $_.CurrentRefreshRate } | Select-Object -First 1",
            "if (-not $adapter) { throw 'Target display adapter not found.' }",
            "if ($adapter.CurrentHorizontalResolution -ne 3440 -or $adapter.CurrentVerticalResolution -ne 1440 -or $adapter.CurrentRefreshRate -ne 164) { Write-Output 'Skipping touch calibration'; exit 0 }",
            "if (-not (Test-Path -LiteralPath $touchScript)) { throw \"Missing touch calibration launcher: $touchScript\" }",
            "$process = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', \"`\"$touchScript`\"\" -Wait -PassThru",
            "if ($process.ExitCode -ne 0) { throw (\"Touch calibration exited with code {0}\" -f $process.ExitCode) }"
          ].join("\n"),
          timeoutSeconds: 180
        },
        gate: "all",
        policy: { timeoutSeconds: 190, retryCount: 0, retryDelayMilliseconds: 1000, onFailure: "stop_workflow" }
      }
    ],
    edges: Array.from({ length: 4 }, (_, index) => ({ from: index, to: index + 1, event: "completed" })),
    notes: {
      source: "bin\\StartupAll.ps1",
      config: "config\\startup.config.psd1",
      touchCalibrationPath
    }
  };
}

const STARTER_TEMPLATES = [
  {
    id: "startupall-migration",
    name: "StartupAll script migration",
    description: "Imports the current StartupAll PowerShell script as a sequential BetterStartup workflow so you can inspect and edit it visually.",
    build: buildStartupAllTemplate
  },
  {
    id: "sequential-apps",
    name: "Start one app after another",
    description: "Launch app A, then launch app B only after app A has started.",
    build() {
      return {
        name: "Sequential startup",
        description: "Start one application after another in a predictable order.",
        maxParallelism: 1,
        steps: [
          {
            label: "Start app A",
            actionType: "start_app",
            action: { path: "C:\\Path\\AppA.exe", args: "", workingDirectory: "", waitForExit: false },
            gate: "all"
          },
          {
            label: "Start app B",
            actionType: "start_app",
            action: { path: "C:\\Path\\AppB.exe", args: "", workingDirectory: "", waitForExit: false },
            gate: "all"
          }
        ],
        edges: [{ from: 0, to: 1, event: "started" }]
      };
    }
  },
  {
    id: "run-after-close",
    name: "Run after another action closes",
    description: "Run a second action only after the first launched process has exited.",
    build() {
      return {
        name: "Run after close",
        description: "Wait for one process to exit before continuing.",
        maxParallelism: 1,
        steps: [
          {
            label: "Launch setup app",
            actionType: "start_app",
            action: { path: "C:\\Path\\SetupTool.exe", args: "", workingDirectory: "", waitForExit: false },
            gate: "all"
          },
          {
            label: "Run follow-up command",
            actionType: "run_command",
            action: { command: "cmd.exe", args: "/c echo next step", workingDirectory: "", useShell: false, waitForExit: true },
            gate: "all"
          }
        ],
        edges: [{ from: 0, to: 1, event: "process_exited" }]
      };
    }
  },
  {
    id: "retry-until-ready",
    name: "Retry until ready",
    description: "Retry a setup action and stop the workflow only if it keeps failing.",
    build() {
      return {
        name: "Retry until ready",
        description: "Retry a preparation command before launching the dependent app.",
        maxParallelism: 1,
        steps: [
          {
            label: "Prepare environment",
            actionType: "run_command",
            action: { command: "cmd.exe", args: "/c echo prepare", workingDirectory: "", useShell: false, waitForExit: true },
            gate: "all",
            policy: { timeoutSeconds: 30, retryCount: 2, retryDelayMilliseconds: 3000, onFailure: "stop_workflow" }
          },
          {
            label: "Start main app",
            actionType: "start_app",
            action: { path: "C:\\Path\\MainApp.exe", args: "", workingDirectory: "", waitForExit: false },
            gate: "all"
          }
        ],
        edges: [{ from: 0, to: 1, event: "succeeded" }]
      };
    }
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildId(prefix, label) {
  const tail = String(label || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 28);

  const token = window.crypto?.randomUUID ? window.crypto.randomUUID().slice(0, 6) : Math.random().toString(36).slice(2, 8);
  return `${prefix}-${tail || "item"}-${token}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function actionDefinition(actionType) {
  return catalog.actions.find((action) => action.type === actionType) || null;
}

function actionLabel(actionType) {
  return actionDefinition(actionType)?.label || actionType;
}

function edgeEventLabel(eventName) {
  return catalog.edgeEvents.find((event) => event.value === eventName)?.label || eventName;
}

function getDefaultActionConfig(actionType) {
  return clone(actionDefinition(actionType)?.defaultConfig || {});
}

function getDefaultStepPolicy() {
  return {
    timeoutSeconds: 0,
    retryCount: 0,
    retryDelayMilliseconds: 1000,
    onFailure: "continue"
  };
}

function normalizeStepPolicy(policy) {
  const defaults = getDefaultStepPolicy();
  return {
    timeoutSeconds: Math.max(0, Number(policy?.timeoutSeconds ?? defaults.timeoutSeconds) || 0),
    retryCount: Math.max(0, Number(policy?.retryCount ?? defaults.retryCount) || 0),
    retryDelayMilliseconds: Math.max(0, Number(policy?.retryDelayMilliseconds ?? defaults.retryDelayMilliseconds) || 0),
    onFailure: String(policy?.onFailure || defaults.onFailure) === "stop_workflow" ? "stop_workflow" : "continue"
  };
}

function actionExampleText(actionType) {
  switch (actionType) {
    case "start_app":
      return "Example: Start Discord after Steam has started.";
    case "run_command":
      return "Example: Run a setup command after another action succeeded.";
    case "run_powershell":
      return "Example: Check a Windows condition before moving on.";
    case "wait":
      return "Example: Wait 5 seconds before continuing.";
    case "stop_process":
      return "Example: Stop OneDrive before starting a conflicting tool.";
    case "close_window":
      return "Example: Ask an app to close before launching its replacement.";
    default:
      return "";
  }
}

function githubProfileUrl(repoUrl) {
  const match = String(repoUrl || "").trim().match(/^https?:\/\/github\.com\/([^/]+)\/[^/]+\/?$/i);
  return match ? `https://github.com/${match[1]}` : "";
}

function donationPageUrl(settings) {
  const explicitUrl = String(settings?.donationUrl || "").trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const profileUrl = githubProfileUrl(settings?.repoUrl);
  const owner = profileUrl.split("/").filter(Boolean).pop();
  return owner ? `https://github.com/sponsors/${owner}` : "";
}

async function saveSupportPromptPreference() {
  state.settings.suppressSupportPrompt = !!elements.supportDontShowCheckbox.checked;
  state = await api.saveState(state);
}

async function closeSupportPrompt() {
  await saveSupportPromptPreference();
  closeDialog(elements.supportModal);
}

async function openSupportPromptIfNeeded() {
  if (state.settings.suppressSupportPrompt) {
    return;
  }

  if (
    elements.workflowManagerModal.open ||
    elements.settingsModal.open ||
    elements.templateModal.open ||
    elements.workflowModal.open ||
    elements.stepModal.open ||
    elements.logModal.open
  ) {
    return;
  }

  elements.supportDontShowCheckbox.checked = false;
  showDialog(elements.supportModal);
}

function startupStatusMessage() {
  if (startupStatus.enabled) {
    return startupStatus.elevated
      ? "Windows startup is enabled. BetterStartup will launch from a logon task with highest privileges."
      : "Windows startup is enabled.";
  }

  return "Windows startup is disabled. BetterStartup will not launch by itself when you sign in.";
}

function currentWorkflow() {
  return state.workflows.find((workflow) => workflow.id === selectedWorkflowId) || null;
}

function currentStep() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return null;
  }

  return workflow.steps.find((step) => step.id === selectedStepId) || null;
}

function currentEdge() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return null;
  }

  return workflow.edges.find((edge) => edge.id === selectedEdgeId) || null;
}

function currentEditorMode() {
  if (currentEdge()) {
    return "edge";
  }
  if (currentStep()) {
    return "step";
  }
  return "empty";
}

function incomingEdges(stepId) {
  const workflow = currentWorkflow();
  if (!workflow) {
    return [];
  }

  return workflow.edges.filter((edge) => edge.to === stepId);
}

function edgePairKey(edge) {
  return `${edge?.from || ""}->${edge?.to || ""}`;
}

function edgePairCounts(edges) {
  const counts = new Map();
  for (const edge of edges || []) {
    const key = edgePairKey(edge);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function isDuplicateEdgePair(edge, counts = edgePairCounts(currentWorkflow()?.edges || [])) {
  return (counts.get(edgePairKey(edge)) || 0) > 1;
}

function clearLinkDraft() {
  linkDraft.sourceStepId = null;
  linkDraft.sourceHandle = null;
}

function normalizeActionConfig(actionType, action) {
  const definition = actionDefinition(actionType);
  const defaults = getDefaultActionConfig(actionType);
  const next = { ...defaults };

  if (!definition) {
    return next;
  }

  for (const field of definition.fields) {
    const value = action?.[field.key];
    if (field.type === "checkbox") {
      next[field.key] = !!value;
    } else if (field.type === "number") {
      const parsed = Number(value);
      next[field.key] = Number.isFinite(parsed) ? parsed : Number(defaults[field.key] || 0);
    } else if (value == null) {
      next[field.key] = "";
    } else {
      next[field.key] = String(value);
    }
  }

  return next;
}

function validateActionConfig(actionType, action) {
  const definition = actionDefinition(actionType);
  const errors = {};

  if (!definition) {
    errors.actionType = "Unknown action type.";
    return errors;
  }

  for (const field of definition.fields) {
    const value = action[field.key];
    if (field.type === "checkbox") {
      continue;
    }

    if (field.type === "number") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        errors[field.key] = "Enter a valid number.";
        continue;
      }
      if (field.min != null && parsed < field.min) {
        errors[field.key] = `Must be at least ${field.min}.`;
      }
      continue;
    }

    const text = String(value || "").trim();
    if (field.required && text.length === 0) {
      errors[field.key] = "This field is required.";
    }
  }

  return errors;
}

function showDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.open = true;
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.open = false;
}

function hideGraphContextMenu() {
  graphContextStepId = null;
  graphContextMode = "canvas";
  elements.graphContextMenu.hidden = true;
}

function showGraphContextMenu(stepId, clientX, clientY) {
  const workflow = currentWorkflow();
  graphContextStepId = stepId;
  graphContextMode = stepId ? "step" : "canvas";
  const step = workflow?.steps.find((item) => item.id === stepId);
  elements.graphContextTitle.textContent = step ? step.label : "Graph";
  elements.graphContextRunBtn.hidden = !step;
  elements.graphContextDeleteBtn.hidden = !step;
  elements.graphContextNewBtn.hidden = !!step;
  elements.graphContextRunBtn.disabled = runtime.running || !step;
  elements.graphContextDeleteBtn.disabled = !step;
  elements.graphContextNewBtn.disabled = !workflow;
  elements.graphContextMenu.hidden = false;

  const menuWidth = 220;
  const menuHeight = 100;
  const left = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, clientX));
  const top = Math.min(window.innerHeight - menuHeight - 12, Math.max(12, clientY));
  elements.graphContextMenu.style.left = `${left}px`;
  elements.graphContextMenu.style.top = `${top}px`;
}

function startGraphPan(event) {
  graphPanState.active = true;
  graphPanState.button = event.button;
  graphPanState.pointerId = event.pointerId ?? null;
  graphPanState.startX = event.clientX;
  graphPanState.startY = event.clientY;
  graphPanState.scrollLeft = elements.graphCanvas.scrollLeft;
  graphPanState.scrollTop = elements.graphCanvas.scrollTop;
  graphPanState.moved = false;
  elements.graphCanvas.classList.add("panning");
  document.body.classList.add("graph-panning");

  if (typeof elements.graphCanvas.setPointerCapture === "function" && event.pointerId != null) {
    try {
      elements.graphCanvas.setPointerCapture(event.pointerId);
    } catch {}
  }
}

function updateGraphPan(event) {
  if (!graphPanState.active) {
    return;
  }

  const deltaX = event.clientX - graphPanState.startX;
  const deltaY = event.clientY - graphPanState.startY;
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    graphPanState.moved = true;
  }

  elements.graphCanvas.scrollLeft = graphPanState.scrollLeft - deltaX;
  elements.graphCanvas.scrollTop = graphPanState.scrollTop - deltaY;
}

function stopGraphPan() {
  const shouldSuppressClick = graphPanState.active && graphPanState.moved;
  graphPanState.active = false;
  graphPanState.button = null;
  graphPanState.pointerId = null;
  graphPanState.moved = false;
  elements.graphCanvas.classList.remove("panning");
  document.body.classList.remove("graph-panning");

  if (shouldSuppressClick) {
    graphPanState.suppressClick = true;
    window.setTimeout(() => {
      graphPanState.suppressClick = false;
    }, 0);
  }
}

function shouldStartGraphPan(event) {
  if (!event.target.closest("#graph-canvas")) {
    return false;
  }

  if (event.button === 1) {
    return true;
  }

  if (event.button !== 0) {
    return false;
  }

  const interactiveSelector = "[data-connector-step-id], .graph-edge-pill, [data-edge-id], select, input, textarea, button, summary, label";
  if (event.target.closest(interactiveSelector)) {
    return false;
  }

  if (graphTool === "pan") {
    return true;
  }

  return !event.target.closest("[data-step-id]");
}

function detectPreferredTheme() {
  try {
    const stored = window.localStorage.getItem("betterstartup-theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {}

  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.setAttribute("data-theme", currentTheme);
  elements.themeLightBtn.classList.toggle("active", currentTheme === "light");
  elements.themeDarkBtn.classList.toggle("active", currentTheme === "dark");
  elements.themeLightBtn.setAttribute("aria-pressed", currentTheme === "light" ? "true" : "false");
  elements.themeDarkBtn.setAttribute("aria-pressed", currentTheme === "dark" ? "true" : "false");

  try {
    window.localStorage.setItem("betterstartup-theme", currentTheme);
  } catch {}
}

function detectPreferredEditorWidth() {
  try {
    const stored = Number(window.localStorage.getItem("betterstartup-editor-width"));
    if (Number.isFinite(stored) && stored >= 320) {
      return stored;
    }
  } catch {}

  return 420;
}

function applyEditorWidth(width) {
  const maxWidth = Math.max(360, Math.min(760, Math.floor(window.innerWidth * 0.52)));
  const nextWidth = Math.max(320, Math.min(maxWidth, Math.round(width)));
  document.body.style.setProperty("--editor-width", `${nextWidth}px`);

  try {
    window.localStorage.setItem("betterstartup-editor-width", String(nextWidth));
  } catch {}
}

function startTutorial(startIndex = 0) {
  tutorial.index = Math.max(0, Math.min(startIndex, tutorial.steps.length - 1));
  elements.tutorialOverlay.hidden = false;
  renderTutorialStep();
}

function stopTutorial() {
  elements.tutorialOverlay.hidden = true;
}

function positionTutorialCard(rect) {
  const padding = 16;
  const cardWidth = Math.min(360, window.innerWidth - 32);
  const preferredLeft = Math.min(window.innerWidth - cardWidth - padding, Math.max(padding, rect.right + 18));
  const fallbackLeft = Math.max(padding, rect.left);
  const left = rect.right + cardWidth + 34 <= window.innerWidth ? preferredLeft : fallbackLeft;
  const top = Math.min(window.innerHeight - 210, Math.max(padding, rect.top));

  elements.tutorialCard.style.left = `${left}px`;
  elements.tutorialCard.style.top = `${top}px`;
}

function renderTutorialStep() {
  const step = tutorial.steps[tutorial.index];
  if (!step) {
    stopTutorial();
    return;
  }

  const target = document.querySelector(step.target);
  const rect = target?.getBoundingClientRect?.() || {
    left: 24,
    top: 24,
    width: Math.max(320, window.innerWidth - 48),
    height: 120
  };

  elements.tutorialHighlight.style.left = `${Math.max(8, rect.left - 10)}px`;
  elements.tutorialHighlight.style.top = `${Math.max(8, rect.top - 10)}px`;
  elements.tutorialHighlight.style.width = `${Math.min(window.innerWidth - 16, rect.width + 20)}px`;
  elements.tutorialHighlight.style.height = `${Math.min(window.innerHeight - 16, rect.height + 20)}px`;

  elements.tutorialStepCount.textContent = `Step ${tutorial.index + 1} of ${tutorial.steps.length}`;
  elements.tutorialTitle.textContent = step.title;
  elements.tutorialBody.textContent = step.body;
  elements.tutorialBackBtn.disabled = tutorial.index === 0;
  elements.tutorialNextBtn.textContent = tutorial.index === tutorial.steps.length - 1 ? "Finish" : "Next";
  positionTutorialCard(rect);
}

function appendLog(line) {
  logs.push(line);
  while (logs.length > 400) {
    logs.shift();
  }

  elements.logOutput.textContent = logs.join("\n");
  elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
}

function ensureSelections() {
  if (!state.workflows.length) {
    selectedWorkflowId = null;
    selectedStepId = null;
    selectedEdgeId = null;
    state.settings.defaultWorkflowId = "";
    return;
  }

  if (!selectedWorkflowId || !state.workflows.some((workflow) => workflow.id === selectedWorkflowId)) {
    selectedWorkflowId = state.settings.defaultWorkflowId && state.workflows.some((workflow) => workflow.id === state.settings.defaultWorkflowId)
      ? state.settings.defaultWorkflowId
      : state.workflows[0].id;
  }

  if (!state.settings.defaultWorkflowId || !state.workflows.some((workflow) => workflow.id === state.settings.defaultWorkflowId)) {
    state.settings.defaultWorkflowId = selectedWorkflowId;
  }

  const workflow = currentWorkflow();
  if (!workflow || workflow.steps.length === 0) {
    selectedStepId = null;
    selectedEdgeId = null;
    return;
  }

  if (selectedStepId && !workflow.steps.some((step) => step.id === selectedStepId)) {
    selectedStepId = null;
  }

  if (selectedEdgeId && !workflow.edges.some((edge) => edge.id === selectedEdgeId)) {
    selectedEdgeId = null;
  }

  if (linkDraft.sourceStepId && !workflow.steps.some((step) => step.id === linkDraft.sourceStepId)) {
    clearLinkDraft();
  }
}

function setValidationNotice(kind, message) {
  elements.validationBox.className = `notice-box ${kind}`;
  elements.validationBox.textContent = message;
}

function statusLabel(status) {
  return ({
    idle: "Idle",
    waiting: "Waiting",
    ready: "Ready",
    running: "Running",
    success: "Success",
    failed: "Failed",
    blocked: "Blocked",
    cancelled: "Cancelled"
  })[status] || "Idle";
}

function statusClass(status) {
  if (status === "running") {
    return "running";
  }
  if (status === "failed" || status === "cancelled") {
    return "failed";
  }
  if (status === "blocked") {
    return "blocked";
  }
  return "idle";
}

function nodeColor(status) {
  if (status === "running") {
    return { background: "#e7c978", border: "#b58e1c" };
  }
  if (status === "success") {
    return { background: "#c6e7d4", border: "#2c7b53" };
  }
  if (status === "failed" || status === "cancelled") {
    return { background: "#efcbc6", border: "#b55245" };
  }
  if (status === "blocked") {
    return { background: "#f0debf", border: "#a26a19" };
  }
  if (status === "waiting" || status === "ready") {
    return { background: "#e6ecef", border: "#8a98a6" };
  }
  return { background: "#f5f1ea", border: "#bbb5a9" };
}

function renderWorkflowOptions() {
  const repoUrl = String(state.settings.repoUrl || "").trim();
  const profileUrl = githubProfileUrl(repoUrl);
  const donateUrl = donationPageUrl(state.settings);

  if (!state.workflows.length) {
    elements.workflowSelect.innerHTML = '<option value="">No workflows yet</option>';
    elements.defaultWorkflowSelect.innerHTML = '<option value="">No default workflow</option>';
    elements.workflowSelect.disabled = true;
    elements.defaultWorkflowSelect.disabled = true;
    elements.cloneWorkflowBtn.disabled = true;
    elements.deleteWorkflowBtn.disabled = true;
    elements.newStepBtn.disabled = true;
    elements.deleteStepBtn.disabled = true;
    elements.workflowNameInput.value = "";
    elements.workflowDescriptionInput.value = "";
    elements.workflowParallelismInput.value = "1";
    elements.autoRunCheckbox.checked = !!state.settings.autoRunOnStartup;
    elements.minimizeToTrayCheckbox.checked = state.settings.minimizeToTray !== false;
    elements.startHiddenCheckbox.checked = state.settings.startHiddenOnLaunch !== false;
    elements.startHiddenCheckbox.disabled = !startupStatus.enabled;
    elements.autoRunCheckbox.disabled = !startupStatus.enabled;
    elements.startupStatusText.textContent = startupStatusMessage();
    elements.enableStartupBtn.disabled = startupStatus.enabled;
    elements.disableStartupBtn.disabled = !startupStatus.enabled;
    elements.openHostPageBtn.disabled = !repoUrl;
    elements.openGithubProfileBtn.disabled = !profileUrl;
    elements.openDonationPageBtn.disabled = !donateUrl;
    return;
  }

  const options = state.workflows.map((workflow) => `<option value="${workflow.id}">${escapeHtml(workflow.name)}</option>`).join("");
  elements.workflowSelect.innerHTML = options;
  elements.defaultWorkflowSelect.innerHTML = options;
  elements.workflowSelect.disabled = false;
  elements.defaultWorkflowSelect.disabled = false;
  elements.cloneWorkflowBtn.disabled = false;
  elements.deleteWorkflowBtn.disabled = false;
  elements.newStepBtn.disabled = false;
  elements.deleteStepBtn.disabled = !currentStep();
  elements.workflowSelect.value = selectedWorkflowId;
  elements.defaultWorkflowSelect.value = state.settings.defaultWorkflowId || selectedWorkflowId;
  elements.autoRunCheckbox.checked = !!state.settings.autoRunOnStartup;
  elements.minimizeToTrayCheckbox.checked = state.settings.minimizeToTray !== false;
  elements.startHiddenCheckbox.checked = state.settings.startHiddenOnLaunch !== false;
  elements.startHiddenCheckbox.disabled = !startupStatus.enabled;
  elements.autoRunCheckbox.disabled = !startupStatus.enabled;
  elements.startupStatusText.textContent = startupStatusMessage();
  elements.enableStartupBtn.disabled = startupStatus.enabled;
  elements.disableStartupBtn.disabled = !startupStatus.enabled;
  elements.openHostPageBtn.disabled = !repoUrl;
  elements.openGithubProfileBtn.disabled = !profileUrl;
  elements.openDonationPageBtn.disabled = !donateUrl;

  const workflow = currentWorkflow();
  elements.workflowNameInput.value = workflow?.name || "";
  elements.workflowDescriptionInput.value = workflow?.description || "";
  elements.workflowParallelismInput.value = String(workflow?.maxParallelism || 1);
}

function renderTemplatePicker() {
  const selectedId = elements.templateSelect.value;
  elements.templateSelect.innerHTML = STARTER_TEMPLATES
    .map((template) => `<option value="${template.id}">${escapeHtml(template.name)}</option>`)
    .join("");

  const selectedTemplate = STARTER_TEMPLATES.find((template) => template.id === selectedId) || STARTER_TEMPLATES[0];
  if (selectedTemplate) {
    elements.templateSelect.value = selectedTemplate.id;
    elements.templateDescription.textContent = selectedTemplate.description;
  }
}

function renderStepSelects() {
  const workflow = currentWorkflow();
  const stepOptions = workflow?.steps?.length
    ? [
        '<option value="">No action selected</option>',
        ...workflow.steps.map((step) => `<option value="${step.id}">${escapeHtml(step.label)}</option>`)
      ].join("")
    : '<option value="">No actions yet</option>';

  elements.stepSelect.innerHTML = stepOptions;
  elements.stepSelect.disabled = !workflow?.steps?.length;
  if (selectedStepId && workflow?.steps?.some((step) => step.id === selectedStepId)) {
    elements.stepSelect.value = selectedStepId;
  } else {
    elements.stepSelect.value = "";
  }

  const dependencySources = selectedStepId ? workflow?.steps?.filter((step) => step.id !== selectedStepId) || [] : [];
  elements.dependencySourceSelect.innerHTML = dependencySources.length
    ? dependencySources.map((step) => `<option value="${step.id}">${escapeHtml(step.label)}</option>`).join("")
    : '<option value="">Pick another action first</option>';
  elements.dependencySourceSelect.disabled = !selectedStepId;
  elements.addDependencyBtn.disabled = !selectedStepId;

  elements.dependencyEventSelect.innerHTML = catalog.edgeEvents
    .map((event) => `<option value="${event.value}">${escapeHtml(event.label)}</option>`)
    .join("");

  elements.stepOnFailureSelect.innerHTML = catalog.failurePolicies
    .map((policy) => `<option value="${policy.value}">${escapeHtml(policy.label)}</option>`)
    .join("");

  elements.connectionEventSelect.innerHTML = catalog.edgeEvents
    .map((event) => `<option value="${event.value}">${escapeHtml(event.label)}</option>`)
    .join("");
}

function renderConnectionEditor() {
  const edge = currentEdge();
  if (currentEditorMode() !== "edge" || !edge) {
    elements.connectionEditor.hidden = true;
    elements.connectionEditor.style.display = "none";
    elements.connectionSourceLabel.textContent = "";
    elements.connectionTargetLabel.textContent = "";
    return;
  }

  const workflow = currentWorkflow();
  const source = workflow?.steps.find((step) => step.id === edge.from);
  const target = workflow?.steps.find((step) => step.id === edge.to);
  elements.connectionSourceLabel.textContent = source?.label || edge.from;
  elements.connectionTargetLabel.textContent = target?.label || edge.to;
  elements.connectionEventSelect.value = edge.event;
  elements.connectionEditor.hidden = false;
  elements.connectionEditor.style.display = "grid";
}

function renderStepEditor() {
  const mode = currentEditorMode();
  const step = currentStep();
  renderConnectionEditor();

  if (mode === "edge") {
    elements.editorTitle.textContent = "Selected Dependency";
    elements.editorSubtitle.textContent = "This arrow decides when the next action is allowed to run.";
    elements.stepSelectWrap.hidden = true;
    elements.stepEditorEmpty.style.display = "none";
    elements.stepEditorBody.style.display = "none";
    elements.deleteStepRow.hidden = true;
    elements.deleteStepRow.style.display = "none";
    elements.deleteStepBtn.disabled = true;
    return;
  }

  if (!step) {
    elements.editorTitle.textContent = linkDraft.sourceStepId ? "Create Dependency" : "Selected Action";
    elements.editorSubtitle.textContent = linkDraft.sourceStepId
      ? "Click a connector on another action to finish this dependency arrow."
      : "Click an action to edit it, or click a dependency arrow to edit that connection.";
    elements.stepSelectWrap.hidden = true;
    elements.stepEditorEmpty.textContent = linkDraft.sourceStepId
      ? "Connection in progress. Pick another action connector to create the arrow, or press Escape to cancel."
      : "Click an action to edit its settings. Click a dependency arrow to edit what that connection waits for.";
    elements.stepEditorEmpty.style.display = "block";
    elements.stepEditorBody.style.display = "none";
    elements.deleteStepRow.hidden = true;
    elements.deleteStepRow.style.display = "none";
    elements.deleteStepBtn.disabled = true;
    return;
  }

  elements.editorTitle.textContent = "Selected Action";
  elements.editorSubtitle.textContent = "This panel only shows settings for the selected action. Click an arrow to edit the dependency instead.";
  elements.stepSelectWrap.hidden = false;
  elements.stepEditorEmpty.style.display = "none";
  elements.stepEditorBody.style.display = "flex";
  elements.deleteStepRow.hidden = false;
  elements.deleteStepRow.style.display = "flex";
  elements.deleteStepBtn.disabled = false;
  elements.stepLabelInput.value = step.label || "";

  elements.stepActionSelect.innerHTML = catalog.actions
    .map((action) => `<option value="${action.type}">${escapeHtml(action.label)}</option>`)
    .join("");
  elements.stepActionSelect.value = step.actionType;

  elements.stepGateSelect.innerHTML = catalog.gateModes
    .map((mode) => `<option value="${mode.value}">${escapeHtml(mode.label)}</option>`)
    .join("");
  elements.stepGateSelect.value = step.gate || "all";
  step.policy = normalizeStepPolicy(step.policy);
  elements.stepTimeoutInput.value = String(step.policy.timeoutSeconds);
  elements.stepRetryCountInput.value = String(step.policy.retryCount);
  elements.stepRetryDelayInput.value = String(step.policy.retryDelayMilliseconds);
  elements.stepOnFailureSelect.value = step.policy.onFailure;

  renderActionFields();
  renderDependencyList();
}

function renderActionFields() {
  const step = currentStep();
  const definition = actionDefinition(step?.actionType);
  if (!step || !definition) {
    elements.actionFields.innerHTML = "";
    elements.actionExample.textContent = "";
    return;
  }

  step.action = normalizeActionConfig(step.actionType, step.action);
  const errors = validateActionConfig(step.actionType, step.action);
  elements.actionExample.textContent = actionExampleText(step.actionType);

  elements.actionFields.innerHTML = definition.fields
    .map((field) => {
      const value = step.action[field.key];
      const error = errors[field.key];
      const errorLine = error ? `<div class="helper-text" style="color: var(--danger);">${escapeHtml(error)}</div>` : "";

      if (field.type === "checkbox") {
        return `
          <label class="checkbox-row">
            <input type="checkbox" data-action-key="${field.key}" data-action-type="checkbox" ${value ? "checked" : ""} />
            <span>${escapeHtml(field.label)}</span>
          </label>
          ${errorLine}
        `;
      }

      const placeholder = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : "";
      const min = field.min != null ? ` min="${field.min}"` : "";
      const stepAttr = field.step != null ? ` step="${field.step}"` : "";

      if (field.type === "textarea") {
        return `
          <label class="field">
            <span>${escapeHtml(field.label)}</span>
            <textarea data-action-key="${field.key}" data-action-type="textarea"${placeholder}>${escapeHtml(value)}</textarea>
            ${errorLine}
          </label>
        `;
      }

      return `
        <label class="field">
          <span>${escapeHtml(field.label)}</span>
          <input data-action-key="${field.key}" data-action-type="${field.type}" type="${field.type}" value="${escapeHtml(value)}"${placeholder}${min}${stepAttr} />
          ${errorLine}
        </label>
      `;
    })
    .join("");

  if (Object.keys(errors).length > 0) {
    elements.stepConfigStatus.className = "form-status error";
    elements.stepConfigStatus.textContent = "This step has invalid fields. Fix them before saving or running the workflow.";
  } else {
    elements.stepConfigStatus.className = "form-status ok";
    elements.stepConfigStatus.textContent = definition.description;
  }
}

function renderDependencyList() {
  const step = currentStep();
  if (!step) {
    elements.dependencyList.innerHTML = "";
    return;
  }

  const edges = incomingEdges(step.id);
  const duplicatePairs = edgePairCounts(currentWorkflow()?.edges || []);
  if (edges.length === 0) {
    elements.dependencyList.innerHTML = '<div class="editor-empty">This step has no incoming dependencies. It can run as soon as the workflow starts.</div>';
    return;
  }

  elements.dependencyList.innerHTML = edges
    .map((edge) => {
      const source = currentWorkflow().steps.find((item) => item.id === edge.from);
      const duplicateClass = isDuplicateEdgePair(edge, duplicatePairs) ? "duplicate" : "";
      return `
        <div class="dependency-item ${edge.id === selectedEdgeId ? "selected" : ""} ${duplicateClass}" data-edge-id="${edge.id}">
          <div>
            <strong>${escapeHtml(source?.label || edge.from)}</strong>
            <span>Runs when source step event is <strong>${escapeHtml(edgeEventLabel(edge.event))}</strong></span>
            ${duplicateClass ? `<span class="dependency-warning">${escapeHtml(duplicateDependencyWarning())}</span>` : ""}
          </div>
          <div class="button-row">
            <select data-edge-id="${edge.id}" data-role="edge-event">
              ${catalog.edgeEvents
                .map((event) => `<option value="${event.value}" ${event.value === edge.event ? "selected" : ""}>${escapeHtml(event.label)}</option>`)
                .join("")}
            </select>
            <button data-edge-remove-id="${edge.id}" type="button">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function computeLevels(workflow) {
  const indegree = new Map();
  const outgoing = new Map();
  const level = new Map();

  for (const step of workflow.steps) {
    indegree.set(step.id, 0);
    outgoing.set(step.id, []);
    level.set(step.id, 0);
  }

  for (const edge of workflow.edges) {
    if (!outgoing.has(edge.from) || !indegree.has(edge.to)) {
      continue;
    }

    outgoing.get(edge.from).push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  }

  const queue = [];
  for (const step of workflow.steps) {
    if (indegree.get(step.id) === 0) {
      queue.push(step.id);
    }
  }

  const ordered = [];
  while (queue.length > 0) {
    const next = queue.shift();
    ordered.push(next);
    for (const target of outgoing.get(next)) {
      level.set(target, Math.max(level.get(target), level.get(next) + 1));
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) {
        queue.push(target);
      }
    }
  }

  for (const step of workflow.steps) {
    if (!ordered.includes(step.id)) {
      ordered.push(step.id);
    }
  }

  return { level, ordered };
}

function computeAutoLayout(workflow) {
  const { level, ordered } = computeLevels(workflow);
  const byLevel = new Map();
  const positions = new Map();

  ordered.forEach((stepId) => {
    const lv = level.get(stepId) || 0;
    if (!byLevel.has(lv)) {
      byLevel.set(lv, []);
    }
    byLevel.get(lv).push(stepId);
  });

  Array.from(byLevel.keys())
    .sort((left, right) => left - right)
    .forEach((lv) => {
      const ids = byLevel.get(lv);
      ids.forEach((stepId, index) => {
        positions.set(stepId, {
          x: (index - (ids.length - 1) / 2) * 292,
          y: lv * 208
        });
      });
    });

  return positions;
}

function graphNodeDimensions() {
  return {
    width: 256,
    height: 124
  };
}

function graphStatusClass(status) {
  if (status === "running") {
    return "running";
  }
  if (status === "success") {
    return "success";
  }
  if (status === "failed" || status === "cancelled") {
    return "failed";
  }
  if (status === "blocked") {
    return "blocked";
  }
  return "idle";
}

function graphEventPill(edgeId, label, x, y, isInvalid = false) {
  const width = Math.max(86, label.length * 7.2 + 18);
  const left = x - width / 2;
  return `
    <g class="graph-edge-pill ${edgeId === selectedEdgeId ? "selected" : ""} ${isInvalid ? "duplicate" : ""}" data-edge-id="${edgeId}" transform="translate(${left}, ${y - 14})">
      <rect width="${width}" height="28" rx="14" ry="14"></rect>
      <text x="${width / 2}" y="18" text-anchor="middle">${escapeHtml(label)}</text>
    </g>
  `;
}

function connectorPosition(node, side, nodeWidth, nodeHeight) {
  if (side === "top") {
    return { x: node.left + nodeWidth / 2, y: node.top };
  }
  if (side === "right") {
    return { x: node.left + nodeWidth, y: node.top + nodeHeight / 2 };
  }
  if (side === "bottom") {
    return { x: node.left + nodeWidth / 2, y: node.top + nodeHeight };
  }
  return { x: node.left, y: node.top + nodeHeight / 2 };
}

function edgeControlPoint(point, side, fallbackDirection) {
  const horizontalOffset = 78;
  const verticalOffset = 72;

  if (side === "top") {
    return { x: point.x, y: point.y - verticalOffset };
  }
  if (side === "right") {
    return { x: point.x + horizontalOffset, y: point.y };
  }
  if (side === "bottom") {
    return { x: point.x, y: point.y + verticalOffset };
  }
  if (side === "left") {
    return { x: point.x - horizontalOffset, y: point.y };
  }

  return fallbackDirection === "target"
    ? { x: point.x, y: point.y - verticalOffset }
    : { x: point.x, y: point.y + verticalOffset };
}

function edgePathBetweenPoints(sourcePoint, targetPoint, sourceSide, targetSide) {
  const sourceControl = edgeControlPoint(sourcePoint, sourceSide, "source");
  const targetControl = edgeControlPoint(targetPoint, targetSide, "target");
  return `M ${sourcePoint.x} ${sourcePoint.y} C ${sourceControl.x} ${sourceControl.y}, ${targetControl.x} ${targetControl.y}, ${targetPoint.x} ${targetPoint.y}`;
}

function buildConnectorMarkup(stepId) {
  return ["top", "right", "bottom", "left"]
    .map((side) => `
      <button
        class="graph-connector ${linkDraft.sourceStepId === stepId && linkDraft.sourceHandle === side ? "active" : ""}"
        type="button"
        data-connector-step-id="${stepId}"
        data-connector-side="${side}"
        aria-label="Connect ${escapeHtml(stepId)} from ${side}"
      ></button>
    `)
    .join("");
}

function buildGraphScene(workflow) {
  const autoLayout = computeAutoLayout(workflow);
  const { width: nodeWidth, height: nodeHeight } = graphNodeDimensions();
  const paddingX = 120;
  const paddingY = 72;
  const nodes = workflow.steps.map((step) => {
    const basePosition = step.position || autoLayout.get(step.id) || { x: 0, y: 0 };
    return {
      step,
      centerX: basePosition.x,
      centerY: basePosition.y
    };
  });

  const minX = Math.min(...nodes.map((node) => node.centerX - nodeWidth / 2));
  const maxX = Math.max(...nodes.map((node) => node.centerX + nodeWidth / 2));
  const minY = Math.min(...nodes.map((node) => node.centerY - nodeHeight / 2));
  const maxY = Math.max(...nodes.map((node) => node.centerY + nodeHeight / 2));

  const positioned = nodes.map((node) => ({
    ...node,
    left: node.centerX - minX + paddingX - nodeWidth / 2,
    top: node.centerY - minY + paddingY - nodeHeight / 2
  }));

  const nodeMap = new Map(positioned.map((node) => [node.step.id, node]));
  const width = Math.max(640, Math.ceil(maxX - minX + paddingX * 2));
  const height = Math.max(320, Math.ceil(maxY - minY + paddingY * 2));
  const duplicatePairs = edgePairCounts(workflow.edges);

  const edgeMarkup = workflow.edges
    .map((edge) => {
      const from = nodeMap.get(edge.from);
      const to = nodeMap.get(edge.to);
      if (!from || !to) {
        return "";
      }

      const sourceSide = edge.sourceHandle || "bottom";
      const targetSide = edge.targetHandle || "top";
      const sourcePoint = connectorPosition(from, sourceSide, nodeWidth, nodeHeight);
      const targetPoint = connectorPosition(to, targetSide, nodeWidth, nodeHeight);
      const labelX = sourcePoint.x + (targetPoint.x - sourcePoint.x) / 2;
      const labelY = sourcePoint.y + (targetPoint.y - sourcePoint.y) / 2;
      const path = edgePathBetweenPoints(sourcePoint, targetPoint, sourceSide, targetSide);
      const isInvalid = isDuplicateEdgePair(edge, duplicatePairs);

      return `
        <path class="graph-edge-path ${edge.id === selectedEdgeId ? "selected" : ""} ${isInvalid ? "duplicate" : ""}" d="${path}" marker-end="url(#graph-arrow)"></path>
        ${graphEventPill(edge.id, edgeEventLabel(edge.event), labelX, labelY, isInvalid)}
      `;
    })
    .join("");

  const previewMarkup = (() => {
    if (!linkDraft.sourceStepId || !nodeMap.has(linkDraft.sourceStepId)) {
      return "";
    }

    const sourceNode = nodeMap.get(linkDraft.sourceStepId);
    const sourceSide = linkDraft.sourceHandle || "right";
    const sourcePoint = connectorPosition(sourceNode, sourceSide, nodeWidth, nodeHeight);
    const x2 = Number.isFinite(linkDraft.pointerSceneX) ? linkDraft.pointerSceneX : sourcePoint.x;
    const y2 = Number.isFinite(linkDraft.pointerSceneY) ? linkDraft.pointerSceneY : sourcePoint.y;
    const path = edgePathBetweenPoints(sourcePoint, { x: x2, y: y2 }, sourceSide, null);
    return `<path class="graph-edge-preview" d="${path}"></path>`;
  })();

  const nodeMarkup = positioned
    .map(({ step, left, top }) => {
      const status = runtime.stepStatus[step.id] || "idle";
      return `
        <div
          class="graph-node ${graphStatusClass(status)} ${step.id === selectedStepId && !selectedEdgeId ? "selected" : ""}"
          role="button"
          tabindex="0"
          data-step-id="${step.id}"
          style="left:${left}px; top:${top}px; width:${nodeWidth}px; height:${nodeHeight}px;"
        >
          ${buildConnectorMarkup(step.id)}
          <strong>${escapeHtml(step.label)}</strong>
          <span>${escapeHtml(actionLabel(step.actionType))}</span>
          <small>${escapeHtml(step.gate === "any" ? "Runs when any dependency matches" : "Runs when all dependencies match")}</small>
          <em>${escapeHtml(statusLabel(status))}</em>
        </div>
      `;
    })
    .join("");

  return {
    width,
    height,
    markup: `
      <div class="graph-inner" style="width:${Math.round(width * graphViewState.scale)}px; height:${Math.round(height * graphViewState.scale)}px;">
        <div class="graph-scene" style="width:${width}px; height:${height}px; transform:scale(${graphViewState.scale});">
          <svg class="graph-edges" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
            <defs>
              <marker id="graph-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z"></path>
              </marker>
            </defs>
            ${edgeMarkup}
            ${previewMarkup}
          </svg>
          ${nodeMarkup}
        </div>
      </div>
    `
  };
}

function renderGraph() {
  const workflow = currentWorkflow();
  if (!workflow) {
    graphMetrics = null;
    elements.graphCanvas.innerHTML = '<div class="editor-empty">Create a workflow to start mapping startup dependencies.</div>';
    return;
  }

  if (!workflow.steps.length) {
    graphMetrics = null;
    elements.graphCanvas.innerHTML = '<div class="editor-empty">Create a step to populate the workflow graph.</div>';
    return;
  }

  graphMetrics = buildGraphScene(workflow);
  elements.graphCanvas.innerHTML = graphMetrics.markup;
}

function renderRuntime() {
  if (runtime.running) {
    elements.runtimeChip.className = "status-chip running";
    elements.runtimeChip.textContent = "Running";
    elements.runWorkflowBtn.disabled = true;
    elements.stopWorkflowBtn.disabled = false;
    elements.validateWorkflowBtn.disabled = true;
    return;
  }

  elements.runWorkflowBtn.disabled = !currentWorkflow();
  elements.stopWorkflowBtn.disabled = true;
  elements.validateWorkflowBtn.disabled = !currentWorkflow();

  if (runtime.blocked || runtime.stoppedByFailure) {
    elements.runtimeChip.className = "status-chip blocked";
    elements.runtimeChip.textContent = "Stopped";
    return;
  }

  if (runtime.failed) {
    elements.runtimeChip.className = "status-chip failed";
    elements.runtimeChip.textContent = "Issues";
    return;
  }

  if (runtime.cancelled) {
    elements.runtimeChip.className = "status-chip blocked";
    elements.runtimeChip.textContent = "Cancelled";
    return;
  }

  elements.runtimeChip.className = "status-chip idle";
  elements.runtimeChip.textContent = "Idle";
}

function renderAll() {
  ensureSelections();
  renderWorkflowOptions();
  renderTemplatePicker();
  renderStepSelects();
  renderStepEditor();
  renderGraph();
  renderRuntime();
  if (!elements.tutorialOverlay.hidden) {
    renderTutorialStep();
  }
}

function createWorkflow(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) {
    return;
  }

  const workflowId = buildId("workflow", trimmed);
  state.workflows.push({
    id: workflowId,
    name: trimmed,
    description: "",
    maxParallelism: 1,
    steps: [],
    edges: []
  });
  selectedWorkflowId = workflowId;
  selectedStepId = null;
  selectedEdgeId = null;
  graphViewState.scale = 1;
  if (!state.settings.defaultWorkflowId) {
    state.settings.defaultWorkflowId = workflowId;
  }
  setValidationNotice("neutral", "Workflow created. Save when you are ready.");
  renderAll();
}

function cloneWorkflow() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  const next = clone(workflow);
  next.id = buildId("workflow", `${workflow.name}-copy`);
  next.name = `${workflow.name} copy`;
  next.steps = workflow.steps.map((step) => ({
    ...clone(step),
    id: buildId("step", step.label)
  }));

  const stepIdMap = new Map();
  workflow.steps.forEach((step, index) => {
    stepIdMap.set(step.id, next.steps[index].id);
  });
  next.edges = workflow.edges.map((edge) => ({
    ...clone(edge),
    id: buildId("edge", `${edge.from}-${edge.to}`),
    from: stepIdMap.get(edge.from),
    to: stepIdMap.get(edge.to)
  }));

  state.workflows.push(next);
  selectedWorkflowId = next.id;
  selectedStepId = next.steps[0]?.id || null;
  selectedEdgeId = null;
  graphViewState.scale = 1;
  setValidationNotice("neutral", "Workflow cloned. Save when you are ready.");
  renderAll();
}

function deleteWorkflow() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  if (!window.confirm(`Delete workflow "${workflow.name}"?`)) {
    return;
  }

  state.workflows = state.workflows.filter((item) => item.id !== workflow.id);
  if (state.settings.defaultWorkflowId === workflow.id) {
    state.settings.defaultWorkflowId = state.workflows[0]?.id || "";
  }
  selectedWorkflowId = state.workflows[0]?.id || null;
  selectedStepId = null;
  selectedEdgeId = null;
  setValidationNotice("neutral", "Workflow deleted. Save to persist the change.");
  renderAll();
}

function createStep(label, actionType) {
  const workflow = currentWorkflow();
  const trimmed = String(label || "").trim();
  if (!workflow || !trimmed) {
    return;
  }

  const stepId = buildId("step", trimmed);
  workflow.steps.push({
    id: stepId,
    label: trimmed,
    actionType,
    action: getDefaultActionConfig(actionType),
    gate: "all",
    policy: getDefaultStepPolicy()
  });
  selectedStepId = stepId;
  selectedEdgeId = null;
  setValidationNotice("neutral", "Step created. Configure it and save when ready.");
  renderAll();
}

function openNewActionDialog() {
  if (!currentWorkflow()) {
    window.alert("Create or select a workflow first.");
    return;
  }

  elements.stepModalLabel.value = "New action";
  elements.stepModalAction.value = catalog.actions[0]?.type || "";
  showDialog(elements.stepModal);
}

function loadTemplate() {
  const template = STARTER_TEMPLATES.find((item) => item.id === elements.templateSelect.value);
  if (!template) {
    return;
  }

  const built = template.build();
  const workflowId = buildId("workflow", built.name);
  const steps = built.steps.map((step) => ({
    id: buildId("step", step.label),
    label: step.label,
    actionType: step.actionType,
    action: normalizeActionConfig(step.actionType, step.action),
    gate: step.gate || "all",
    policy: normalizeStepPolicy(step.policy)
  }));

  const workflow = {
    id: workflowId,
    name: built.name,
    description: built.description,
    maxParallelism: built.maxParallelism || 1,
    steps,
    edges: built.edges.map((edge) => ({
      id: buildId("edge", `${steps[edge.from].id}-${steps[edge.to].id}`),
      from: steps[edge.from].id,
      to: steps[edge.to].id,
      event: edge.event
    }))
  };

  state.workflows.push(workflow);
  selectedWorkflowId = workflow.id;
  selectedStepId = workflow.steps[0]?.id || null;
  selectedEdgeId = null;
  graphViewState.scale = 1;
  if (!state.settings.defaultWorkflowId) {
    state.settings.defaultWorkflowId = workflow.id;
  }
  setValidationNotice("neutral", `Loaded template "${template.name}". Save it when you are ready.`);
  renderAll();
  closeDialog(elements.templateModal);
}

function deleteStep() {
  const workflow = currentWorkflow();
  const step = currentStep();
  if (!workflow || !step) {
    return;
  }

  if (!window.confirm(`Delete step "${step.label}"?`)) {
    return;
  }

  workflow.steps = workflow.steps.filter((item) => item.id !== step.id);
  workflow.edges = workflow.edges.filter((edge) => edge.from !== step.id && edge.to !== step.id);
  selectedStepId = workflow.steps[0]?.id || null;
  selectedEdgeId = null;
  setValidationNotice("neutral", "Step deleted. Save to persist the change.");
  renderAll();
}

function deleteStepById(stepId) {
  selectedStepId = stepId;
  selectedEdgeId = null;
  deleteStep();
}

function updateWorkflowFields() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  workflow.name = elements.workflowNameInput.value.trim() || workflow.name;
  workflow.description = elements.workflowDescriptionInput.value;
  workflow.maxParallelism = Math.max(1, Number(elements.workflowParallelismInput.value || 1));
  renderWorkflowOptions();
}

function updateSettingsFields() {
  state.settings.defaultWorkflowId = elements.defaultWorkflowSelect.value || currentWorkflow()?.id || "";
  state.settings.autoRunOnStartup = elements.autoRunCheckbox.checked;
  state.settings.minimizeToTray = elements.minimizeToTrayCheckbox.checked;
  state.settings.startHiddenOnLaunch = elements.startHiddenCheckbox.checked;
  renderWorkflowOptions();
}

async function refreshStartupStatus() {
  startupStatus = await api.getStartupStatus();
  renderWorkflowOptions();
}

async function enableLaunchOnStartup() {
  try {
    await api.enableStartupTask();
    startupStatus = await api.getStartupStatus();
    setValidationNotice("ok", "Launch on startup enabled. BetterStartup will use a Windows logon task with highest privileges.");
    renderWorkflowOptions();
  } catch (error) {
    window.alert(error.message || String(error));
  }
}

async function disableLaunchOnStartup() {
  try {
    await api.disableStartupTask();
    startupStatus = await api.getStartupStatus();
    setValidationNotice("neutral", "Launch on startup disabled.");
    renderWorkflowOptions();
  } catch (error) {
    window.alert(error.message || String(error));
  }
}

function updateStepFromEditor() {
  const step = currentStep();
  if (!step) {
    return;
  }

  step.label = elements.stepLabelInput.value.trim() || step.label;
  step.gate = elements.stepGateSelect.value || "all";
  renderStepSelects();
  renderGraph();
}

function updateStepPolicy() {
  const step = currentStep();
  if (!step) {
    return;
  }

  step.policy = normalizeStepPolicy({
    timeoutSeconds: elements.stepTimeoutInput.value,
    retryCount: elements.stepRetryCountInput.value,
    retryDelayMilliseconds: elements.stepRetryDelayInput.value,
    onFailure: elements.stepOnFailureSelect.value
  });
}

function handleActionFieldInput(event) {
  const step = currentStep();
  if (!step) {
    return;
  }

  const key = event.target.getAttribute("data-action-key");
  const type = event.target.getAttribute("data-action-type");
  if (!key || !type) {
    return;
  }

  if (type === "checkbox") {
    step.action[key] = !!event.target.checked;
  } else if (type === "number") {
    step.action[key] = Number(event.target.value);
  } else {
    step.action[key] = event.target.value;
  }

  renderActionFields();
}

function addDependency() {
  const workflow = currentWorkflow();
  const step = currentStep();
  if (!workflow || !step) {
    return;
  }

  const sourceId = elements.dependencySourceSelect.value;
  const eventName = elements.dependencyEventSelect.value;
  if (!sourceId) {
    window.alert("Create or select another action first, then choose it as the source.");
    return;
  }

  const createsDuplicatePair = workflow.edges.some((edge) => edge.from === sourceId && edge.to === step.id);

  workflow.edges.push({
    id: buildId("edge", `${sourceId}-${step.id}`),
    from: sourceId,
    to: step.id,
    event: eventName,
    sourceHandle: "bottom",
    targetHandle: "top"
  });

  selectedEdgeId = workflow.edges[workflow.edges.length - 1].id;
  selectedStepId = null;
  setValidationNotice(
    createsDuplicatePair ? "error" : "neutral",
    createsDuplicatePair ? duplicateDependencyWarning() : "Dependency added. Validate the workflow before running it."
  );
  renderAll();
}

function wouldCreateCycle(workflow, sourceId, targetId) {
  const visited = new Set();
  const stack = [targetId];

  while (stack.length > 0) {
    const next = stack.pop();
    if (next === sourceId) {
      return true;
    }
    if (visited.has(next)) {
      continue;
    }
    visited.add(next);
    workflow.edges
      .filter((edge) => edge.from === next)
      .forEach((edge) => stack.push(edge.to));
  }

  return false;
}

function addDependencyFromGraph(sourceId, targetId, eventName, sourceHandle = "bottom", targetHandle = "top") {
  const workflow = currentWorkflow();
  if (!workflow || !sourceId || !targetId) {
    return;
  }

  if (sourceId === targetId) {
    window.alert("An action cannot depend on itself.");
    return;
  }

  const normalizedEvent = eventName || elements.dependencyEventSelect.value || "completed";
  const createsDuplicatePair = workflow.edges.some((edge) => edge.from === sourceId && edge.to === targetId);

  if (wouldCreateCycle(workflow, sourceId, targetId)) {
    window.alert("That dependency would create a loop. BetterStartup only allows directed acyclic graphs.");
    return;
  }

  workflow.edges.push({
    id: buildId("edge", `${sourceId}-${targetId}`),
    from: sourceId,
    to: targetId,
    event: normalizedEvent,
    sourceHandle,
    targetHandle
  });

  clearLinkDraft();
  selectedStepId = null;
  selectedEdgeId = workflow.edges[workflow.edges.length - 1].id;
  setValidationNotice(
    createsDuplicatePair ? "error" : "neutral",
    createsDuplicatePair ? duplicateDependencyWarning() : "Dependency created. Click the arrow to adjust what event it waits for."
  );
  renderAll();
}

function removeDependency(edgeId) {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  workflow.edges = workflow.edges.filter((edge) => edge.id !== edgeId);
  if (selectedEdgeId === edgeId) {
    selectedEdgeId = null;
  }
  setValidationNotice("neutral", "Dependency removed. Save to persist the change.");
  renderAll();
}

function updateDependencyEvent(edgeId, eventName) {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  const edge = workflow.edges.find((item) => item.id === edgeId);
  if (!edge) {
    return;
  }

  edge.event = eventName;
  setValidationNotice("neutral", "Dependency updated. Save when you are ready.");
  renderGraph();
  renderConnectionEditor();
  renderDependencyList();
}

function zoomGraph(multiplier) {
  if (!graphMetrics) {
    return;
  }

  graphViewState.scale = Math.max(0.65, Math.min(1.8, graphViewState.scale * multiplier));
  renderGraph();
}

function zoomGraphAt(multiplier, clientX, clientY) {
  if (!graphMetrics) {
    return;
  }

  const canvasRect = elements.graphCanvas.getBoundingClientRect();
  const previousScale = graphViewState.scale;
  const nextScale = Math.max(0.65, Math.min(1.8, previousScale * multiplier));
  if (Math.abs(nextScale - previousScale) < 0.0001) {
    return;
  }

  const viewportX = Number.isFinite(clientX) ? clientX - canvasRect.left : canvasRect.width / 2;
  const viewportY = Number.isFinite(clientY) ? clientY - canvasRect.top : canvasRect.height / 2;
  const sceneX = (elements.graphCanvas.scrollLeft + viewportX) / previousScale;
  const sceneY = (elements.graphCanvas.scrollTop + viewportY) / previousScale;

  graphViewState.scale = nextScale;
  renderGraph();

  elements.graphCanvas.scrollLeft = Math.max(0, sceneX * nextScale - viewportX);
  elements.graphCanvas.scrollTop = Math.max(0, sceneY * nextScale - viewportY);
}

function fitGraph() {
  if (!graphMetrics) {
    return;
  }

  const canvasRect = elements.graphCanvas.getBoundingClientRect();
  const widthScale = (canvasRect.width - 24) / graphMetrics.width;
  const heightScale = (canvasRect.height - 24) / graphMetrics.height;
  graphViewState.scale = Math.max(0.65, Math.min(1.2, Math.min(widthScale, heightScale, 1)));
  renderGraph();
}

function clientToGraphScene(clientX, clientY) {
  const rect = elements.graphCanvas.getBoundingClientRect();
  return {
    x: (elements.graphCanvas.scrollLeft + (clientX - rect.left)) / graphViewState.scale,
    y: (elements.graphCanvas.scrollTop + (clientY - rect.top)) / graphViewState.scale
  };
}

function startLinkFromConnector(stepId, side, clientX, clientY) {
  const scenePoint = clientToGraphScene(clientX, clientY);
  linkDraft.sourceStepId = stepId;
  linkDraft.sourceHandle = side;
  linkDraft.pointerSceneX = scenePoint.x;
  linkDraft.pointerSceneY = scenePoint.y;
  selectedStepId = null;
  selectedEdgeId = null;
  setValidationNotice("neutral", "Connection started. Click a connector on another action to create the dependency arrow.");
  renderAll();
}

async function saveStateToDisk() {
  updateWorkflowFields();
  updateSettingsFields();
  state = await api.saveState(state);
  setValidationNotice("ok", "State saved to disk.");
  renderAll();
}

async function validateCurrentWorkflow() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  updateWorkflowFields();
  const result = await api.validateWorkflow(workflow);
  if (result.ok) {
    setValidationNotice("ok", "Workflow is valid. No dependency loops or missing fields were found.");
  } else {
    setValidationNotice("error", result.errors.join(" "));
  }
}

async function runCurrentWorkflow() {
  const workflow = currentWorkflow();
  if (!workflow) {
    return;
  }

  updateWorkflowFields();
  try {
    await api.runWorkflow(workflow);
  } catch (error) {
    window.alert(error.message || String(error));
  }
}

async function runSingleAction(stepId) {
  const workflow = currentWorkflow();
  const step = workflow?.steps.find((item) => item.id === stepId);
  if (!workflow || !step) {
    return;
  }

  const singleStepWorkflow = {
    id: `single-${workflow.id}-${step.id}`,
    name: `Run action: ${step.label}`,
    description: `Temporary single-action run from workflow "${workflow.name}".`,
    maxParallelism: 1,
    steps: [clone(step)],
    edges: []
  };

  try {
    setValidationNotice("neutral", `Running "${step.label}" by itself.`);
    await api.runWorkflow(singleStepWorkflow);
  } catch (error) {
    window.alert(error.message || String(error));
  }
}

function bindEvents() {
  elements.workflowSelect.addEventListener("change", () => {
    selectedWorkflowId = elements.workflowSelect.value || null;
    selectedStepId = null;
    selectedEdgeId = null;
    graphViewState.scale = 1;
    renderAll();
  });

  elements.workflowNameInput.addEventListener("input", updateWorkflowFields);
  elements.workflowDescriptionInput.addEventListener("input", updateWorkflowFields);
  elements.workflowParallelismInput.addEventListener("input", updateWorkflowFields);
  elements.defaultWorkflowSelect.addEventListener("change", updateSettingsFields);
  elements.autoRunCheckbox.addEventListener("change", updateSettingsFields);
  elements.minimizeToTrayCheckbox.addEventListener("change", updateSettingsFields);
  elements.startHiddenCheckbox.addEventListener("change", updateSettingsFields);
  elements.templateSelect.addEventListener("change", renderTemplatePicker);
  elements.loadTemplateBtn.addEventListener("click", loadTemplate);
  elements.openWorkflowsBtn.addEventListener("click", () => showDialog(elements.workflowManagerModal));
  elements.openTemplatesBtn.addEventListener("click", () => showDialog(elements.templateModal));
  elements.openSettingsBtn.addEventListener("click", async () => {
    await refreshStartupStatus();
    showDialog(elements.settingsModal);
  });
  elements.openLogBtn.addEventListener("click", () => showDialog(elements.logModal));
  elements.openHostPageBtn.addEventListener("click", async () => {
    if (state.settings.repoUrl) {
      await api.openUrl(state.settings.repoUrl);
    }
  });
  elements.openGithubProfileBtn.addEventListener("click", async () => {
    const url = githubProfileUrl(state.settings.repoUrl);
    if (url) {
      await api.openUrl(url);
    }
  });
  elements.openDonationPageBtn.addEventListener("click", async () => {
    const url = donationPageUrl(state.settings);
    if (url) {
      await api.openUrl(url);
    }
  });
  elements.workflowManagerClose.addEventListener("click", () => closeDialog(elements.workflowManagerModal));
  elements.settingsCloseBtn.addEventListener("click", () => closeDialog(elements.settingsModal));
  elements.enableStartupBtn.addEventListener("click", enableLaunchOnStartup);
  elements.disableStartupBtn.addEventListener("click", disableLaunchOnStartup);
  elements.templateModalClose.addEventListener("click", () => closeDialog(elements.templateModal));
  elements.logModalClose.addEventListener("click", () => closeDialog(elements.logModal));
  elements.supportNoBtn.addEventListener("click", async () => {
    await closeSupportPrompt();
  });
  elements.supportYesBtn.addEventListener("click", async () => {
    const url = donationPageUrl(state.settings);
    await saveSupportPromptPreference();
    closeDialog(elements.supportModal);
    if (url) {
      await api.openUrl(url);
    }
  });

  elements.newWorkflowBtn.addEventListener("click", () => {
    elements.workflowModalName.value = "Startup workflow";
    showDialog(elements.workflowModal);
  });
  elements.cloneWorkflowBtn.addEventListener("click", cloneWorkflow);
  elements.deleteWorkflowBtn.addEventListener("click", deleteWorkflow);

  elements.newStepBtn.addEventListener("click", openNewActionDialog);
  elements.deleteStepBtn.addEventListener("click", deleteStep);

  elements.workflowModalCancel.addEventListener("click", () => closeDialog(elements.workflowModal));
  elements.workflowModalCreate.addEventListener("click", () => {
    const name = elements.workflowModalName.value.trim();
    if (!name) {
      window.alert("Workflow name is required.");
      return;
    }
    createWorkflow(name);
    closeDialog(elements.workflowModal);
  });

  elements.stepModalCancel.addEventListener("click", () => closeDialog(elements.stepModal));
  elements.stepModalCreate.addEventListener("click", () => {
    const label = elements.stepModalLabel.value.trim();
    const actionType = elements.stepModalAction.value;
    if (!label) {
      window.alert("Step label is required.");
      return;
    }
    createStep(label, actionType);
    closeDialog(elements.stepModal);
  });

  elements.stepSelect.addEventListener("change", () => {
    selectedStepId = elements.stepSelect.value || null;
    selectedEdgeId = null;
    renderAll();
  });

  elements.stepLabelInput.addEventListener("input", updateStepFromEditor);

  elements.stepActionSelect.addEventListener("change", () => {
    const step = currentStep();
    if (!step) {
      return;
    }

    step.actionType = elements.stepActionSelect.value;
    step.action = getDefaultActionConfig(step.actionType);
    renderAll();
  });

  elements.stepGateSelect.addEventListener("change", updateStepFromEditor);
  elements.stepTimeoutInput.addEventListener("input", updateStepPolicy);
  elements.stepRetryCountInput.addEventListener("input", updateStepPolicy);
  elements.stepRetryDelayInput.addEventListener("input", updateStepPolicy);
  elements.stepOnFailureSelect.addEventListener("change", updateStepPolicy);
  elements.actionFields.addEventListener("input", handleActionFieldInput);
  elements.actionFields.addEventListener("change", handleActionFieldInput);

  elements.addDependencyBtn.addEventListener("click", addDependency);

  elements.dependencyList.addEventListener("click", (event) => {
    const item = event.target.closest("[data-edge-id]");
    if (item && !event.target.closest("[data-edge-remove-id]")) {
      selectedEdgeId = item.getAttribute("data-edge-id");
      selectedStepId = null;
      clearLinkDraft();
      renderAll();
      return;
    }

    const edgeId = event.target.getAttribute("data-edge-remove-id");
    if (!edgeId) {
      return;
    }
    removeDependency(edgeId);
  });

  elements.dependencyList.addEventListener("change", (event) => {
    const edgeId = event.target.getAttribute("data-edge-id");
    if (!edgeId) {
      return;
    }
    updateDependencyEvent(edgeId, event.target.value);
  });

  elements.graphCanvas.addEventListener("click", (event) => {
    if (graphPanState.suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    hideGraphContextMenu();
    const connector = event.target.closest("[data-connector-step-id]");
    if (connector) {
      const stepId = connector.getAttribute("data-connector-step-id");
      const side = connector.getAttribute("data-connector-side") || "right";
      if (!linkDraft.sourceStepId) {
        startLinkFromConnector(stepId, side, event.clientX, event.clientY);
        return;
      }

      if (linkDraft.sourceStepId === stepId) {
        clearLinkDraft();
        setValidationNotice("neutral", "Connection cancelled.");
        renderGraph();
        return;
      }

      addDependencyFromGraph(
        linkDraft.sourceStepId,
        stepId,
        elements.dependencyEventSelect.value || "completed",
        linkDraft.sourceHandle || "bottom",
        side || "top"
      );
      return;
    }

    const edgeTarget = event.target.closest("[data-edge-id]");
    if (edgeTarget) {
      selectedEdgeId = edgeTarget.getAttribute("data-edge-id");
      selectedStepId = null;
      clearLinkDraft();
      renderAll();
      return;
    }

    const node = event.target.closest("[data-step-id]");
    if (!node) {
      clearLinkDraft();
      selectedStepId = null;
      selectedEdgeId = null;
      renderAll();
      return;
    }

    clearLinkDraft();
    selectedStepId = node.getAttribute("data-step-id");
    selectedEdgeId = null;
    renderAll();
  });
  elements.graphCanvas.addEventListener("mousemove", (event) => {
    if (!linkDraft.sourceStepId || graphPanState.active) {
      return;
    }

    const scenePoint = clientToGraphScene(event.clientX, event.clientY);
    linkDraft.pointerSceneX = scenePoint.x;
    linkDraft.pointerSceneY = scenePoint.y;
    renderGraph();
  });
  elements.graphCanvas.addEventListener("contextmenu", (event) => {
    const node = event.target.closest("[data-step-id]");
    event.preventDefault();
    if (node) {
      selectedStepId = node.getAttribute("data-step-id");
      selectedEdgeId = null;
      clearLinkDraft();
      renderAll();
      showGraphContextMenu(selectedStepId, event.clientX, event.clientY);
      return;
    }

    clearLinkDraft();
    renderAll();
    showGraphContextMenu(null, event.clientX, event.clientY);
  });
  elements.graphCanvas.addEventListener("auxclick", (event) => {
    if (event.button === 1) {
      event.preventDefault();
    }
  });
  elements.graphCanvas.addEventListener("dragstart", (event) => {
    if (graphPanState.active) {
      event.preventDefault();
    }
  });
  elements.graphCanvas.addEventListener("wheel", () => {
    hideGraphContextMenu();
  }, { passive: true });
  elements.graphContextRunBtn.addEventListener("click", async () => {
    const stepId = graphContextStepId;
    hideGraphContextMenu();
    if (!stepId) {
      return;
    }
    await runSingleAction(stepId);
  });
  elements.graphContextDeleteBtn.addEventListener("click", () => {
    const stepId = graphContextStepId;
    hideGraphContextMenu();
    if (!stepId) {
      return;
    }
    deleteStepById(stepId);
  });
  elements.graphContextNewBtn.addEventListener("click", () => {
    hideGraphContextMenu();
    openNewActionDialog();
  });

  elements.connectionEventSelect.addEventListener("change", () => {
    const edge = currentEdge();
    if (!edge) {
      return;
    }
    updateDependencyEvent(edge.id, elements.connectionEventSelect.value);
  });
  elements.deleteConnectionBtn.addEventListener("click", () => {
    const edge = currentEdge();
    if (!edge) {
      return;
    }
    removeDependency(edge.id);
  });

  elements.graphSelectToolBtn.addEventListener("click", () => {
    graphTool = "select";
    renderGraphTools();
  });
  elements.graphHandToolBtn.addEventListener("click", () => {
    graphTool = "pan";
    renderGraphTools();
  });
  elements.zoomInBtn.addEventListener("click", () => zoomGraph(1.14));
  elements.zoomOutBtn.addEventListener("click", () => zoomGraph(1 / 1.14));
  elements.fitGraphBtn.addEventListener("click", fitGraph);

  elements.saveStateBtn.addEventListener("click", saveStateToDisk);
  elements.validateWorkflowBtn.addEventListener("click", validateCurrentWorkflow);
  elements.runWorkflowBtn.addEventListener("click", runCurrentWorkflow);
  elements.stopWorkflowBtn.addEventListener("click", async () => {
    await api.stopWorkflow();
  });
  elements.themeLightBtn.addEventListener("click", () => applyTheme("light"));
  elements.themeDarkBtn.addEventListener("click", () => applyTheme("dark"));
  elements.helpBtn.addEventListener("click", () => startTutorial(0));
  elements.tutorialSkipBtn.addEventListener("click", stopTutorial);
  elements.tutorialBackBtn.addEventListener("click", () => {
    tutorial.index = Math.max(0, tutorial.index - 1);
    renderTutorialStep();
  });
  elements.tutorialNextBtn.addEventListener("click", () => {
    if (tutorial.index >= tutorial.steps.length - 1) {
      stopTutorial();
      return;
    }
    tutorial.index += 1;
    renderTutorialStep();
  });
  window.addEventListener("resize", () => {
    hideGraphContextMenu();
    applyEditorWidth(detectPreferredEditorWidth());
    if (!elements.tutorialOverlay.hidden) {
      renderTutorialStep();
    }
  });
  window.addEventListener("mousedown", (event) => {
    if (!shouldStartGraphPan(event)) {
      return;
    }

    event.preventDefault();
    hideGraphContextMenu();
    startGraphPan(event);
  }, true);
  window.addEventListener("mousemove", (event) => {
    if (!graphPanState.active) {
      return;
    }

    event.preventDefault();
    updateGraphPan(event);
  }, true);
  window.addEventListener("mouseup", (event) => {
    if (graphPanState.active && event.button === 1) {
      event.preventDefault();
    }
    stopGraphPan();
  }, true);
  window.addEventListener("pointermove", (event) => {
    if (!paneResizeState.active) {
      return;
    }

    applyEditorWidth(paneResizeState.startWidth - (event.clientX - paneResizeState.startX));
  });
  window.addEventListener("pointerup", () => {
    paneResizeState.active = false;
    stopGraphPan();
    document.body.classList.remove("pane-resizing");
  });
  window.addEventListener("click", (event) => {
    if (!event.target.closest("#graph-context-menu")) {
      hideGraphContextMenu();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideGraphContextMenu();
      clearLinkDraft();
      paneResizeState.active = false;
      stopGraphPan();
      document.body.classList.remove("pane-resizing");
      renderAll();
    }
  });
  window.addEventListener("blur", stopGraphPan);
  elements.layoutResizer.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    paneResizeState.active = true;
    paneResizeState.startX = event.clientX;
    paneResizeState.startWidth = Number.parseInt(getComputedStyle(document.body).getPropertyValue("--editor-width"), 10) || 420;
    document.body.classList.add("pane-resizing");
  });
  elements.clearLogsBtn.addEventListener("click", () => {
    logs.length = 0;
    elements.logOutput.textContent = "";
  });
}

function subscribeRuntime() {
  api.onRunLog((line) => {
    appendLog(line);
  });

  api.onRunState((nextRuntime) => {
    runtime = {
      ...runtime,
      ...nextRuntime,
      stepStatus: nextRuntime.stepStatus || runtime.stepStatus || {},
      stepEvents: nextRuntime.stepEvents || runtime.stepEvents || {}
    };
    renderRuntime();
    renderGraph();
  });

  api.onStepState((stepEvent) => {
    runtime.stepStatus = {
      ...runtime.stepStatus,
      [stepEvent.stepId]: stepEvent.status
    };
    runtime.stepEvents = {
      ...runtime.stepEvents,
      [stepEvent.stepId]: stepEvent.events
    };
    renderRuntime();
    renderGraph();
  });
}

async function init() {
  catalog = await api.getCatalog();
  state = await api.getState();
  runtime = await api.getRuntimeStatus();
  startupStatus = await api.getStartupStatus();

  elements.stepModalAction.innerHTML = catalog.actions
    .map((action) => `<option value="${action.type}">${escapeHtml(action.label)}</option>`)
    .join("");

  bindEvents();
  applyTheme(detectPreferredTheme());
  applyEditorWidth(detectPreferredEditorWidth());
  subscribeRuntime();
  renderAll();

  if (!state.workflows.length) {
    showDialog(elements.workflowModal);
  }

  window.setTimeout(() => {
    openSupportPromptIfNeeded();
  }, 900);

  appendLog(`[${new Date().toISOString()}] Workflow manager ready`);
}

init();
