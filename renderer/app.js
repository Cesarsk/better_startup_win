const api = window.startupApi;

const elements = {
  flowSelect: document.getElementById("flow-select"),
  defaultFlowSelect: document.getElementById("default-flow-select"),
  autoRunCheckbox: document.getElementById("auto-run-checkbox"),
  repoLinkBtn: document.getElementById("repo-link-btn"),
  runFlowBtn: document.getElementById("run-flow-btn"),
  undoBtn: document.getElementById("undo-btn"),
  redoBtn: document.getElementById("redo-btn"),
  stopFlowBtn: document.getElementById("stop-flow-btn"),
  validateFlowBtn: document.getElementById("validate-flow-btn"),
  saveStateBtn: document.getElementById("save-state-btn"),
  installTaskBtn: document.getElementById("install-task-btn"),
  helpBtn: document.getElementById("help-btn"),
  donateBtn: document.getElementById("donate-btn"),
  newFlowBtn: document.getElementById("new-flow-btn"),
  cloneFlowBtn: document.getElementById("clone-flow-btn"),
  deleteFlowBtn: document.getElementById("delete-flow-btn"),
  edgeFromSelect: document.getElementById("edge-from-select"),
  edgeToSelect: document.getElementById("edge-to-select"),
  edgeConditionSelect: document.getElementById("edge-condition-select"),
  addEdgeBtn: document.getElementById("add-edge-btn"),
  edgeList: document.getElementById("edge-list"),
  graphCanvas: document.getElementById("graph-canvas"),
  zoomOutBtn: document.getElementById("zoom-out-btn"),
  zoomInBtn: document.getElementById("zoom-in-btn"),
  fitGraphBtn: document.getElementById("fit-graph-btn"),
  runtimeChip: document.getElementById("runtime-chip"),
  nodeSelect: document.getElementById("node-select"),
  nodeLabelInput: document.getElementById("node-label-input"),
  nodeTypeSelect: document.getElementById("node-type-select"),
  nodeConfigForm: document.getElementById("node-config-form"),
  nodeValidationSummary: document.getElementById("node-validation-summary"),
  advancedConfigDetails: document.getElementById("advanced-config-details"),
  nodeConfigInput: document.getElementById("node-config-input"),
  applyJsonBtn: document.getElementById("apply-json-btn"),
  saveNodeBtn: document.getElementById("save-node-btn"),
  newNodeBtn: document.getElementById("new-node-btn"),
  deleteNodeBtn: document.getElementById("delete-node-btn"),
  clearLogsBtn: document.getElementById("clear-logs-btn"),
  logOutput: document.getElementById("log-output"),
  flowModal: document.getElementById("flow-modal"),
  flowModalName: document.getElementById("flow-modal-name"),
  flowModalCancel: document.getElementById("flow-modal-cancel"),
  flowModalCreate: document.getElementById("flow-modal-create"),
  nodeModal: document.getElementById("node-modal"),
  nodeModalLabel: document.getElementById("node-modal-label"),
  nodeModalType: document.getElementById("node-modal-type"),
  nodeModalCancel: document.getElementById("node-modal-cancel"),
  nodeModalCreate: document.getElementById("node-modal-create"),
  wizardModal: document.getElementById("wizard-modal"),
  wizardFlowName: document.getElementById("wizard-flow-name"),
  wizardAddNode: document.getElementById("wizard-add-node"),
  wizardNodeFields: document.getElementById("wizard-node-fields"),
  wizardNodeLabel: document.getElementById("wizard-node-label"),
  wizardNodeType: document.getElementById("wizard-node-type"),
  wizardCancel: document.getElementById("wizard-cancel"),
  wizardCreate: document.getElementById("wizard-create")
};

let state = null;
let selectedFlowId = null;
let selectedNodeId = null;
let runtime = {
  running: false,
  flowId: null,
  nodeStatus: {}
};
let graph = null;
let graphViewState = {
  scale: 1,
  position: { x: 0, y: 0 }
};
const logs = [];
const undoStack = [];
const redoStack = [];
const HISTORY_LIMIT = 80;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function snapshot() {
  return {
    state: clone(state),
    selectedFlowId,
    selectedNodeId
  };
}

function restoreSnapshot(entry) {
  if (!entry) {
    return;
  }

  state = clone(entry.state);
  selectedFlowId = entry.selectedFlowId;
  selectedNodeId = entry.selectedNodeId;
  renderAll();
}

function updateHistoryButtons() {
  elements.undoBtn.disabled = undoStack.length === 0;
  elements.redoBtn.disabled = redoStack.length === 0;
}

function pushHistory() {
  if (!state) {
    return;
  }

  undoStack.push(snapshot());
  if (undoStack.length > HISTORY_LIMIT) {
    undoStack.shift();
  }
  redoStack.length = 0;
  updateHistoryButtons();
}

function undo() {
  if (undoStack.length === 0) {
    return;
  }

  redoStack.push(snapshot());
  const prev = undoStack.pop();
  restoreSnapshot(prev);
  updateHistoryButtons();
}

function redo() {
  if (redoStack.length === 0) {
    return;
  }

  undoStack.push(snapshot());
  const next = redoStack.pop();
  restoreSnapshot(next);
  updateHistoryButtons();
}

