const sqlServer = require("./sqlServer");

module.exports = {
  closeDatabase: sqlServer.closeSqlServerPool,
  getDatabasePool: sqlServer.getSqlServerPool,
  query: sqlServer.query,
  sqlServer,
};
