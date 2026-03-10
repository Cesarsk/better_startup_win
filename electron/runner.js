const { EventEmitter } = require("node:events");
const { spawn } = require("node:child_process");
const path = require("node:path");

function nowStamp() {
  return new Date().toISOString();
}

function quotePs(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function sleep(ms, token) {
  return new Promise((resolve, reject) => {
    let interval = null;
    const timer = setTimeout(() => {
      if (interval) {
        clearInterval(interval);
      }
      resolve();
    }, ms);

    if (!token) {
      return;
    }

    interval = setInterval(() => {
      if (token.cancelled) {
        clearTimeout(timer);
        clearInterval(interval);
        reject(new Error("Execution cancelled"));
      }
    }, 100);
  });
}

function runPowerShell(command, timeoutMs = 0) {
  return new Promise((resolve, reject) => {
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      command
    ];

    const proc = spawn("powershell.exe", args, {
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let done = false;
    let timeout = null;

    if (timeoutMs > 0) {
      timeout = setTimeout(() => {
        if (!done) {
          done = true;
          proc.kill();
          reject(new Error(`PowerShell command timed out after ${timeoutMs} ms`));
        }
      }, timeoutMs);
    }

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    proc.on("error", (error) => {
      if (done) {
        return;
      }
      done = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      reject(error);
    });

    proc.on("close", (code) => {
      if (done) {
        return;
      }
      done = true;
      if (timeout) {
        clearTimeout(timeout);
      }

      if (code !== 0) {
        reject(new Error(stderr.trim() || `PowerShell exited with code ${code}`));
        return;
      }

      resolve(stdout.trim());
    });
  });
}

function runCommand(command, args = [], wait = true) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      windowsHide: true,
      shell: false,
      detached: !wait
    });

    proc.on("error", (error) => reject(error));

    if (!wait) {
      proc.unref();
      resolve(0);
      return;
    }

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${path.basename(command)} exited with code ${code}`));
        return;
      }
      resolve(code);
    });
  });
}

function normalizeCondition(condition) {
  const c = String(condition || "success").toLowerCase();
  if (c === "success" || c === "failure" || c === "always") {
    return c;
  }
  return "success";
}

function buildGraph(flow) {
  const nodeMap = new Map();
  for (const node of flow.nodes) {
    nodeMap.set(node.id, node);
  }

  const incoming = new Map();
  const outgoing = new Map();
  for (const node of flow.nodes) {
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  }

  for (const edge of flow.edges) {
    incoming.get(edge.to).push(edge);
    outgoing.get(edge.from).push(edge);
  }

  return { nodeMap, incoming, outgoing };
}

function topologicalSort(flow) {
  const { incoming, outgoing } = buildGraph(flow);
  const indegree = new Map();
  for (const node of flow.nodes) {
    indegree.set(node.id, incoming.get(node.id).length);
  }

  const queue = [];
  for (const node of flow.nodes) {
    if (indegree.get(node.id) === 0) {
      queue.push(node.id);
    }
  }

  const ordered = [];
  while (queue.length > 0) {
    const next = queue.shift();
    ordered.push(next);
    for (const edge of outgoing.get(next)) {
      indegree.set(edge.to, indegree.get(edge.to) - 1);
      if (indegree.get(edge.to) === 0) {
        queue.push(edge.to);
      }
    }
  }

  return ordered;
}

function validateFlow(flow) {
  const errors = [];

  if (!flow || !Array.isArray(flow.nodes) || flow.nodes.length === 0) {
    errors.push("Flow must contain at least one node.");
    return { ok: false, errors };
  }

  if (!Array.isArray(flow.edges)) {
    errors.push("Flow edges must be an array.");
    return { ok: false, errors };
  }

  const seen = new Set();
  for (const node of flow.nodes) {
    if (!node.id) {
      errors.push("A node is missing its id.");
      continue;
    }
    if (seen.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    }
    seen.add(node.id);
  }

  for (const edge of flow.edges) {
    if (!seen.has(edge.from)) {
      errors.push(`Edge source not found: ${edge.from}`);
    }
    if (!seen.has(edge.to)) {
      errors.push(`Edge target not found: ${edge.to}`);
    }
    if (edge.from === edge.to) {
      errors.push(`Self-edge is not allowed for node ${edge.from}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const ordered = topologicalSort(flow);
  if (ordered.length !== flow.nodes.length) {
    errors.push("Flow must be a DAG (cycle detected).");
  }

  return {
    ok: errors.length === 0,
    errors,
    ordered
  };
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
      return {
        edidName: "XENEON EDGE",
        pollSeconds: 10,
        timeoutSeconds: 600
      };
    default:
      return {};
  }
}

