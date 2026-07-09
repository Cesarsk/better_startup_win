const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { getCatalogPayload } = require("../electron/workflow-catalog");

const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "renderer", "index.html");
const appPath = path.join(rootDir, "renderer", "app.js");

function waitTick(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createApiMock(initialState, initialRuntime, initialStartupStatus = { enabled: false, elevated: false }) {
  const callbacks = {
    runLog: [],
    runState: [],
    stepState: []
  };

  const calls = {
    openRepo: 0,
    openUrl: [],
    runWorkflow: [],
    stopWorkflow: 0,
    saveState: 0,
    validateWorkflow: [],
    installStartupTask: 0,
    getStartupStatus: 0,
    enableStartupTask: 0,
    disableStartupTask: 0
  };

  let state = JSON.parse(JSON.stringify(initialState));
  let runtime = JSON.parse(JSON.stringify(initialRuntime));
  let startupStatus = JSON.parse(JSON.stringify(initialStartupStatus));

  const api = {
    getCatalog: async () => getCatalogPayload(),
    getState: async () => JSON.parse(JSON.stringify(state)),
    saveState: async (nextState) => {
      calls.saveState += 1;
      state = JSON.parse(JSON.stringify(nextState));
      return JSON.parse(JSON.stringify(state));
    },
    runWorkflow: async (workflowOrId) => {
      calls.runWorkflow.push(workflowOrId);
      return { ok: true };
    },
    stopWorkflow: async () => {
      calls.stopWorkflow += 1;
      return { ok: true };
    },
    validateWorkflow: async (workflowOrId) => {
      calls.validateWorkflow.push(workflowOrId);
      return { ok: true, errors: [] };
    },
    openRepo: async () => {
      calls.openRepo += 1;
      return { ok: true };
    },
    openUrl: async (url) => {
      calls.openUrl.push(url);
      return { ok: true };
    },
    installStartupTask: async () => {
      calls.installStartupTask += 1;
      return { ok: true, taskName: "Better Startup Win" };
    },
    getStartupStatus: async () => {
      calls.getStartupStatus += 1;
      return JSON.parse(JSON.stringify(startupStatus));
    },
    enableStartupTask: async () => {
      calls.enableStartupTask += 1;
      startupStatus = { enabled: true, elevated: true };
      return { ok: true, status: JSON.parse(JSON.stringify(startupStatus)) };
    },
    disableStartupTask: async () => {
      calls.disableStartupTask += 1;
      startupStatus = { enabled: false, elevated: false };
      return { ok: true, status: JSON.parse(JSON.stringify(startupStatus)) };
    },
    getRuntimeStatus: async () => JSON.parse(JSON.stringify(runtime)),
    onRunLog: (callback) => {
      callbacks.runLog.push(callback);
      return () => {};
    },
    onRunState: (callback) => {
      callbacks.runState.push(callback);
      return () => {};
    },
    onStepState: (callback) => {
      callbacks.stepState.push(callback);
      return () => {};
    }
  };

  return {
    api,
    calls,
    emitRunState(payload) {
      runtime = { ...runtime, ...payload };
      callbacks.runState.forEach((callback) => callback(payload));
    },
    emitStepState(payload) {
      callbacks.stepState.forEach((callback) => callback(payload));
    }
  };
}

function createVisMock(window) {
  class DataSet {
    constructor(items) {
      this.items = Array.isArray(items) ? items : [];
    }
  }

  class Network {
    static instances = [];

    constructor(_container, data, options) {
      this.data = data;
      this.options = options;
      this.handlers = {};
      this._scale = 1;
      this._position = { x: 0, y: 0 };
      Network.instances.push(this);
    }

    on(event, callback) {
      this.handlers[event] = callback;
    }

    destroy() {}

    getPositions(ids) {
      const out = {};
      ids.forEach((id) => {
        const node = this.data.nodes.items.find((item) => item.id === id) || { x: 0, y: 0 };
        out[id] = { x: node.x || 0, y: node.y || 0 };
      });
      return out;
    }

    getScale() {
      return this._scale;
    }

    getViewPosition() {
      return this._position;
    }

    moveTo(options = {}) {
      if (typeof options.scale === "number") {
        this._scale = options.scale;
      }
      if (options.position) {
        this._position = options.position;
      }
    }

    fit() {
      this._scale = 1;
      this._position = { x: 0, y: 0 };
    }
  }

  window.vis = {
    DataSet,
    Network
  };

  return Network;
}

async function bootApp(
  initialState,
  initialRuntime = { running: false, workflowId: null, stepStatus: {}, stepEvents: {} },
  initialStartupStatus = { enabled: false, elevated: false }
) {
  const html = fs
    .readFileSync(htmlPath, "utf8")
    .replace(/<script src="\.\.\/node_modules\/vis-network[^>]*><\/script>/, "")
    .replace(/<script src="\.\/app\.js"><\/script>/, "");

  const dom = new JSDOM(html, {
    url: "http://localhost",
    runScripts: "outside-only"
  });

  const { window } = dom;
  window.alert = () => {};
  window.confirm = () => true;

  if (window.HTMLDialogElement) {
    window.HTMLDialogElement.prototype.showModal = function showModal() {
      this.open = true;
    };
    window.HTMLDialogElement.prototype.close = function close() {
      this.open = false;
    };
  }

  const apiMock = createApiMock(initialState, initialRuntime, initialStartupStatus);
  window.startupApi = apiMock.api;
  const Network = createVisMock(window);

  const script = fs.readFileSync(appPath, "utf8");
  window.eval(script);
  await waitTick(10);

  return {
    window,
    document: window.document,
    calls: apiMock.calls,
    emitRunState: apiMock.emitRunState,
    emitStepState: apiMock.emitStepState,
    Network,
    cleanup() {
      window.close();
    }
  };
}

test("tutorial button opens the guided overlay", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("help-btn").click();
  assert.equal(app.document.getElementById("tutorial-overlay").hidden, false);
  app.cleanup();
});

test("run log opens in a dialog and theme buttons switch themes", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("open-log-btn").click();
  assert.equal(app.document.getElementById("log-modal").open, true);

  app.document.getElementById("theme-dark-btn").click();
  assert.equal(app.document.body.getAttribute("data-theme"), "dark");

  app.document.getElementById("theme-light-btn").click();
  assert.equal(app.document.body.getAttribute("data-theme"), "light");
  app.cleanup();
});