function buildId(prefix, label) {
  const tail = (label || "node")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);

  return `${prefix}-${tail || "item"}-${crypto.randomUUID().slice(0, 6)}`;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getDefaultConfig(type) {
  switch (type) {
    case "delay":
      return { milliseconds: 1000 };
    case "start_process":
      return { path: "", args: "", workingDirectory: "" };
    case "stop_process":
      return { processName: "" };
    case "close_window":
      return { processName: "", waitMilliseconds: 0 };
    case "run_script":
      return { path: "", args: "", waitForExit: true };
    case "wait_display":
      return {
        adapterNameLike: "*RTX*",
        width: 3440,
        height: 1440,
        refresh: 164,
        pollSeconds: 10,
        timeoutSeconds: 300
      };
    case "wait_monitor":
      return { edidName: "XENEON EDGE", pollSeconds: 10, timeoutSeconds: 600 };
    default:
      return {};
  }
}

const NODE_SCHEMAS = {
  delay: [
    { key: "milliseconds", label: "Delay (ms)", type: "number", min: 0, step: 100, required: true }
  ],
  start_process: [
    { key: "path", label: "Executable path", type: "text", placeholder: "C:\\Path\\App.exe", required: true },
    { key: "args", label: "Arguments", type: "text", placeholder: "--flag" },
    { key: "workingDirectory", label: "Working directory", type: "text", placeholder: "Optional" }
  ],
  stop_process: [
    { key: "processName", label: "Process name", type: "text", placeholder: "StreamDeck", required: true }
  ],
  close_window: [
    { key: "processName", label: "Process name", type: "text", placeholder: "aida64", required: true },
    { key: "waitMilliseconds", label: "Wait before close (ms)", type: "number", min: 0, step: 100, required: true }
  ],
  run_script: [
    { key: "path", label: "Script or executable path", type: "text", placeholder: "C:\\Scripts\\job.ps1", required: true },
    { key: "args", label: "Arguments", type: "text", placeholder: "-DryRun" },
    { key: "waitForExit", label: "Wait for exit", type: "checkbox" }
  ],
  wait_display: [
    { key: "adapterNameLike", label: "Adapter name like", type: "text", placeholder: "*RTX*", required: true },
    { key: "width", label: "Width", type: "number", min: 1, step: 1, required: true },
    { key: "height", label: "Height", type: "number", min: 1, step: 1, required: true },
    { key: "refresh", label: "Refresh rate", type: "number", min: 1, step: 1, required: true },
    { key: "pollSeconds", label: "Poll interval (s)", type: "number", min: 1, step: 1, required: true },
    { key: "timeoutSeconds", label: "Timeout (s)", type: "number", min: 1, step: 1, required: true }
  ],
  wait_monitor: [
    { key: "edidName", label: "Monitor EDID contains", type: "text", placeholder: "XENEON EDGE", required: true },
    { key: "pollSeconds", label: "Poll interval (s)", type: "number", min: 1, step: 1, required: true },
    { key: "timeoutSeconds", label: "Timeout (s)", type: "number", min: 1, step: 1, required: true }
  ]
};

function getNodeSchema(type) {
  return NODE_SCHEMAS[type] || [];
}

function normalizeNodeConfig(type, config) {
  const normalized = { ...getDefaultConfig(type), ...(config || {}) };
  const schema = getNodeSchema(type);

  for (const field of schema) {
    const value = normalized[field.key];
    if (field.type === "number") {
      const parsed = Number(value);
      normalized[field.key] = Number.isFinite(parsed) ? parsed : Number(getDefaultConfig(type)[field.key] || 0);
    } else if (field.type === "checkbox") {
      normalized[field.key] = !!value;
    } else if (value == null) {
      normalized[field.key] = "";
    } else {
      normalized[field.key] = String(value);
    }
  }

  return normalized;
}

function validateNodeConfig(type, config) {
  const schema = getNodeSchema(type);
  const errors = {};

  for (const field of schema) {
    const value = config[field.key];

    if (field.type === "checkbox") {
      continue;
    }

    if (field.type === "text") {
      const text = String(value ?? "").trim();
      if (field.required && text.length === 0) {
        errors[field.key] = "This field is required.";
      }
      continue;
    }

    if (field.type === "number") {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        errors[field.key] = "Enter a valid number.";
        continue;
      }

      if (field.min != null && num < field.min) {
        errors[field.key] = `Must be at least ${field.min}.`;
      }
    }
  }

  return errors;
}

