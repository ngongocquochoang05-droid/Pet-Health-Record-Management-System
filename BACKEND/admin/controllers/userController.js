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

async function createUser({ response, sendJson, parseJsonRequest, request }) {
  const payload = await parseJsonRequest(request);

  sendJson(response, 201, {
    success: true,
    data: await userService.createUser(payload),
  });
}

async function updateUser({ response, sendJson, parseJsonRequest, request }, id) {
  const payload = await parseJsonRequest(request);

  sendJson(response, 200, {
    success: true,
    data: await userService.updateUser(id, payload),
  });
}

async function deleteUser({ response, sendJson }, id) {
  sendJson(response, 200, {
    success: true,
    data: await userService.deleteUser(id),
  });
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