test("settings button opens the app settings dialog", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("open-settings-btn").click();
  await waitTick(0);
  assert.equal(app.document.getElementById("settings-modal").open, true);
  assert.equal(app.document.getElementById("default-workflow-select").tagName, "SELECT");
  assert.equal(app.document.getElementById("auto-run-checkbox").checked, true);
  app.cleanup();
});

test("settings can enable launch on startup and expose startup-dependent controls", async () => {
  const app = await bootApp(
    {
      version: 2,
      settings: {
        autoRunOnStartup: true,
        minimizeToTray: true,
        startHiddenOnLaunch: true,
        defaultWorkflowId: "wf-1",
        repoUrl: "https://github.com/Cesarsk/better_startup_win"
      },
      workflows: [
        {
          id: "wf-1",
          name: "Main",
          description: "",
          maxParallelism: 1,
          steps: [],
          edges: []
        }
      ]
    },
    { running: false, workflowId: null, stepStatus: {}, stepEvents: {} },
    { enabled: false, elevated: false }
  );

  app.document.getElementById("open-settings-btn").click();
  await waitTick(0);
  assert.equal(app.document.getElementById("start-hidden-checkbox").disabled, true);
  assert.match(app.document.getElementById("startup-status-text").textContent, /disabled/i);

  app.document.getElementById("enable-startup-btn").click();
  await waitTick(0);

  assert.equal(app.calls.enableStartupTask, 1);
  assert.equal(app.document.getElementById("start-hidden-checkbox").disabled, false);
  assert.match(app.document.getElementById("startup-status-text").textContent, /highest privileges/i);
  app.cleanup();
});

test("workflow dialog Done button closes the dialog", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-1",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [
      {
        id: "wf-1",
        name: "Main",
        description: "",
        maxParallelism: 1,
        steps: [],
        edges: []
      }
    ]
  });

  app.document.getElementById("open-workflows-btn").click();
  assert.equal(app.document.getElementById("workflow-manager-modal").open, true);
  app.document.getElementById("workflow-manager-close").click();
  assert.equal(app.document.getElementById("workflow-manager-modal").open, false);
  app.cleanup();
});