function renderNodeConfigForm(type, config) {
  const schema = getNodeSchema(type);
  const normalized = normalizeNodeConfig(type, config);
  const errors = validateNodeConfig(type, normalized);

  if (schema.length === 0) {
    elements.nodeConfigForm.innerHTML = '<div class="node-config-row"><label>No typed fields for this node type.</label></div>';
    elements.nodeValidationSummary.textContent = "";
    elements.nodeValidationSummary.className = "validation-summary";
    elements.nodeConfigInput.value = JSON.stringify(normalized, null, 2);
    return;
  }

  elements.nodeConfigForm.innerHTML = schema
    .map((field) => {
      const value = normalized[field.key];
      if (field.type === "checkbox") {
        return `<div class="node-config-row"><label class="checkbox-row"><input data-config-key="${field.key}" data-config-type="checkbox" type="checkbox" ${value ? "checked" : ""} /><span>${field.label}</span></label></div>`;
      }

      const attrMin = field.min != null ? ` min="${field.min}"` : "";
      const attrStep = field.step != null ? ` step="${field.step}"` : "";
      const attrPlaceholder = field.placeholder ? ` placeholder="${escapeAttr(field.placeholder)}"` : "";
      const safeValue = field.type === "number" ? String(value) : escapeAttr(String(value));
      const invalidClass = errors[field.key] ? " invalid" : "";
      const fieldError = errors[field.key]
        ? `<div class="field-error" data-error-key="${field.key}">${escapeAttr(errors[field.key])}</div>`
        : `<div class="field-error" data-error-key="${field.key}"></div>`;

      return `<div class="node-config-row"><label>${field.label}</label><input class="${invalidClass.trim()}" data-config-key="${field.key}" data-config-type="${field.type}" type="${field.type}" value="${safeValue}"${attrMin}${attrStep}${attrPlaceholder} />${fieldError}</div>`;
    })
    .join("");

  const errorCount = Object.keys(errors).length;
  if (errorCount > 0) {
    elements.nodeValidationSummary.textContent = `${errorCount} field(s) need attention before saving.`;
    elements.nodeValidationSummary.className = "validation-summary";
  } else {
    elements.nodeValidationSummary.textContent = "Config looks good.";
    elements.nodeValidationSummary.className = "validation-summary ok";
  }

  syncJsonFromTypedForm();
}

function readTypedConfigFromForm() {
  const type = elements.nodeTypeSelect.value;
  const schema = getNodeSchema(type);
  const defaults = getDefaultConfig(type);
  const next = { ...defaults };

  for (const field of schema) {
    const input = elements.nodeConfigForm.querySelector(`[data-config-key="${field.key}"]`);
    if (!input) {
      continue;
    }

    if (field.type === "checkbox") {
      next[field.key] = !!input.checked;
      continue;
    }

    const raw = input.value;
    if (field.type === "number") {
      const parsed = Number(raw);
      next[field.key] = Number.isFinite(parsed) ? parsed : Number(defaults[field.key] || 0);
    } else {
      next[field.key] = raw;
    }
  }

  return next;
}

