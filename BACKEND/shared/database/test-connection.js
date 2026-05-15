const { closeDatabase, query } = require("./index");

async function main() {
  try {
    const result = await query(`
      SELECT
        DB_NAME() AS databaseName,
        @@SERVERNAME AS serverName,
        GETDATE() AS serverTime
    `);

    console.log("SQL Server connection successful:");
    console.table(result.recordset);
  } catch (error) {
    console.error("SQL Server connection failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
