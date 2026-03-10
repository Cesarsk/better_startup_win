const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { spawn } = require("node:child_process");
const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  nativeImage,
  ipcMain,
  shell,
  Notification
} = require("electron");
const { loadState, saveState } = require("./store");
const { FlowRunner, validateFlow } = require("./runner");

let mainWindow = null;
let tray = null;
let appState = null;
let appIsQuitting = false;
let runner = null;
let runtime = {
  running: false,
  flowId: null,
  nodeStatus: {}
};

const STARTUP_TASK_NAME = "Better Startup Win";
const startedFromTaskScheduler = process.argv.includes("--startup");

function configureRuntimePaths() {
  const runtimeRoot = path.join(os.tmpdir(), "better-startup-win-runtime");
  const cacheDir = path.join(runtimeRoot, "cache");
  const userDataDir = path.join(runtimeRoot, "user-data");

  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.mkdirSync(userDataDir, { recursive: true });
    app.setPath("userData", userDataDir);
    app.commandLine.appendSwitch("disk-cache-dir", cacheDir);
    app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
  } catch {
    // Keep Electron defaults if runtime path configuration fails.
  }
}

configureRuntimePaths();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createTrayIcon() {
  const iconPath = path.join(__dirname, "..", "assets", "tray-icon.svg");
  const icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) {
    return icon;
  }

  const fallbackSvg = `
    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="14" height="14" rx="3" ry="3" fill="#2f3f57" />
      <path d="M4 8h8" stroke="#d7e6f7" stroke-width="1.5" />
      <circle cx="6" cy="5" r="1" fill="#d7e6f7" />
      <circle cx="10" cy="11" r="1" fill="#d7e6f7" />
    </svg>
  `;
  return nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(fallbackSvg).toString("base64")}`);
}

function emitToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function createWindow(showOnCreate) {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1080,
    minHeight: 680,
    show: !!showOnCreate,
    title: "Better Startup Win",
    backgroundColor: "#132033",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));

  mainWindow.on("close", (event) => {
    if (!appIsQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  const runningFlowName = appState?.flows?.find((flow) => flow.id === runtime.flowId)?.name || runtime.flowId;
  const statusLabel = runtime.running
    ? `Status: Running ${runningFlowName ? `(${runningFlowName})` : ""}`
    : "Status: Idle";

  const menu = Menu.buildFromTemplate([
    {
      label: statusLabel,
      enabled: false
    },
    {
      type: "separator"
    },
    {
      label: "Open Better Startup Win",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: "Run Default Flow",
      enabled: !runtime.running,
      click: async () => {
        const defaultFlowId = appState.settings.defaultFlowId;
        try {
          await runFlowById(defaultFlowId);
        } catch (error) {
          emitToRenderer("run:log", `[${new Date().toISOString()}] Tray run failed: ${error.message}`);
        }
      }
    },
    {
      label: "Stop Running Flow",
      enabled: runtime.running,
      click: () => runner.stop()
    },
    {
      type: "separator"
    },
    {
      label: "Help (Project Repo)",
      click: () => {
        const repoUrl = appState?.settings?.repoUrl;
        if (repoUrl) {
          shell.openExternal(repoUrl);
        }
      }
    },
    {
      type: "separator"
    },
    {
      label: "Support This Project ❤️",
      click: () => {
        const url = appState?.settings?.donationUrl;
        if (url) {
          shell.openExternal(url);
        }
      }
    },
    {
      type: "separator"
    },
    {
      label: "Exit",
      click: () => {
        appIsQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(menu);
}

function createTray() {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("Better Startup Win");

  tray.on("double-click", () => {
    if (!mainWindow) {
      return;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  updateTrayMenu();
}

function registerRunnerEvents() {
  runner.on("log", (line) => {
    emitToRenderer("run:log", line);
  });

  runner.on("state", (payload) => {
    runtime = {
      ...runtime,
      ...payload,
      running: !!payload.running,
      flowId: payload.running ? payload.flowId : null,
      nodeStatus: payload.nodeStatus || runtime.nodeStatus || {}
    };
    emitToRenderer("run:state", runtime);
    updateTrayMenu();

    if (!payload.running && payload.failed && Notification.isSupported()) {
      new Notification({
        title: "Better Startup Win",
        body: "Flow finished with failures. Open the app for details."
      }).show();
    }
  });

  runner.on("node", (payload) => {
    runtime.nodeStatus = {
      ...runtime.nodeStatus,
      [payload.nodeId]: payload.status
    };
    emitToRenderer("run:node", payload);
  });
}

function getFlowById(flowId) {
  return appState.flows.find((flow) => flow.id === flowId);
}

async function runFlowById(flowId) {
  if (runner.isRunning()) {
    throw new Error("A flow is already running.");
  }

  const flow = getFlowById(flowId);
  if (!flow) {
    throw new Error(`Flow not found: ${flowId}`);
  }

  runtime.nodeStatus = {};
  try {
    await runner.run(flow);
  } catch (error) {
    emitToRenderer("run:log", `[${new Date().toISOString()}] Runner error: ${error.message}`);
    runtime = {
      running: false,
      flowId: null,
      nodeStatus: runtime.nodeStatus,
      failed: true
    };
    emitToRenderer("run:state", runtime);
    updateTrayMenu();
    throw error;
  }
}

function runCommandCapture(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      windowsHide: true,
      shell: false
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    proc.on("error", (error) => reject(error));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Command exited with code ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function buildTaskSchedulerCommand() {
  if (app.isPackaged) {
    return `\"${process.execPath}\" --startup`;
  }

  return `\"${process.execPath}\" \"${app.getAppPath()}\" --startup`;
}