function syncJsonFromTypedForm() {
  const type = elements.nodeTypeSelect.value;
  const config = readTypedConfigFromForm();
  elements.nodeConfigInput.value = JSON.stringify(config, null, 2);

  const errors = validateNodeConfig(type, config);
  const schema = getNodeSchema(type);
  for (const field of schema) {
    const input = elements.nodeConfigForm.querySelector(`[data-config-key="${field.key}"]`);
    const errorEl = elements.nodeConfigForm.querySelector(`[data-error-key="${field.key}"]`);
    const message = errors[field.key] || "";
    if (input) {
      input.classList.toggle("invalid", Boolean(message));
    }
    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  const errorCount = Object.keys(errors).length;
  if (errorCount > 0) {
    elements.nodeValidationSummary.textContent = `${errorCount} field(s) need attention before saving.`;
    elements.nodeValidationSummary.className = "validation-summary";
  } else {
    elements.nodeValidationSummary.textContent = "Config looks good.";
    elements.nodeValidationSummary.className = "validation-summary ok";
  }
}

function applyJsonToTypedForm() {
  let parsed;
  try {
    parsed = JSON.parse(elements.nodeConfigInput.value || "{}");
  } catch (error) {
    alert(`Config JSON is invalid: ${error.message}`);
    return false;
  }

  renderNodeConfigForm(elements.nodeTypeSelect.value, parsed);
  return true;
}

function captureGraphViewState() {
  if (!graph) {
    return;
  }

  try {
    graphViewState = {
      scale: graph.getScale(),
      position: graph.getViewPosition()
    };
  } catch {
    // Ignore graph view capture failures.
  }
}

function zoomGraph(multiplier) {
  if (!graph) {
    return;
  }

  const current = graph.getScale();
  const next = Math.max(0.2, Math.min(2.8, current * multiplier));
  graph.moveTo({
    scale: next,
    animation: {
      duration: 120,
      easingFunction: "easeInOutQuad"
    }
  });
  captureGraphViewState();
}

function fitGraph() {
  if (!graph) {
    return;
  }

  graph.fit({
    animation: {
      duration: 180,
      easingFunction: "easeInOutQuad"
    }
  });
  setTimeout(captureGraphViewState, 220);
}

function ensureEdgeIds(flow) {
  for (const edge of flow.edges) {
    if (!edge.id) {
      edge.id = buildId("edge", `${edge.from}-${edge.to}`);
    }
  }
}

function computeLevels(flow) {
  const nodeIds = flow.nodes.map((node) => node.id);
  const incoming = new Map();
  const outgoing = new Map();
  const indegree = new Map();
  const level = new Map();

  for (const nodeId of nodeIds) {
    incoming.set(nodeId, []);
    outgoing.set(nodeId, []);
    indegree.set(nodeId, 0);
    level.set(nodeId, 0);
  }

  for (const edge of flow.edges) {
    if (!incoming.has(edge.to) || !outgoing.has(edge.from)) {
      continue;
    }
    incoming.get(edge.to).push(edge.from);
    outgoing.get(edge.from).push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  }

  const queue = [];
  for (const nodeId of nodeIds) {
    if (indegree.get(nodeId) === 0) {
      queue.push(nodeId);
    }
  }

  const ordered = [];
  while (queue.length > 0) {
    const next = queue.shift();
    ordered.push(next);
    for (const child of outgoing.get(next)) {
      level.set(child, Math.max(level.get(child), level.get(next) + 1));
      indegree.set(child, indegree.get(child) - 1);
      if (indegree.get(child) === 0) {
        queue.push(child);
      }
    }
  }

  for (const nodeId of nodeIds) {
    if (!ordered.includes(nodeId)) {
      ordered.push(nodeId);
    }
  }

  return { level, ordered };
}

function computeAutoLayout(flow) {
  const { level, ordered } = computeLevels(flow);
  const byLevel = new Map();

  for (const nodeId of ordered) {
    const lv = level.get(nodeId) || 0;
    if (!byLevel.has(lv)) {
      byLevel.set(lv, []);
    }
    byLevel.get(lv).push(nodeId);
  }

  const positionMap = new Map();
  const levelKeys = Array.from(byLevel.keys()).sort((a, b) => a - b);
  for (const lv of levelKeys) {
    const ids = byLevel.get(lv);
    ids.forEach((id, index) => {
      const x = (index - (ids.length - 1) / 2) * 260;
      const y = lv * 170;
      positionMap.set(id, { x, y });
    });
  }

  return positionMap;
}

function appendLog(line) {
  logs.push(line);
  while (logs.length > 300) {
    logs.shift();
  }
  elements.logOutput.textContent = logs.join("\n");
  elements.logOutput.scrollTop = elements.logOutput.scrollHeight;
}

function currentFlow() {
  return state.flows.find((flow) => flow.id === selectedFlowId) || null;
}

function ensureSelectedFlow() {
  if (!state.flows.length) {
    selectedFlowId = null;
    state.settings.defaultFlowId = "";
    return;
  }

  if (!selectedFlowId || !state.flows.some((flow) => flow.id === selectedFlowId)) {
    selectedFlowId = state.settings.defaultFlowId && state.flows.some((flow) => flow.id === state.settings.defaultFlowId)
      ? state.settings.defaultFlowId
      : state.flows[0].id;
  }

  if (!state.settings.defaultFlowId || !state.flows.some((flow) => flow.id === state.settings.defaultFlowId)) {
    state.settings.defaultFlowId = selectedFlowId;
  }
}

function ensureSelectedNode() {
  const flow = currentFlow();
  if (!flow || flow.nodes.length === 0) {
    selectedNodeId = null;
    return;
  }

  if (!selectedNodeId || !flow.nodes.some((node) => node.id === selectedNodeId)) {
    selectedNodeId = flow.nodes[0].id;
  }
}

function renderFlowSelectors() {
  if (!state.flows.length) {
    elements.flowSelect.innerHTML = '<option value="">No flows yet</option>';
    elements.defaultFlowSelect.innerHTML = '<option value="">No default flow</option>';
    elements.flowSelect.disabled = true;
    elements.defaultFlowSelect.disabled = true;
    elements.cloneFlowBtn.disabled = true;
    elements.deleteFlowBtn.disabled = true;
    elements.autoRunCheckbox.checked = !!state.settings.autoRunOnStartup;
    return;
  }

  const flowOptions = state.flows
    .map((flow) => `<option value="${flow.id}">${flow.name}</option>`)
    .join("");

  elements.flowSelect.innerHTML = flowOptions;
  elements.defaultFlowSelect.innerHTML = flowOptions;
  elements.flowSelect.disabled = false;
  elements.defaultFlowSelect.disabled = false;
  elements.cloneFlowBtn.disabled = false;
  elements.deleteFlowBtn.disabled = false;
  elements.flowSelect.value = selectedFlowId;
  elements.defaultFlowSelect.value = state.settings.defaultFlowId || selectedFlowId;
  elements.autoRunCheckbox.checked = !!state.settings.autoRunOnStartup;
}

function renderNodeSelectors() {
  const flow = currentFlow();
  if (!flow) {
    elements.nodeSelect.innerHTML = "";
    elements.edgeFromSelect.innerHTML = '<option value="">Select</option>';
    elements.edgeToSelect.innerHTML = '<option value="">Select</option>';
    elements.nodeSelect.disabled = true;
    elements.edgeFromSelect.disabled = true;
    elements.edgeToSelect.disabled = true;
    elements.addEdgeBtn.disabled = true;
    elements.newNodeBtn.disabled = true;
    return;
  }

  elements.nodeSelect.disabled = flow.nodes.length === 0;
  elements.edgeFromSelect.disabled = flow.nodes.length === 0;
  elements.edgeToSelect.disabled = flow.nodes.length === 0;
  elements.addEdgeBtn.disabled = flow.nodes.length < 2;
  elements.newNodeBtn.disabled = false;

  const options = flow.nodes
    .map((node) => `<option value="${node.id}">${node.label || node.id}</option>`)
    .join("");

  elements.nodeSelect.innerHTML = options;
  elements.edgeFromSelect.innerHTML = `<option value="">Select</option>${options}`;
  elements.edgeToSelect.innerHTML = `<option value="">Select</option>${options}`;

  if (selectedNodeId) {
    elements.nodeSelect.value = selectedNodeId;
  }
}

function renderNodeEditor() {
  const flow = currentFlow();
  if (!flow || !selectedNodeId) {
    elements.saveNodeBtn.disabled = true;
    elements.deleteNodeBtn.disabled = true;
    elements.nodeLabelInput.value = "";
    elements.nodeTypeSelect.value = "delay";
    renderNodeConfigForm("delay", getDefaultConfig("delay"));
    return;
  }

  const node = flow.nodes.find((item) => item.id === selectedNodeId);
  if (!node) {
    elements.saveNodeBtn.disabled = true;
    elements.deleteNodeBtn.disabled = true;
    return;
  }

  elements.saveNodeBtn.disabled = false;
  elements.deleteNodeBtn.disabled = false;
  elements.nodeLabelInput.value = node.label || "";
  elements.nodeTypeSelect.value = node.type;
  renderNodeConfigForm(node.type, node.config || {});
}

function renderEdgeList() {
  const flow = currentFlow();
  if (!flow) {
    elements.edgeList.innerHTML = "";
    return;
  }

  if (flow.edges.length === 0) {
    elements.edgeList.innerHTML = '<div class="edge-row">No edges</div>';
    return;
  }

  elements.edgeList.innerHTML = flow.edges
    .map(
      (edge) =>
        `<div class="edge-row"><span>${edge.from} -> ${edge.to}</span><select data-edge-condition-id="${edge.id}"><option value="success" ${(edge.condition || "success") === "success" ? "selected" : ""}>success</option><option value="failure" ${(edge.condition || "success") === "failure" ? "selected" : ""}>failure</option><option value="always" ${(edge.condition || "success") === "always" ? "selected" : ""}>always</option></select><button data-edge-swap-id="${edge.id}">Swap</button><button data-edge-id="${edge.id}">Remove</button></div>`
    )
    .join("");
}

function nodeColorByStatus(status) {
  if (status === "running") {
    return { background: "#e8c768", border: "#f7da86" };
  }
  if (status === "success") {
    return { background: "#55c995", border: "#73dfb0" };
  }
  if (status === "failed") {
    return { background: "#d16a68", border: "#ea8f8d" };
  }
  if (status === "skipped") {
    return { background: "#667c9c", border: "#8298b7" };
  }
  return { background: "#2c476d", border: "#42638f" };
}

function renderGraph() {
  const flow = currentFlow();
  if (!flow) {
    graphViewState = {
      scale: 1,
      position: { x: 0, y: 0 }
    };
    if (graph) {
      graph.destroy();
      graph = null;
    }
    elements.graphCanvas.innerHTML = '<div class="empty-graph"><div>Create a flow and add nodes to start building your startup graph.</div><button id="start-wizard-btn" class="accent" type="button">Start first-run wizard</button></div>';
    const wizardBtn = document.getElementById("start-wizard-btn");
    if (wizardBtn) {
      wizardBtn.addEventListener("click", () => openWizardModal());
    }
    return;
  }

  elements.graphCanvas.innerHTML = "";
  ensureEdgeIds(flow);
  const autoLayout = computeAutoLayout(flow);

  const nodes = new vis.DataSet(
    flow.nodes.map((node) => {
      const status = runtime.nodeStatus[node.id] || "idle";
      const position = node.position || autoLayout.get(node.id) || { x: 0, y: 0 };
      return {
        id: node.id,
        label: `${node.label || node.id}\n[${node.type}]`,
        shape: "box",
        margin: 10,
        x: position.x,
        y: position.y,
        fixed: false,
        color: nodeColorByStatus(status),
        font: {
          color: "#e2efff",
          face: "Segoe UI",
          size: 13
        }
      };
    })
  );

  const edges = new vis.DataSet(
    flow.edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      label: edge.condition || "success",
      arrows: "to",
      width: 2,
      smooth: {
        enabled: true,
        type: "cubicBezier",
        forceDirection: "vertical",
        roundness: 0.35
      },
      color: {
        color: "#7ba6da",
        highlight: "#9ec0ea"
      },
      font: {
        color: "#eaf3ff",
        size: 13,
        face: "Segoe UI",
        background: "#274466",
        strokeWidth: 0
      }
    }))
  );

  if (graph) {
    captureGraphViewState();
    graph.destroy();
  }

  graph = new vis.Network(
    elements.graphCanvas,
    { nodes, edges },
    {
      layout: {},
      interaction: {
        dragNodes: true,
        zoomView: true,
        dragView: true,
        hover: true
      },
      physics: false,
      manipulation: {
        enabled: true,
        addNode: false,
        addEdge(edgeData, callback) {
          if (!edgeData.from || !edgeData.to || edgeData.from === edgeData.to) {
            callback(null);
            return;
          }

          const exists = flow.edges.some(
            (edge) => edge.from === edgeData.from && edge.to === edgeData.to && (edge.condition || "success") === "success"
          );
          if (!exists) {
            pushHistory();
            flow.edges.push({
              id: buildId("edge", `${edgeData.from}-${edgeData.to}`),
              from: edgeData.from,
              to: edgeData.to,
              condition: "success"
            });
          }
          callback(null);
          renderAll();
        },
        deleteNode: false,
        deleteEdge(edgeData, callback) {
          const ids = Array.isArray(edgeData.edges) ? edgeData.edges : [];
          if (ids.length > 0) {
            pushHistory();
            flow.edges = flow.edges.filter((edge) => !ids.includes(edge.id));
          }
          callback(edgeData);
          renderAll();
        }
      }
    }
  );

  graph.moveTo({
    scale: graphViewState.scale,
    position: graphViewState.position,
    animation: false
  });

  graph.on("selectNode", (params) => {
    selectedNodeId = params.nodes[0];
    renderNodeEditor();
    renderNodeSelectors();
  });

  graph.on("dragEnd", (params) => {
    if (!params.nodes || params.nodes.length === 0) {
      return;
    }

    const positions = graph.getPositions(params.nodes);
    let changed = false;
    for (const nodeId of params.nodes) {
      const node = flow.nodes.find((item) => item.id === nodeId);
      if (!node || !positions[nodeId]) {
        continue;
      }
      const nextX = Math.round(positions[nodeId].x);
      const nextY = Math.round(positions[nodeId].y);
      const prevX = node.position?.x;
      const prevY = node.position?.y;
      if (prevX !== nextX || prevY !== nextY) {
        changed = true;
      }
    }

    if (changed) {
      pushHistory();
    }

    for (const nodeId of params.nodes) {
      const node = flow.nodes.find((item) => item.id === nodeId);
      if (!node || !positions[nodeId]) {
        continue;
      }
      node.position = {
        x: Math.round(positions[nodeId].x),
        y: Math.round(positions[nodeId].y)
      };
    }
  });

  graph.on("zoom", () => {
    captureGraphViewState();
  });

  graph.on("dragging", () => {
    captureGraphViewState();
  });
}

