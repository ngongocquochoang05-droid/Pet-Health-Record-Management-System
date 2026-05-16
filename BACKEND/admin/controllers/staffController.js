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

async function updateStaffMember({ response, sendJson, parseJsonRequest, request }, id) {
  const payload = await parseJsonRequest(request);
  sendJson(response, 200, {
    success: true,
    data: await staffService.updateStaffMember(id, payload),
  });
}

async function setStaffAvailability({ response, sendJson, parseJsonRequest, request }, id) {
  const payload = await parseJsonRequest(request);
  sendJson(response, 200, {
    success: true,
    data: await staffService.setStaffAvailability(id, payload.status),
  });
}

module.exports = {
  listStaff,
  getStaffMember,
  updateStaffMember,
  setStaffAvailability,
};