test("support buttons open app, profile, and donation links", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("open-host-page-btn").click();
  app.document.getElementById("open-github-profile-btn").click();
  app.document.getElementById("open-donation-page-btn").click();

  assert.deepEqual(app.calls.openUrl, [
    "https://github.com/Cesarsk/better_startup_win",
    "https://github.com/Cesarsk",
    "https://github.com/sponsors/Cesarsk"
  ]);
  app.cleanup();
});

test("support prompt can be dismissed and remembered", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      minimizeToTray: true,
      startHiddenOnLaunch: true,
      suppressSupportPrompt: false,
      defaultWorkflowId: "wf-1",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [
      {
        id: "wf-1",
        name: "Main",
        description: "",
        maxParallelism: 1,
        steps: [],
        edges: []
      }
    ]
  });

  await waitTick(950);
  assert.equal(app.document.getElementById("support-modal").open, true);
  app.document.getElementById("support-dont-show-checkbox").checked = true;
  app.document.getElementById("support-no-btn").click();
  await waitTick(0);

  assert.equal(app.document.getElementById("support-modal").open, false);
  assert.equal(app.calls.saveState > 0, true);
  app.cleanup();
});

test("new workflow modal creates a workflow", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("new-workflow-btn").click();
  app.document.getElementById("workflow-modal-name").value = "Morning startup";
  app.document.getElementById("workflow-modal-create").click();

  const workflowSelect = app.document.getElementById("workflow-select");
  assert.equal(workflowSelect.disabled, false);
  assert.equal(workflowSelect.options.length, 1);
  assert.equal(workflowSelect.options[0].textContent, "Morning startup");
  app.cleanup();
});

test("new step modal creates a step", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-1",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [
      {
        id: "wf-1",
        name: "Main",
        description: "",
        maxParallelism: 1,
        steps: [],
        edges: []
      }
    ]
  });

  app.document.getElementById("new-step-btn").click();
  app.document.getElementById("step-modal-label").value = "Start Discord";
  app.document.getElementById("step-modal-action").value = "start_app";
  app.document.getElementById("step-modal-create").click();

  const stepSelect = app.document.getElementById("step-select");
  assert.equal(stepSelect.options.length, 2);
  assert.equal(stepSelect.options[0].textContent, "No action selected");
  assert.equal(stepSelect.options[1].textContent, "Start Discord");
  app.cleanup();
});

test("dependency source select stays enabled and explains when no source action exists", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-1",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [
      {
        id: "wf-1",
        name: "Main",
        description: "",
        maxParallelism: 1,
        steps: [
          {
            id: "step-1",
            label: "Single step",
            actionType: "wait",
            action: { milliseconds: 1000 },
            gate: "all"
          }
        ],
        edges: []
      }
    ]
  });

  const stepSelect = app.document.getElementById("step-select");
  stepSelect.value = "step-1";
  stepSelect.dispatchEvent(new app.window.Event("change", { bubbles: true }));

  const sourceSelect = app.document.getElementById("dependency-source-select");
  assert.equal(sourceSelect.disabled, false);
  assert.equal(sourceSelect.options[0].textContent, "Pick another action first");
  app.cleanup();
});

test("StartupAll migration template expands into a full workflow", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("template-select").value = "startupall-migration";
  app.document.getElementById("load-template-btn").click();

  const workflowSelect = app.document.getElementById("workflow-select");
  const stepSelect = app.document.getElementById("step-select");
  assert.equal(workflowSelect.options[0].textContent, "StartupAll migration");
  assert.equal(stepSelect.options.length, 15);
  assert.equal(stepSelect.options[0].textContent, "No action selected");
  assert.match(stepSelect.options[1].textContent, /Wait for preferred display/i);
  const openRgbOption = Array.from(stepSelect.options).find((option) => option.textContent === "Start OpenRGB server and load default profile");
  stepSelect.value = openRgbOption.value;
  stepSelect.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.document.getElementById("step-action-select").value, "run_powershell");
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /WindowStyle Minimized/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /--server/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /AddSeconds\(30\)/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /TcpClient/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /'ORGB'/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /Wait-Controllers @\('Govee'\) 45/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /Start-Sleep -Seconds 5/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /\*Corsair Vengeance\*/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /\*Govee\*/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /Write-Packet 152/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /Write-Packet 1101/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /Write-Packet 1050/);
  assert.doesNotMatch(app.document.querySelector('[data-action-key="script"]').value, /Close-MainWindowToTray -Name 'OpenRGB'/);

  const streamDeckOption = Array.from(stepSelect.options).find((option) => option.textContent === "Start StreamDeck and close main window");
  stepSelect.value = streamDeckOption.value;
  stepSelect.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.document.getElementById("step-action-select").value, "run_powershell");
  assert.doesNotMatch(app.document.querySelector('[data-action-key="script"]').value, /--runinbk/);
  assert.doesNotMatch(app.document.querySelector('[data-action-key="script"]').value, /Close-MainWindowToTray -Name 'StreamDeck'/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /QWindowIcon/);
  assert.doesNotMatch(app.document.querySelector('[data-action-key="script"]').value, /QWindowToolSaveBits/);
  assert.match(app.document.querySelector('[data-action-key="script"]').value, /Close-StreamDeckMainWindow -Name 'StreamDeck' -TimeoutSeconds 60/);
  app.cleanup();
});