function renderRuntime() {
  const flow = currentFlow();

  if (runtime.running) {
    elements.runtimeChip.textContent = `Running ${runtime.flowId || ""}`;
    elements.runtimeChip.className = "chip running";
    elements.runFlowBtn.disabled = true;
    elements.stopFlowBtn.disabled = false;
    elements.validateFlowBtn.disabled = true;
    return;
  }

  elements.runFlowBtn.disabled = !flow;
  elements.stopFlowBtn.disabled = true;
  elements.validateFlowBtn.disabled = !flow;

  if (runtime.failed) {
    elements.runtimeChip.textContent = "Last run failed";
    elements.runtimeChip.className = "chip failed";
  } else {
    elements.runtimeChip.textContent = "Idle";
    elements.runtimeChip.className = "chip idle";
  }
}

function renderAll() {
  ensureSelectedFlow();
  const flow = currentFlow();
  if (flow) {
    ensureEdgeIds(flow);
  }
  ensureSelectedNode();
  renderFlowSelectors();
  renderNodeSelectors();
  renderNodeEditor();
  renderEdgeList();
  renderGraph();
  renderRuntime();
  updateHistoryButtons();
}

function createFlowWithName(name) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) {
    return;
  }

  pushHistory();
  const id = buildId("flow", trimmedName);
  state.flows.push({
    id,
    name: trimmedName,
    description: "",
    nodes: [],
    edges: []
  });
  selectedFlowId = id;
  if (!state.settings.defaultFlowId) {
    state.settings.defaultFlowId = id;
  }
  renderAll();
}

