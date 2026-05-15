const fs = require("fs");
const path = require("path");

const backendRoot = path.resolve(__dirname, "..", "..");
const envPath = path.join(backendRoot, ".env");
let loaded = false;

function parseEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadBackendEnv() {
  if (loaded) {
    return;
  }

  loaded = true;

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  lines.forEach((line) => {
    const parsed = parseEnvLine(line);

    if (!parsed || process.env[parsed.key] !== undefined) {
      return;
    }

    process.env[parsed.key] = parsed.value;
  });
}

function getEnv(key, fallbackValue = "") {
  loadBackendEnv();
  return process.env[key] ?? fallbackValue;
}

function getBooleanEnv(key, fallbackValue = false) {
  const value = getEnv(key, String(fallbackValue)).toLowerCase();
  return ["1", "true", "yes", "on"].includes(value);
}

function getNumberEnv(key, fallbackValue) {
  const value = Number(getEnv(key, String(fallbackValue)));
  return Number.isFinite(value) ? value : fallbackValue;
}

module.exports = {
  getBooleanEnv,
  getEnv,
  getNumberEnv,
  loadBackendEnv,
};
