const userService = require("../services/userService");

async function listUsers({ response, requestUrl, sendJson }) {
  sendJson(response, 200, {
    success: true,
    data: await userService.listUsers(Object.fromEntries(requestUrl.searchParams)),
  });
}

async function getUser({ response, sendJson }, id) {
  sendJson(response, 200, {
    success: true,
    data: await userService.getUserById(id),
  });
}

async function updateUserRole({ response, sendJson, parseJsonRequest, request }, id) {
  const payload = await parseJsonRequest(request);
  sendJson(response, 200, {
    success: true,
    data: await userService.updateRole(id, payload.role),
  });
}

async function lockUser({ response, sendJson }, id) {
  sendJson(response, 200, {
    success: true,
    data: await userService.setUserActive(id, false),
  });
}

async function unlockUser({ response, sendJson }, id) {
  sendJson(response, 200, {
    success: true,
    data: await userService.setUserActive(id, true),
  });
}

module.exports = {
  listUsers,
  getUser,
  updateUserRole,
  lockUser,
  unlockUser,
};