function openFlowModal(defaultName = "New Flow") {
  elements.flowModalName.value = defaultName;
  elements.flowModal.showModal();
  setTimeout(() => elements.flowModalName.focus(), 0);
}

function openWizardModal() {
  elements.wizardFlowName.value = "My Startup Flow";
  elements.wizardAddNode.checked = true;
  elements.wizardNodeLabel.value = "Start app";
  elements.wizardNodeType.value = "start_process";
  elements.wizardNodeFields.style.display = "block";
  elements.wizardModal.showModal();
}

function runFirstRunWizard() {
  const flowName = elements.wizardFlowName.value.trim();
  if (!flowName) {
    alert("Flow name is required.");
    return;
  }

  createFlowWithName(flowName);

  if (elements.wizardAddNode.checked) {
    const flow = currentFlow();
    if (flow) {
      const nodeType = elements.wizardNodeType.value;
      const label = elements.wizardNodeLabel.value.trim() || nodeType;
      const id = buildId("node", label);
      flow.nodes.push({
        id,
        type: nodeType,
        label,
        config: getDefaultConfig(nodeType)
      });
      selectedNodeId = id;
    }
  }

  elements.wizardModal.close();
  renderAll();
}

function cloneFlow() {
  const flow = currentFlow();
  if (!flow) {
    return;
  }

  pushHistory();
  const id = buildId("flow", `${flow.name}-copy`);
  const next = clone(flow);
  next.id = id;
  next.name = `${flow.name} (copy)`;
  state.flows.push(next);
  selectedFlowId = id;
  renderAll();
}

function deleteFlow() {
  const flow = currentFlow();
  if (!flow) {
    return;
  }

  if (!confirm(`Delete flow '${flow.name}'?`)) {
    return;
  }

  pushHistory();
  state.flows = state.flows.filter((item) => item.id !== flow.id);
  if (state.flows.length === 0) {
    state.settings.defaultFlowId = "";
    selectedFlowId = null;
    selectedNodeId = null;
    renderAll();
    return;
  }

  if (state.settings.defaultFlowId === flow.id) {
    state.settings.defaultFlowId = state.flows[0].id;
  }
  selectedFlowId = state.flows[0].id;
  selectedNodeId = null;
  renderAll();
}

