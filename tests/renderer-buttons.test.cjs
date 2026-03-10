const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const rootDir = path.resolve(__dirname, "..");
const htmlPath = path.join(rootDir, "renderer", "index.html");
const appPath = path.join(rootDir, "renderer", "app.js");

function waitTick(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createApiMock(initialState, initialRuntime) {
  const callbacks = {
    runLog: [],
    runState: [],
    nodeState: []
  };

  const calls = {
    openDonation: 0,
    openRepo: 0,
    runFlow: [],
    stopFlow: 0,
    saveState: 0
  };

  let state = JSON.parse(JSON.stringify(initialState));
  let runtime = JSON.parse(JSON.stringify(initialRuntime));

  const api = {
    getState: async () => JSON.parse(JSON.stringify(state)),
    saveState: async (next) => {
      calls.saveState += 1;
      state = JSON.parse(JSON.stringify(next));
      return JSON.parse(JSON.stringify(state));
    },
    runFlow: async (flowId) => {
      calls.runFlow.push(flowId);
      return { ok: true };
    },
    stopFlow: async () => {
      calls.stopFlow += 1;
      return { ok: true };
    },
    validateFlow: async () => ({ ok: true, errors: [] }),
    openDonation: async () => {
      calls.openDonation += 1;
      return { ok: true };
    },
    openRepo: async () => {
      calls.openRepo += 1;
      return { ok: true };
    },
    installStartupTask: async () => ({ ok: true, taskName: "Better Startup Win" }),
    getRuntimeStatus: async () => JSON.parse(JSON.stringify(runtime)),
    onRunLog: (cb) => {
      callbacks.runLog.push(cb);
      return () => {};
    },
    onRunState: (cb) => {
      callbacks.runState.push(cb);
      return () => {};
    },
    onNodeState: (cb) => {
      callbacks.nodeState.push(cb);
      return () => {};
    }
  };

  return {
    api,
    calls,
    emitRunState(payload) {
      runtime = { ...runtime, ...payload };
      callbacks.runState.forEach((cb) => cb(payload));
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

async function bootApp(initialState, initialRuntime = { running: false, flowId: null, nodeStatus: {} }) {
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

  const apiMock = createApiMock(initialState, initialRuntime);
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
    Network,
    cleanup() {
      window.close();
    }
  };
}

test("support button opens donation link", async () => {
  const app = await bootApp({
    version: 1,
    settings: { autoRunOnStartup: true, defaultFlowId: "", donationUrl: "https://buymeacoffee.com/lucach" },
    flows: []
  });

  app.document.getElementById("donate-btn").click();
  assert.equal(app.calls.openDonation, 1);
  app.cleanup();
});

test("help button opens project repository", async () => {
  const app = await bootApp({
    version: 1,
    settings: {
      autoRunOnStartup: true,
      defaultFlowId: "",
      repoUrl: "https://github.com/Cesarsk/better_startup_win",
      donationUrl: "https://buymeacoffee.com/lucach"
    },
    flows: []
  });

  app.document.getElementById("help-btn").click();
  assert.equal(app.calls.openRepo, 1);
  app.cleanup();
});

test("new flow modal creates a flow", async () => {
  const app = await bootApp({
    version: 1,
    settings: { autoRunOnStartup: true, defaultFlowId: "", donationUrl: "https://buymeacoffee.com/lucach" },
    flows: []
  });

  app.document.getElementById("new-flow-btn").click();
  const nameInput = app.document.getElementById("flow-modal-name");
  nameInput.value = "Morning Startup";
  app.document.getElementById("flow-modal-create").click();

  const flowSelect = app.document.getElementById("flow-select");
  assert.equal(flowSelect.disabled, false);
  assert.equal(flowSelect.options.length, 1);
  assert.equal(flowSelect.options[0].textContent, "Morning Startup");
  app.cleanup();
});

test("run and stop buttons call API methods", async () => {
  const flow = {
    id: "flow-1",
    name: "Main",
    description: "",
    nodes: [
      { id: "n1", type: "delay", label: "Delay", config: { milliseconds: 1000 } }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 1,
    settings: { autoRunOnStartup: true, defaultFlowId: "flow-1", donationUrl: "https://buymeacoffee.com/lucach" },
    flows: [flow]
  });

  app.document.getElementById("run-flow-btn").click();
  assert.deepEqual(app.calls.runFlow, ["flow-1"]);

  app.emitRunState({ running: true, flowId: "flow-1", nodeStatus: {} });
  await waitTick(0);
  assert.equal(app.document.getElementById("stop-flow-btn").disabled, false);
  app.document.getElementById("stop-flow-btn").click();
  assert.equal(app.calls.stopFlow, 1);
  app.cleanup();
});

test("graph enables zoom/drag and edge labels are readable", async () => {
  const flow = {
    id: "flow-graph",
    name: "Graph",
    description: "",
    nodes: [
      { id: "a", type: "delay", label: "A", config: { milliseconds: 100 } },
      { id: "b", type: "delay", label: "B", config: { milliseconds: 100 } }
    ],
    edges: [{ id: "e1", from: "a", to: "b", condition: "success" }]
  };

  const app = await bootApp({
    version: 1,
    settings: { autoRunOnStartup: true, defaultFlowId: "flow-graph", donationUrl: "https://buymeacoffee.com/lucach" },
    flows: [flow]
  });

  const network = app.Network.instances.at(-1);
  assert.equal(network.options.interaction.zoomView, true);
  assert.equal(network.options.interaction.dragNodes, true);
  assert.equal(network.options.interaction.dragView, true);

  const edge = network.data.edges.items[0];
  assert.equal(edge.label, "success");
  assert.equal(edge.font.size, 13);
  app.cleanup();
});

test("undo and redo buttons revert node creation", async () => {
  const flow = {
    id: "flow-undo",
    name: "Undo Flow",
    description: "",
    nodes: [
      { id: "n1", type: "delay", label: "Base", config: { milliseconds: 500 } }
    ],
    edges: []
  };

  const app = await bootApp({
    version: 1,
    settings: { autoRunOnStartup: true, defaultFlowId: "flow-undo", donationUrl: "https://buymeacoffee.com/lucach" },
    flows: [flow]
  });

  const countOptions = () => app.document.getElementById("node-select").options.length;
  assert.equal(countOptions(), 1);

  app.document.getElementById("new-node-btn").click();
  app.document.getElementById("node-modal-label").value = "Second";
  app.document.getElementById("node-modal-type").value = "delay";
  app.document.getElementById("node-modal-create").click();
  assert.equal(countOptions(), 2);

  app.document.getElementById("undo-btn").click();
  assert.equal(countOptions(), 1);

  app.document.getElementById("redo-btn").click();
  assert.equal(countOptions(), 2);
  app.cleanup();
});
