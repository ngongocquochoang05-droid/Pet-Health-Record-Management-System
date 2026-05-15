const adminRepository = require("../models/adminRepository");
const { createServiceError } = require("./errors");

const allowedRoles = new Set(["admin", "staff", "customer"]);
const allowedStatuses = new Set(["active", "inactive", "pending", "locked"]);

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

function validateUserPayload(payload, isPartial = false) {
  const errors = {};

  if (!isPartial || payload.fullName !== undefined) {
    if (!payload.fullName || String(payload.fullName).trim().length < 2) {
      errors.fullName = "Full name must contain at least 2 characters.";
    }
  }

  if (!isPartial || payload.email !== undefined) {
    if (!payload.email || !String(payload.email).includes("@")) {
      errors.email = "Email is invalid.";
    }
  }

  if (!isPartial || payload.role !== undefined) {
    if (!allowedRoles.has(payload.role)) {
      errors.role = "Role must be admin, staff, or customer.";
    }
  }

  if (payload.status !== undefined && !allowedStatuses.has(payload.status)) {
    errors.status = "Status must be active, inactive, pending, or locked.";
  }

  if (Object.keys(errors).length) {
    throw createServiceError(422, "User payload is invalid.", errors);
  }
}

async function createUser(payload) {
  validateUserPayload(payload);

  const duplicate = await adminRepository.getUserByEmail(payload.email);

  if (duplicate) {
    throw createServiceError(409, "Email already exists.");
  }

  return adminRepository.createUser({
    fullName: String(payload.fullName).trim(),
    email: String(payload.email).trim(),
    role: payload.role,
    status: payload.status || "pending",
  });
}

async function updateUser(id, payload) {
  validateUserPayload(payload, true);

  const user = await getUserById(id);

  if (payload.email && normalizeText(payload.email) !== normalizeText(user.email)) {
    const duplicate = await adminRepository.getUserByEmail(payload.email, id);

    if (duplicate) {
      throw createServiceError(409, "Email already exists.");
    }
  }

  const updatedUser = await adminRepository.updateUser(id, payload);

  if (!updatedUser) {
    throw createServiceError(404, "User account not found.");
  }

  return updatedUser;
}

async function deleteUser(id) {
  const deletedUser = await adminRepository.deleteUser(id);

  if (!deletedUser) {
    throw createServiceError(404, "User account not found.");
  }

  return deletedUser;
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