function createNode(type, label) {
  const flow = currentFlow();
  if (!flow) {
    return;
  }

  const trimmedLabel = String(label || "").trim();
  if (!trimmedLabel) {
    return;
  }

  pushHistory();
  const id = buildId("node", trimmedLabel);
  flow.nodes.push({
    id,
    type,
    label: trimmedLabel,
    config: getDefaultConfig(type)
  });

  selectedNodeId = id;
  renderAll();
}

function openNodeModal() {
  const currentType = elements.nodeTypeSelect.value || "delay";
  elements.nodeModalType.value = currentType;
  elements.nodeModalLabel.value = currentType;
  elements.nodeModal.showModal();
  setTimeout(() => elements.nodeModalLabel.focus(), 0);
}

function saveNode() {
  const flow = currentFlow();
  if (!flow || !selectedNodeId) {
    return;
  }

  const node = flow.nodes.find((item) => item.id === selectedNodeId);
  if (!node) {
    return;
  }

  if (elements.advancedConfigDetails.open) {
    const ok = applyJsonToTypedForm();
    if (!ok) {
      return;
    }
  }

  const nextType = elements.nodeTypeSelect.value;
  let parsedConfig = readTypedConfigFromForm();
  const configErrors = validateNodeConfig(nextType, parsedConfig);
  if (Object.keys(configErrors).length > 0) {
    renderNodeConfigForm(nextType, parsedConfig);
    alert("Please fix validation errors before saving this node.");
    return;
  }

  pushHistory();
  node.label = elements.nodeLabelInput.value || node.label;
  if (node.type !== nextType) {
    node.type = nextType;
    parsedConfig = normalizeNodeConfig(nextType, parsedConfig);
  }
  node.config = parsedConfig;
  renderAll();
}

function deleteNode() {
  const flow = currentFlow();
  if (!flow || !selectedNodeId) {
    return;
  }

  pushHistory();
  flow.nodes = flow.nodes.filter((node) => node.id !== selectedNodeId);
  flow.edges = flow.edges.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId);
  selectedNodeId = null;
  renderAll();
}

function addEdge() {
  const flow = currentFlow();
  if (!flow) {
    return;
  }

  const from = elements.edgeFromSelect.value;
  const to = elements.edgeToSelect.value;
  const condition = elements.edgeConditionSelect.value;

  if (!from || !to) {
    alert("Please select both source and target nodes.");
    return;
  }
  if (from === to) {
    alert("Source and target must be different.");
    return;
  }

  const exists = flow.edges.some(
    (edge) => edge.from === from && edge.to === to && (edge.condition || "success") === condition
  );
  if (exists) {
    alert("This edge already exists.");
    return;
  }

  pushHistory();
  flow.edges.push({
    id: buildId("edge", `${from}-${to}`),
    from,
    to,
    condition
  });
  renderAll();
}

async function saveStateToDisk() {
  state.settings.defaultFlowId = elements.defaultFlowSelect.value || "";
  state.settings.autoRunOnStartup = elements.autoRunCheckbox.checked;
  state = await api.saveState(state);
  appendLog(`[${new Date().toISOString()}] Saved state`);
  renderAll();
}

