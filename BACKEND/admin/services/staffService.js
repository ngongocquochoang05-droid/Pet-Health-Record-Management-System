const adminRepository = require("../models/adminRepository");
const { createServiceError } = require("./errors");

const allowedStatuses = new Set(["active", "inactive", "on_leave"]);

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

async function listStaff(filters = {}) {
  return adminRepository.listStaff(filters);
}

async function getStaffMemberById(id) {
  const member = await adminRepository.getStaffMemberById(id);

  if (!member) {
    throw createServiceError(404, "Staff member not found.");
  }

  return member;
}

function validateStaffPayload(payload, isPartial = false) {
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

  if (!isPartial || payload.position !== undefined) {
    if (!payload.position || String(payload.position).trim().length < 2) {
      errors.position = "Position is required.";
    }
  }

  if (payload.status !== undefined && !allowedStatuses.has(payload.status)) {
    errors.status = "Status must be active, inactive, or on_leave.";
  }

  if (Object.keys(errors).length) {
    throw createServiceError(422, "Staff payload is invalid.", errors);
  }
}

async function createStaffMember(payload) {
  validateStaffPayload(payload);

  const duplicate = await adminRepository.getStaffMemberByEmail(payload.email);

  if (duplicate) {
    throw createServiceError(409, "Staff email already exists.");
  }

  return adminRepository.createStaffMember({
    fullName: String(payload.fullName).trim(),
    email: String(payload.email).trim(),
    phone: String(payload.phone || "").trim(),
    position: String(payload.position).trim(),
    shift: String(payload.shift || "Flexible").trim(),
    status: payload.status || "active",
  });
}

async function updateStaffMember(id, payload) {
  validateStaffPayload(payload, true);

  const member = await getStaffMemberById(id);

  if (payload.email && normalizeText(payload.email) !== normalizeText(member.email)) {
    const duplicate = await adminRepository.getStaffMemberByEmail(payload.email, id);

    if (duplicate) {
      throw createServiceError(409, "Staff email already exists.");
    }
  }

  const updatedMember = await adminRepository.updateStaffMember(id, payload);

  if (!updatedMember) {
    throw createServiceError(404, "Staff member not found.");
  }

  return updatedMember;
}

async function deleteStaffMember(id) {
  const deletedMember = await adminRepository.deleteStaffMember(id);

  if (!deletedMember) {
    throw createServiceError(404, "Staff member not found.");
  }

  return deletedMember;
}

module.exports = {
  listStaff,
  getStaffMemberById,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
};
