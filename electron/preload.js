const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("startupApi", {
  getState: () => ipcRenderer.invoke("state:get"),
  saveState: (state) => ipcRenderer.invoke("state:save", state),
  runFlow: (flowId) => ipcRenderer.invoke("flow:run", flowId),
  stopFlow: () => ipcRenderer.invoke("flow:stop"),
  validateFlow: (flowId) => ipcRenderer.invoke("flow:validate", flowId),
  openRepo: () => ipcRenderer.invoke("app:open-repo"),
  openDonation: () => ipcRenderer.invoke("app:open-donation"),
  installStartupTask: () => ipcRenderer.invoke("task:install"),
  getRuntimeStatus: () => ipcRenderer.invoke("runtime:status"),
  onRunLog: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on("run:log", handler);
    return () => ipcRenderer.removeListener("run:log", handler);
  },
  onRunState: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on("run:state", handler);
    return () => ipcRenderer.removeListener("run:state", handler);
  },
  onNodeState: (callback) => {
    const handler = (_, payload) => callback(payload);
    ipcRenderer.on("run:node", handler);
    return () => ipcRenderer.removeListener("run:node", handler);
  }
});
