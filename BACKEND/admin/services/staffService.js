const adminRepository = require("../models/adminRepository");
const { createServiceError } = require("./errors");

const allowedStatuses = new Set(["active", "inactive", "on_leave"]);

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

function validateStaffPayload(payload) {
  const errors = {};

  if (payload.expertise !== undefined && String(payload.expertise).trim().length === 0) {
    errors.expertise = "Chuyen mon khong duoc rong.";
  }
  if (payload.yearsOfExperience !== undefined) {
    const years = Number(payload.yearsOfExperience);
    if (!Number.isFinite(years) || years < 0 || years > 80) {
      errors.yearsOfExperience = "Nam kinh nghiem phai la so tu 0 den 80.";
    }
  }
  if (payload.status !== undefined && !allowedStatuses.has(payload.status)) {
    errors.status = "Status must be active, inactive, or on_leave.";
  }

  if (Object.keys(errors).length) {
    throw createServiceError(422, "Staff payload is invalid.", errors);
  }
}

async function updateStaffMember(id, payload) {
  validateStaffPayload(payload);
  await getStaffMemberById(id); // dam bao member ton tai
  const updated = await adminRepository.updateStaffMember(id, payload);
  if (!updated) {
    throw createServiceError(404, "Staff member not found.");
  }
  return updated;
}

async function setStaffAvailability(id, status) {
  if (!allowedStatuses.has(status)) {
    throw createServiceError(422, "Status must be active, inactive, or on_leave.");
  }
  return updateStaffMember(id, { status });
}

module.exports = {
  listStaff,
  getStaffMemberById,
  updateStaffMember,
  setStaffAvailability,
};
