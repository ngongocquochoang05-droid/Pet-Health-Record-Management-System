const staffService = require("../services/staffService");

async function listStaff({ response, requestUrl, sendJson }) {
  sendJson(response, 200, {
    success: true,
    data: await staffService.listStaff(Object.fromEntries(requestUrl.searchParams)),
  });
}

async function getStaffMember({ response, sendJson }, id) {
  sendJson(response, 200, {
    success: true,
    data: await staffService.getStaffMemberById(id),
  });
}

async function createStaffMember({ response, sendJson, parseJsonRequest, request }) {
  const payload = await parseJsonRequest(request);

  sendJson(response, 201, {
    success: true,
    data: await staffService.createStaffMember(payload),
  });
}

async function updateStaffMember({ response, sendJson, parseJsonRequest, request }, id) {
  const payload = await parseJsonRequest(request);

  sendJson(response, 200, {
    success: true,
    data: await staffService.updateStaffMember(id, payload),
  });
}

async function deleteStaffMember({ response, sendJson }, id) {
  sendJson(response, 200, {
    success: true,
    data: await staffService.deleteStaffMember(id),
  });
}

module.exports = {
  listStaff,
  getStaffMember,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
};
