const fs = require("node:fs");
const path = require("node:path");
const { app } = require("electron");
const defaultState = require("./default-state");

const LEGACY_DONATION_URL = "https://github.com/sponsors/Cesarsk";

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function getStateFilePath() {
  if (process.env.BETTER_STARTUP_STATE_FILE) {
    return process.env.BETTER_STARTUP_STATE_FILE;
  }

  const baseDir = app.getPath("userData");
  return path.join(baseDir, "state.json");
}

function ensureParentDirectory(filePath) {
  const parent = path.dirname(filePath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
}

function loadState() {
  const filePath = getStateFilePath();
  ensureParentDirectory(filePath);

  if (!fs.existsSync(filePath)) {
    const freshState = cloneDefaultState();
    saveState(freshState);
    return freshState;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed.settings || !parsed.flows) {
    const upgraded = {
      ...cloneDefaultState(),
      ...parsed
    };
    saveState(upgraded);
    return upgraded;
  }

  if (!parsed.settings.donationUrl || parsed.settings.donationUrl === LEGACY_DONATION_URL) {
    parsed.settings.donationUrl = defaultState.settings.donationUrl;
    saveState(parsed);
  }

  if (!parsed.settings.repoUrl) {
    parsed.settings.repoUrl = defaultState.settings.repoUrl;
    saveState(parsed);
  }

  return parsed;
}

function saveState(state) {
  const filePath = getStateFilePath();
  ensureParentDirectory(filePath);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

module.exports = {
  getStateFilePath,
  loadState,
  saveState
};