function bindEvents() {
  elements.flowSelect.addEventListener("change", () => {
    selectedFlowId = elements.flowSelect.value;
    selectedNodeId = null;
    renderAll();
  });

  elements.defaultFlowSelect.addEventListener("change", () => {
    pushHistory();
    state.settings.defaultFlowId = elements.defaultFlowSelect.value;
    renderAll();
  });

  elements.autoRunCheckbox.addEventListener("change", () => {
    pushHistory();
    state.settings.autoRunOnStartup = elements.autoRunCheckbox.checked;
  });

  elements.undoBtn.addEventListener("click", undo);
  elements.redoBtn.addEventListener("click", redo);
  elements.zoomInBtn.addEventListener("click", () => zoomGraph(1.15));
  elements.zoomOutBtn.addEventListener("click", () => zoomGraph(1 / 1.15));
  elements.fitGraphBtn.addEventListener("click", fitGraph);

  elements.newFlowBtn.addEventListener("click", () => openFlowModal("New Flow"));
  elements.cloneFlowBtn.addEventListener("click", cloneFlow);
  elements.deleteFlowBtn.addEventListener("click", deleteFlow);

  elements.newNodeBtn.addEventListener("click", openNodeModal);
  elements.saveNodeBtn.addEventListener("click", saveNode);
  elements.deleteNodeBtn.addEventListener("click", deleteNode);

  elements.flowModalCancel.addEventListener("click", () => elements.flowModal.close());
  elements.flowModalCreate.addEventListener("click", () => {
    const name = elements.flowModalName.value.trim();
    if (!name) {
      alert("Flow name is required.");
      return;
    }
    createFlowWithName(name);
    elements.flowModal.close();
  });

  elements.nodeModalCancel.addEventListener("click", () => elements.nodeModal.close());
  elements.nodeModalCreate.addEventListener("click", () => {
    const label = elements.nodeModalLabel.value.trim();
    const type = elements.nodeModalType.value;
    if (!label) {
      alert("Node label is required.");
      return;
    }
    createNode(type, label);
    elements.nodeModal.close();
  });

  elements.wizardCancel.addEventListener("click", () => elements.wizardModal.close());
  elements.wizardCreate.addEventListener("click", runFirstRunWizard);
  elements.wizardAddNode.addEventListener("change", () => {
    elements.wizardNodeFields.style.display = elements.wizardAddNode.checked ? "block" : "none";
  });

  elements.nodeSelect.addEventListener("change", () => {
    selectedNodeId = elements.nodeSelect.value || null;
    renderNodeEditor();
  });

  elements.nodeTypeSelect.addEventListener("change", () => {
    const nextType = elements.nodeTypeSelect.value;
    if (!selectedNodeId) {
      renderNodeConfigForm(nextType, getDefaultConfig(nextType));
      return;
    }

    const flow = currentFlow();
    const node = flow?.nodes.find((item) => item.id === selectedNodeId);
    const currentConfig = node?.config || {};
    renderNodeConfigForm(nextType, normalizeNodeConfig(nextType, currentConfig));
  });

  elements.nodeConfigForm.addEventListener("input", () => {
    syncJsonFromTypedForm();
  });

  elements.applyJsonBtn.addEventListener("click", () => {
    applyJsonToTypedForm();
  });

  elements.addEdgeBtn.addEventListener("click", addEdge);

  elements.edgeList.addEventListener("click", (event) => {
    const removeEdgeId = event.target.getAttribute("data-edge-id");
    const swapEdgeId = event.target.getAttribute("data-edge-swap-id");
    if (!removeEdgeId && !swapEdgeId) {
      return;
    }

    const flow = currentFlow();
    if (!flow) {
      return;
    }

    if (removeEdgeId) {
      pushHistory();
      flow.edges = flow.edges.filter((edge) => edge.id !== removeEdgeId);
      renderAll();
      return;
    }

    if (swapEdgeId) {
      const edge = flow.edges.find((item) => item.id === swapEdgeId);
      if (!edge) {
        return;
      }
      pushHistory();
      const prevFrom = edge.from;
      edge.from = edge.to;
      edge.to = prevFrom;
      renderAll();
    }
  });

  elements.edgeList.addEventListener("change", (event) => {
    const edgeId = event.target.getAttribute("data-edge-condition-id");
    if (!edgeId) {
      return;
    }

    const flow = currentFlow();
    if (!flow) {
      return;
    }

    const edge = flow.edges.find((item) => item.id === edgeId);
    if (!edge) {
      return;
    }

    const nextCondition = String(event.target.value || "success");
    if ((edge.condition || "success") === nextCondition) {
      return;
    }

    pushHistory();
    edge.condition = nextCondition;
    renderAll();
  });

  elements.runFlowBtn.addEventListener("click", async () => {
    const flow = currentFlow();
    if (!flow) {
      return;
    }

    try {
      await api.runFlow(flow.id);
    } catch (error) {
      alert(error.message || String(error));
    }
  });

  elements.stopFlowBtn.addEventListener("click", async () => {
    await api.stopFlow();
  });

  elements.validateFlowBtn.addEventListener("click", async () => {
    const flow = currentFlow();
    if (!flow) {
      return;
    }
    const result = await api.validateFlow(flow.id);
    if (result.ok) {
      alert("Flow is valid.");
      return;
    }
    alert(`Flow is invalid:\n\n${result.errors.join("\n")}`);
  });

  elements.saveStateBtn.addEventListener("click", saveStateToDisk);

  elements.installTaskBtn.addEventListener("click", async () => {
    try {
      const result = await api.installStartupTask();
      appendLog(`[${new Date().toISOString()}] Installed task '${result.taskName}'`);
      alert("Task Scheduler entry created or updated.");
    } catch (error) {
      alert(`Failed to install task: ${error.message}`);
    }
  });

  elements.helpBtn.addEventListener("click", () => api.openRepo());
  elements.repoLinkBtn.addEventListener("click", () => api.openRepo());

  elements.donateBtn.addEventListener("click", () => api.openDonation());

  elements.clearLogsBtn.addEventListener("click", () => {
    logs.length = 0;
    elements.logOutput.textContent = "";
  });

  document.addEventListener("keydown", (event) => {
    const meta = event.ctrlKey || event.metaKey;
    if (!meta) {
      return;
    }

    if (event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      undo();
      return;
    }

    if ((event.key.toLowerCase() === "y") || (event.key.toLowerCase() === "z" && event.shiftKey)) {
      event.preventDefault();
      redo();
    }
  });
}

function subscribeRuntime() {
  api.onRunLog((line) => {
    appendLog(line);
  });

  api.onRunState((next) => {
    runtime = {
      ...runtime,
      ...next,
      nodeStatus: next.nodeStatus || runtime.nodeStatus || {}
    };
    renderRuntime();
    renderGraph();
  });

  api.onNodeState((nodeEvent) => {
    runtime.nodeStatus = {
      ...runtime.nodeStatus,
      [nodeEvent.nodeId]: nodeEvent.status
    };
    renderGraph();
  });
}

async function init() {
  state = await api.getState();
  runtime = await api.getRuntimeStatus();
  bindEvents();
  subscribeRuntime();
  renderAll();
  if (!state.flows.length) {
    setTimeout(() => openWizardModal(), 150);
  }
  appendLog(`[${new Date().toISOString()}] GUI ready`);
}

init();