class FlowRunner extends EventEmitter {
  constructor() {
    super();
    this._running = false;
    this._token = null;
  }

  isRunning() {
    return this._running;
  }

  stop() {
    if (this._token) {
      this._token.cancelled = true;
      this.log("Stop requested");
    }
  }

  log(message) {
    this.emit("log", `[${nowStamp()}] ${message}`);
  }

  async run(flow) {
    if (this._running) {
      throw new Error("Another flow is already running.");
    }

    const validation = validateFlow(flow);
    if (!validation.ok) {
      throw new Error(validation.errors.join("\n"));
    }

    this._running = true;
    this._token = { cancelled: false };
    const { incoming, nodeMap } = buildGraph(flow);
    const statusByNode = {};
    const ordered = validation.ordered;

    this.emit("state", { running: true, flowId: flow.id });
    this.log(`Flow started: ${flow.name || flow.id}`);

    try {
      for (const nodeId of ordered) {
        if (this._token.cancelled) {
          throw new Error("Execution cancelled");
        }

        const node = nodeMap.get(nodeId);
        const parents = incoming.get(nodeId);
        let shouldRun = true;

        if (parents.length > 0) {
          shouldRun = parents.every((edge) => {
            const parentStatus = statusByNode[edge.from] || "skipped";
            const condition = normalizeCondition(edge.condition);
            if (condition === "always") {
              return parentStatus === "success" || parentStatus === "failed";
            }
            if (condition === "failure") {
              return parentStatus === "failed";
            }
            return parentStatus === "success";
          });
        }

        if (!shouldRun) {
          statusByNode[node.id] = "skipped";
          this.log(`Node skipped: ${node.label || node.id}`);
          this.emit("node", {
            nodeId: node.id,
            status: "skipped"
          });
          continue;
        }

        this.log(`Node start: ${node.label || node.id} (${node.type})`);
        this.emit("node", {
          nodeId: node.id,
          status: "running"
        });

        try {
          await this.executeNode(node, this._token);
          statusByNode[node.id] = "success";
          this.log(`Node success: ${node.label || node.id}`);
          this.emit("node", {
            nodeId: node.id,
            status: "success"
          });
        } catch (error) {
          statusByNode[node.id] = "failed";
          this.log(`Node failed: ${node.label || node.id}: ${error.message}`);
          this.emit("node", {
            nodeId: node.id,
            status: "failed",
            error: error.message
          });
        }
      }

      if (this._token.cancelled) {
        this.log("Flow cancelled");
        this.emit("state", { running: false, cancelled: true });
        return;
      }

      const hasFailure = Object.values(statusByNode).includes("failed");
      this.log(hasFailure ? "Flow completed with failures" : "Flow completed successfully");
      this.emit("state", {
        running: false,
        cancelled: false,
        failed: hasFailure,
        nodeStatus: statusByNode
      });
    } finally {
      this._running = false;
      this._token = null;
    }
  }

