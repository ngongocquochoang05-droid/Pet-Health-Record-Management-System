const systemService = require("../services/systemService");

function getHealth({ response, sendJson }) {
  sendJson(response, 200, {
    success: true,
    data: systemService.getHealth(),
  });
}

async function getDashboard({ response, sendJson }) {
  sendJson(response, 200, {
    success: true,
    data: await systemService.getDashboard(),
  });
}

module.exports = {
  getHealth,
  getDashboard,
};