test("loading a starter template creates a workflow with steps", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("template-select").value = "sequential-apps";
  app.document.getElementById("load-template-btn").click();

  const workflowSelect = app.document.getElementById("workflow-select");
  const stepSelect = app.document.getElementById("step-select");
  assert.equal(workflowSelect.options.length, 1);
  assert.equal(stepSelect.options.length, 3);
  app.cleanup();
});

test("run and stop buttons call workflow API methods", async () => {
  const workflow = {
    id: "wf-1",
    name: "Main",
    description: "",
    maxParallelism: 1,
    steps: [
      {
        id: "step-1",
        label: "Wait",
        actionType: "wait",
        action: { milliseconds: 1000 },
        gate: "all"
      }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-1",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  app.document.getElementById("run-workflow-btn").click();
  assert.equal(app.calls.runWorkflow.length, 1);
  assert.equal(app.calls.runWorkflow[0].id, "wf-1");

  app.emitRunState({ running: true, workflowId: "wf-1", stepStatus: {}, stepEvents: {} });
  await waitTick(0);
  assert.equal(app.document.getElementById("stop-workflow-btn").disabled, false);
  app.document.getElementById("stop-workflow-btn").click();
  assert.equal(app.calls.stopWorkflow, 1);
  app.cleanup();
});

test("right clicking a graph action opens a context menu and can run just that action", async () => {
  const workflow = {
    id: "wf-context",
    name: "Context menu",
    description: "",
    maxParallelism: 1,
    steps: [
      {
        id: "step-1",
        label: "Run me only",
        actionType: "wait",
        action: { milliseconds: 1000 },
        gate: "all"
      },
      {
        id: "step-2",
        label: "Other",
        actionType: "wait",
        action: { milliseconds: 1000 },
        gate: "all"
      }
    ],
    edges: [{ id: "edge-1", from: "step-1", to: "step-2", event: "completed" }]
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-context",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  const firstNode = app.document.querySelector(".graph-node[data-step-id='step-1']");
  firstNode.dispatchEvent(new app.window.MouseEvent("contextmenu", { bubbles: true, clientX: 120, clientY: 160 }));

  const contextMenu = app.document.getElementById("graph-context-menu");
  assert.equal(contextMenu.hidden, false);
  assert.match(app.document.getElementById("graph-context-title").textContent, /Run me only/i);
  assert.equal(app.document.getElementById("graph-context-delete-btn").hidden, false);
  assert.equal(app.document.getElementById("graph-context-new-btn").hidden, true);

  app.document.getElementById("graph-context-run-btn").click();
  await waitTick(0);

  assert.equal(app.calls.runWorkflow.length, 1);
  assert.equal(app.calls.runWorkflow[0].name, "Run action: Run me only");
  assert.equal(app.calls.runWorkflow[0].steps.length, 1);
  assert.equal(app.calls.runWorkflow[0].steps[0].id, "step-1");
  app.cleanup();
});

test("right clicking empty graph space offers new action and node menu can delete", async () => {
  const workflow = {
    id: "wf-context-2",
    name: "Context menu 2",
    description: "",
    maxParallelism: 1,
    steps: [
      {
        id: "step-1",
        label: "Delete me",
        actionType: "wait",
        action: { milliseconds: 1000 },
        gate: "all"
      }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-context-2",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  const graphCanvas = app.document.getElementById("graph-canvas");
  graphCanvas.dispatchEvent(new app.window.MouseEvent("contextmenu", { bubbles: true, clientX: 80, clientY: 120 }));
  assert.equal(app.document.getElementById("graph-context-menu").hidden, false);
  assert.equal(app.document.getElementById("graph-context-new-btn").hidden, false);
  assert.equal(app.document.getElementById("graph-context-run-btn").hidden, true);

  app.document.getElementById("graph-context-new-btn").click();
  assert.equal(app.document.getElementById("step-modal").open, true);

  const firstNode = app.document.querySelector(".graph-node[data-step-id='step-1']");
  firstNode.dispatchEvent(new app.window.MouseEvent("contextmenu", { bubbles: true, clientX: 140, clientY: 170 }));
  app.document.getElementById("graph-context-delete-btn").click();

  assert.equal(app.document.getElementById("step-select").options.length, 1);
  assert.equal(app.document.getElementById("step-select").disabled, true);
  app.cleanup();
});

test("validate uses the in-memory workflow object so unsaved workflows can be checked", async () => {
  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: []
  });

  app.document.getElementById("template-select").value = "sequential-apps";
  app.document.getElementById("load-template-btn").click();
  app.document.getElementById("validate-workflow-btn").click();

  assert.equal(app.calls.validateWorkflow.length, 1);
  assert.equal(typeof app.calls.validateWorkflow[0], "object");
  assert.equal(app.calls.validateWorkflow[0].name, "Sequential startup");
  app.cleanup();
});

test("graph renders readable nodes and dependency labels", async () => {
  const workflow = {
    id: "wf-graph",
    name: "Graph",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "Start app", actionType: "start_app", action: { path: "C:\\App.exe", args: "", workingDirectory: "", waitForExit: false }, gate: "all" },
      { id: "b", label: "Wait exit", actionType: "wait", action: { milliseconds: 100 }, gate: "all" }
    ],
    edges: [{ id: "edge-1", from: "a", to: "b", event: "process_exited" }]
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-graph",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  const graphCanvas = app.document.getElementById("graph-canvas");
  const nodeButtons = graphCanvas.querySelectorAll(".graph-node");
  const edgeLabel = graphCanvas.querySelector(".graph-edge-pill text");

  assert.equal(nodeButtons.length, 2);
  assert.match(nodeButtons[0].textContent, /Start app/i);
  assert.equal(edgeLabel.textContent, "Process exited");
  app.cleanup();
});

test("clicking a dependency arrow opens dependency-only inspector mode", async () => {
  const workflow = {
    id: "wf-edge-mode",
    name: "Edge mode",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "Action A", actionType: "wait", action: { milliseconds: 100 }, gate: "all" },
      { id: "b", label: "Action B", actionType: "wait", action: { milliseconds: 100 }, gate: "all" }
    ],
    edges: [{ id: "edge-1", from: "a", to: "b", event: "started" }]
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      minimizeToTray: true,
      startHiddenOnLaunch: true,
      defaultWorkflowId: "wf-edge-mode",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  app.document.querySelector(".graph-edge-pill").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true, clientX: 220, clientY: 220 }));

  assert.equal(app.document.getElementById("editor-title").textContent, "Selected Dependency");
  assert.equal(app.document.getElementById("step-select-wrap").hidden, true);
  assert.equal(app.document.getElementById("connection-editor").hidden, false);
  assert.equal(app.document.getElementById("step-editor-body").style.display, "none");
  assert.equal(app.document.getElementById("delete-step-row").hidden, true);
  app.cleanup();
});

