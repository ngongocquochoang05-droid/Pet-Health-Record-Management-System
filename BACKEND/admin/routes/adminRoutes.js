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
    sendJson(response, 404, { success: false, message: "Route not found in admin backend." });
    return;
  }

  const [resource, id, action] = parts;

  if (request.method === "GET" && resource === "health" && !id) {
    return systemController.getHealth(context);
  }
  if (request.method === "GET" && resource === "dashboard" && !id) {
    return systemController.getDashboard(context);
  }

  // Users: list, get, update role, lock/unlock. Khong co create/delete.
  if (resource === "users") {
    if (request.method === "GET" && !id) return userController.listUsers(context);
    if (request.method === "GET" && id && !action) return userController.getUser(context, id);
    if (request.method === "PATCH" && id && action === "role") {
      return userController.updateUserRole(context, id);
    }
    if (request.method === "POST" && id && action === "lock") return userController.lockUser(context, id);
    if (request.method === "POST" && id && action === "unlock") return userController.unlockUser(context, id);
  }

  if (resource === "staff") {
    if (request.method === "GET" && !id) return staffController.listStaff(context);
    if (request.method === "GET" && id && !action) return staffController.getStaffMember(context, id);
    if (request.method === "PATCH" && id && !action) return staffController.updateStaffMember(context, id);
    if (request.method === "POST" && id && action === "availability") {
      return staffController.setStaffAvailability(context, id);
    }
  }

  if (request.method === "GET" && resource === "reports" && id === "summary" && !action) {
    return reportController.getSummary(context);
  }

  sendJson(response, 404, { success: false, message: "Admin API endpoint not found." });
}

module.exports = { handleAdminRoute };
