const adminRepository = require("../models/adminRepository");

const startedAt = new Date().toISOString();

const systemModules = [
  { key: "auth", name: "Xac thuc dang nhap (Clerk)", status: "ready" },
  { key: "users", name: "Tai khoan nguoi dung", status: "ready" },
  { key: "staff", name: "Quan ly nhan vien", status: "ready" },
  { key: "reports", name: "Bao cao thong ke", status: "ready" },
];

function getHealth() {
  return {
    service: "mypuppy-admin-backend",
    status: "ok",
    startedAt,
    checkedAt: new Date().toISOString(),
  };
}

async function getDashboard() {
  const overview = await adminRepository.getOverviewMetrics();
  return {
    overview,
    modules: systemModules,
  };
}

module.exports = {
  getHealth,
  getDashboard,
};