  async executeNode(node, token) {
    const cfg = { ...getDefaultConfig(node.type), ...(node.config || {}) };

    switch (node.type) {
      case "delay": {
        const ms = Number(cfg.milliseconds || 0);
        if (ms < 0) {
          throw new Error("Delay milliseconds must be >= 0");
        }
        await sleep(ms, token);
        return;
      }

      case "start_process": {
        if (!cfg.path) {
          throw new Error("Missing executable path");
        }
        const argPart = cfg.args ? ` -ArgumentList '${quotePs(cfg.args)}'` : "";
        const wdPart = cfg.workingDirectory ? ` -WorkingDirectory '${quotePs(cfg.workingDirectory)}'` : "";
        await runPowerShell(`Start-Process -FilePath '${quotePs(cfg.path)}'${argPart}${wdPart}`, 15000);
        return;
      }

      case "stop_process": {
        if (!cfg.processName) {
          throw new Error("Missing processName");
        }
        await runPowerShell(
          `$p = Get-Process -Name '${quotePs(cfg.processName)}' -ErrorAction SilentlyContinue; if ($p) { $p | Stop-Process -Force -ErrorAction SilentlyContinue; Write-Output 'stopped' } else { Write-Output 'not-running' }`,
          15000
        );
        return;
      }

      case "close_window": {
        if (!cfg.processName) {
          throw new Error("Missing processName");
        }
        const waitMs = Number(cfg.waitMilliseconds || 0);
        if (waitMs > 0) {
          await sleep(waitMs, token);
        }
        await runPowerShell(
          `(Get-Process -Name '${quotePs(cfg.processName)}' -ErrorAction SilentlyContinue).ForEach({ $_.CloseMainWindow() | Out-Null })`,
          15000
        );
        return;
      }

      case "run_script": {
        if (!cfg.path) {
          throw new Error("Missing script path");
        }

        const waitForExit = cfg.waitForExit !== false;
        const extension = path.extname(cfg.path).toLowerCase();
        if (extension === ".ps1") {
          const args = [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            cfg.path
          ];
          if (cfg.args) {
            args.push(...String(cfg.args).split(" ").filter(Boolean));
          }
          await runCommand("powershell.exe", args, waitForExit);
          return;
        }

        if (extension === ".bat" || extension === ".cmd") {
          const cmdArgs = ["/c", cfg.path];
          if (cfg.args) {
            cmdArgs.push(...String(cfg.args).split(" ").filter(Boolean));
          }
          await runCommand("cmd.exe", cmdArgs, waitForExit);
          return;
        }

        const exeArgs = cfg.args ? String(cfg.args).split(" ").filter(Boolean) : [];
        await runCommand(cfg.path, exeArgs, waitForExit);
        return;
      }

      case "wait_display": {
        const timeoutSeconds = Number(cfg.timeoutSeconds || 300);
        const pollSeconds = Number(cfg.pollSeconds || 5);
        const started = Date.now();

        while (Date.now() - started < timeoutSeconds * 1000) {
          if (token.cancelled) {
            throw new Error("Execution cancelled");
          }

          const output = await runPowerShell(
            `$c = Get-CimInstance -ClassName Win32_VideoController | Where-Object { $_.Name -like '${quotePs(cfg.adapterNameLike || "*")}' -and $_.CurrentHorizontalResolution -and $_.CurrentVerticalResolution -and $_.CurrentRefreshRate } | Select-Object -First 1 Name,CurrentHorizontalResolution,CurrentVerticalResolution,CurrentRefreshRate; if ($null -eq $c) { Write-Output '' } else { $c | ConvertTo-Json -Compress }`,
            15000
          );

          if (output) {
            try {
              const parsed = JSON.parse(output);
              const width = Number(parsed.CurrentHorizontalResolution || 0);
              const height = Number(parsed.CurrentVerticalResolution || 0);
              const refresh = Number(parsed.CurrentRefreshRate || 0);
              if (
                width === Number(cfg.width) &&
                height === Number(cfg.height) &&
                refresh === Number(cfg.refresh)
              ) {
                return;
              }
            } catch {
              // Ignore parse errors while polling.
            }
          }

          await sleep(pollSeconds * 1000, token);
        }

        throw new Error("Timeout waiting for display target");
      }

      case "wait_monitor": {
        const timeoutSeconds = Number(cfg.timeoutSeconds || 600);
        const pollSeconds = Number(cfg.pollSeconds || 5);
        const started = Date.now();

        while (Date.now() - started < timeoutSeconds * 1000) {
          if (token.cancelled) {
            throw new Error("Execution cancelled");
          }

          const output = await runPowerShell(
            `Get-CimInstance -Namespace root\\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue | ForEach-Object { ($_.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '' }`,
            15000
          );

          const names = output
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          if (names.some((name) => name.toLowerCase().includes(String(cfg.edidName || "").toLowerCase()))) {
            return;
          }

          await sleep(pollSeconds * 1000, token);
        }

        throw new Error("Timeout waiting for monitor target");
      }

      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }
  }
}

module.exports = {
  FlowRunner,
  validateFlow,
  getDefaultConfig
};
