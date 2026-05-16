const adminRepository = require("../models/adminRepository");
const { revokeAllSessionsForUser, isClerkConfigured } = require("../../shared/clerk/clerkClient");
const { createServiceError } = require("./errors");

const allowedRoles = new Set(["admin", "staff", "customer"]);

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

async function listUsers(filters = {}) {
  return adminRepository.listUsers(filters);
}

async function getUserById(id) {
  const user = await adminRepository.getUserById(id);
  if (!user) {
    throw createServiceError(404, "User account not found.");
  }
  return user;
}

function validateRoleUpdate(payload) {
  if (payload.role !== undefined && !allowedRoles.has(normalizeText(payload.role))) {
    throw createServiceError(422, "Role must be admin, staff, or customer.");
  }
}

async function updateRole(id, role) {
  validateRoleUpdate({ role });
  const user = await getUserById(id);

  const updated = await adminRepository.updateUser(id, { role });
  if (!updated) {
    throw createServiceError(404, "User account not found.");
  }
  return updated;
}

async function setUserActive(id, isActive) {
  const user = await getUserById(id);
  const targetStatus = isActive ? "active" : "locked";

  const updated = await adminRepository.updateUser(id, { status: targetStatus });
  if (!updated) {
    throw createServiceError(404, "User account not found.");
  }

  // Khi khoa: revoke session tren Clerk de dang xuat ngay lap tuc.
  let clerkResult = { revoked: 0, skipped: !isClerkConfigured() };
  if (!isActive) {
    try {
      clerkResult = await revokeAllSessionsForUser(id);
    } catch (error) {
      console.warn(`Khong the revoke session Clerk cho ${id}:`, error.message);
      clerkResult = { revoked: 0, skipped: true, error: error.message };
    }
  }

  return { ...updated, clerk: clerkResult };
}

module.exports = {
  listUsers,
  getUserById,
  updateRole,
  setUserActive,
};
