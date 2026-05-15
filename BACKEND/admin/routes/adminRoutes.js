const systemController = require("../controllers/systemController");
const userController = require("../controllers/userController");
const staffController = require("../controllers/staffController");
const reportController = require("../controllers/reportController");

function getAdminPathParts(pathname) {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] !== "api" || parts[1] !== "admin") {
    return null;
  }

  return parts.slice(2);
}

async function handleAdminRoute(context) {
  const { request, response, requestUrl, sendJson } = context;
  const parts = getAdminPathParts(requestUrl.pathname);

  if (!parts) {
    sendJson(response, 404, {
      success: false,
      message: "Route not found in admin backend.",
    });
    return;
  }

  const [resource, id, subResource] = parts;

  if (request.method === "GET" && resource === "health" && !id) {
    systemController.getHealth(context);
    return;
  }

  if (request.method === "GET" && resource === "dashboard" && !id) {
    systemController.getDashboard(context);
    return;
  }

  if (resource === "users") {
    if (request.method === "GET" && !id) return userController.listUsers(context);
    if (request.method === "GET" && id) return userController.getUser(context, id);
    if (request.method === "POST" && !id) return userController.createUser(context);
    if (request.method === "PATCH" && id) return userController.updateUser(context, id);
    if (request.method === "DELETE" && id) return userController.deleteUser(context, id);
  }

  if (resource === "staff") {
    if (request.method === "GET" && !id) return staffController.listStaff(context);
    if (request.method === "GET" && id) return staffController.getStaffMember(context, id);
    if (request.method === "POST" && !id) return staffController.createStaffMember(context);
    if (request.method === "PATCH" && id) return staffController.updateStaffMember(context, id);
    if (request.method === "DELETE" && id) return staffController.deleteStaffMember(context, id);
  }

  if (request.method === "GET" && resource === "reports" && id === "summary" && !subResource) {
    reportController.getSummary(context);
    return;
  }

  sendJson(response, 404, {
    success: false,
    message: "Admin API endpoint not found.",
  });
}

module.exports = {
  handleAdminRoute,
};