test("clicking empty graph space clears the selected action", async () => {
  const workflow = {
    id: "wf-clear",
    name: "Clear selection",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "First action", actionType: "wait", action: { milliseconds: 100 }, gate: "all" },
      { id: "b", label: "Second action", actionType: "wait", action: { milliseconds: 100 }, gate: "all" }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-clear",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  app.document.querySelector(".graph-node[data-step-id='a']").click();
  assert.equal(app.document.getElementById("step-editor-body").style.display, "flex");

  app.document.getElementById("graph-canvas").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true, clientX: 12, clientY: 12 }));
  assert.equal(app.document.getElementById("step-editor-body").style.display, "none");
  assert.equal(app.document.getElementById("step-editor-empty").style.display, "block");
  assert.equal(app.document.getElementById("step-select").value, "");
  assert.equal(app.document.getElementById("connection-editor").hidden, true);
  assert.equal(app.document.getElementById("delete-step-row").hidden, true);
  app.cleanup();
});

test("dragging empty graph space pans without selecting or clearing nodes by accident", async () => {
  const workflow = {
    id: "wf-pan",
    name: "Pan graph",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "First action", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 0 } },
      { id: "b", label: "Second action", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 900, y: 0 } }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-pan",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  const graphCanvas = app.document.getElementById("graph-canvas");
  graphCanvas.scrollLeft = 0;
  graphCanvas.dispatchEvent(new app.window.MouseEvent("mousedown", { bubbles: true, button: 0, clientX: 260, clientY: 260 }));
  app.window.dispatchEvent(new app.window.MouseEvent("mousemove", { bubbles: true, clientX: 120, clientY: 260 }));
  app.window.dispatchEvent(new app.window.MouseEvent("mouseup", { bubbles: true, button: 0, clientX: 120, clientY: 260 }));

  assert.equal(graphCanvas.scrollLeft > 0, true);
  graphCanvas.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true, clientX: 120, clientY: 260 }));
  assert.equal(app.document.getElementById("step-select").value, "");
  app.cleanup();
});

