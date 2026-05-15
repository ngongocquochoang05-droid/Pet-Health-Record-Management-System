const { getBooleanEnv, getEnv, getNumberEnv } = require("../config/env");

let sql;
let poolPromise;

function getSqlPackage() {
  if (!sql) {
    try {
      sql = require("mssql");
    } catch (error) {
      throw new Error(
        "Missing dependency 'mssql'. Run 'cd BACKEND' then 'npm install' before connecting to SQL Server."
      );
    }
  }

  return sql;
}

function buildSqlServerConfig() {
  const server = getEnv("SQLSERVER_HOST", "localhost");
  const instanceName = getEnv("SQLSERVER_INSTANCE");
  const port = getNumberEnv("SQLSERVER_PORT", 0);
  const database = getEnv("SQLSERVER_DATABASE", "PetHealth");
  const user = getEnv("SQLSERVER_USER");
  const password = getEnv("SQLSERVER_PASSWORD");

  if (!database) {
    throw new Error("Missing SQLSERVER_DATABASE in BACKEND/.env.");
  }

  if (!user || !password) {
    throw new Error(
      "Missing SQLSERVER_USER or SQLSERVER_PASSWORD in BACKEND/.env. Create a SQL Server login or fill these values before running backend code."
    );
  }

  const config = {
    server,
    database,
    user,
    password,
    options: {
      encrypt: getBooleanEnv("SQLSERVER_ENCRYPT", false),
      trustServerCertificate: getBooleanEnv("SQLSERVER_TRUST_SERVER_CERTIFICATE", true),
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  if (instanceName) {
    config.options.instanceName = instanceName;
  } else if (port) {
    config.port = port;
  }

  return config;
}

async function getSqlServerPool() {
  if (!poolPromise) {
    const sqlPackage = getSqlPackage();
    poolPromise = sqlPackage.connect(buildSqlServerConfig());
  }

  return poolPromise;
}

async function query(sqlText, parameters = {}) {
  const pool = await getSqlServerPool();
  const request = pool.request();

  Object.entries(parameters).forEach(([name, value]) => {
    request.input(name, value);
  });

  return request.query(sqlText);
}

async function closeSqlServerPool() {
  if (!poolPromise) {
    return;
  }

  const pool = await poolPromise;
  await pool.close();
  poolPromise = null;
}

module.exports = {
  buildSqlServerConfig,
  closeSqlServerPool,
  getSqlServerPool,
  query,
};