async function installStartupTask() {
  const taskCommand = buildTaskSchedulerCommand();
  await runCommandCapture("schtasks.exe", [
    "/Create",
    "/TN",
    STARTUP_TASK_NAME,
    "/SC",
    "ONLOGON",
    "/RL",
    "HIGHEST",
    "/TR",
    taskCommand,
    "/F"
  ]);
  return {
    ok: true,
    taskName: STARTUP_TASK_NAME,
    command: taskCommand
  };
}

function registerIpcHandlers() {
  ipcMain.handle("state:get", async () => appState);

  ipcMain.handle("state:save", async (_, nextState) => {
    appState = nextState;
    saveState(appState);
    updateTrayMenu();
    return appState;
  });

  ipcMain.handle("runtime:status", async () => runtime);

  ipcMain.handle("flow:run", async (_, flowId) => {
    await runFlowById(flowId);
    return { ok: true };
  });

  ipcMain.handle("flow:stop", async () => {
    runner.stop();
    return { ok: true };
  });

  ipcMain.handle("flow:validate", async (_, flowId) => {
    const flow = getFlowById(flowId);
    if (!flow) {
      return { ok: false, errors: ["Flow not found"] };
    }
    return validateFlow(flow);
  });

  ipcMain.handle("app:open-donation", async () => {
    const url = appState?.settings?.donationUrl;
    if (url) {
      await shell.openExternal(url);
      return { ok: true };
    }
    return { ok: false };
  });

  ipcMain.handle("app:open-repo", async () => {
    const url = appState?.settings?.repoUrl;
    if (url) {
      await shell.openExternal(url);
      return { ok: true };
    }
    return { ok: false };
  });

  ipcMain.handle("task:install", async () => installStartupTask());
}

app.setAppUserModelId("com.cesarsk.betterstartupwin");
app.on("window-all-closed", () => {
  // Keep app alive in tray.
});

app.whenReady().then(async () => {
  appState = loadState();
  runner = new FlowRunner();
  registerRunnerEvents();
  registerIpcHandlers();
  createWindow(!startedFromTaskScheduler);
  createTray();

  if (startedFromTaskScheduler && appState.settings.autoRunOnStartup && appState.settings.defaultFlowId) {
    emitToRenderer("run:log", `[${new Date().toISOString()}] Startup launch detected, running default flow`);
    try {
      await runFlowById(appState.settings.defaultFlowId);
    } catch (error) {
      emitToRenderer("run:log", `[${new Date().toISOString()}] Auto-run failed: ${error.message}`);
    }
  }
});

app.on("before-quit", () => {
  appIsQuitting = true;
});