test("connectors can create a dependency directly in the graph", async () => {
  const workflow = {
    id: "wf-connectors",
    name: "Connectors",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "Source", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 0 } },
      { id: "b", label: "Target", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 280 } }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      minimizeToTray: true,
      startHiddenOnLaunch: true,
      defaultWorkflowId: "wf-connectors",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  app.document
    .querySelector(".graph-connector[data-connector-step-id='a'][data-connector-side='bottom']")
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true, clientX: 200, clientY: 180 }));
  app.document
    .querySelector(".graph-connector[data-connector-step-id='b'][data-connector-side='top']")
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true, clientX: 200, clientY: 360 }));

  assert.equal(app.document.querySelectorAll(".graph-edge-pill").length, 1);
  assert.equal(app.document.getElementById("editor-title").textContent, "Selected Dependency");
  assert.match(app.document.getElementById("connection-source-label").textContent, /Source/);
  assert.match(app.document.getElementById("connection-target-label").textContent, /Target/);
  app.cleanup();
});

test("duplicate arrows between the same actions are marked invalid", async () => {
  const workflow = {
    id: "wf-duplicate-edge",
    name: "Duplicate edge",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "Source", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 0 } },
      { id: "b", label: "Target", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 280 } }
    ],
    edges: [
      { id: "edge-1", from: "a", to: "b", event: "started" },
      { id: "edge-2", from: "a", to: "b", event: "completed" }
    ]
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-duplicate-edge",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  assert.equal(app.document.querySelectorAll(".graph-edge-path.duplicate").length, 2);
  assert.equal(app.document.querySelectorAll(".graph-edge-pill.duplicate").length, 2);
  app.cleanup();
});

test("mouse wheel keeps normal graph scrolling instead of zooming", async () => {
  const workflow = {
    id: "wf-wheel",
    name: "Wheel zoom",
    description: "",
    maxParallelism: 1,
    steps: [
      { id: "a", label: "First action", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 0 } },
      { id: "b", label: "Second action", actionType: "wait", action: { milliseconds: 100 }, gate: "all", position: { x: 0, y: 700 } }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 2,
    settings: {
      autoRunOnStartup: true,
      defaultWorkflowId: "wf-wheel",
      repoUrl: "https://github.com/Cesarsk/better_startup_win"
    },
    workflows: [workflow]
  });

  const graphCanvas = app.document.getElementById("graph-canvas");
  graphCanvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 });
  graphCanvas.scrollTop = 120;
  const initialWidth = app.document.querySelector(".graph-inner").style.width;

  graphCanvas.dispatchEvent(new app.window.WheelEvent("wheel", { bubbles: true, deltaY: -120, clientX: 240, clientY: 180 }));

  const nextWidth = app.document.querySelector(".graph-inner").style.width;
  assert.equal(nextWidth, initialWidth);
  assert.equal(graphCanvas.scrollTop, 120);
  app.cleanup();
});
