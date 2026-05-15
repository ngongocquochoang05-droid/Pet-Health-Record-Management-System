const reportService = require("../services/reportService");

async function getSummary({ response, sendJson }) {
  sendJson(response, 200, {
    success: true,
    data: await reportService.getSummary(),
  });
}

module.exports = {
  getSummary,
};
