const adminRepository = require("../models/adminRepository");

const startedAt = new Date().toISOString();

const systemModules = [
  { key: "auth", name: "Xác thực đăng nhập", status: "ready" },
  { key: "users", name: "Tài khoản người dùng", status: "ready" },
  { key: "staff", name: "Quản lý nhân viên", status: "ready" },
  { key: "reports", name: "Báo cáo thống kê", status: "ready" },
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
  const [overview, users, staffMembers] = await Promise.all([
    adminRepository.getOverview(),
    adminRepository.listUsers(),
    adminRepository.listStaff(),
  ]);

  return {
    overview,
    modules: systemModules,
    recentActivities: buildRecentActivities(users, staffMembers),
  };
}

function formatTime(value) {
  if (!value) return "--:--";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildRecentActivities(users, staffMembers) {
  const userActivities = users.slice(0, 3).map((user) => ({
    id: `user-${user.id}`,
    title: `Tài khoản ${getRoleLabel(user.role)}`,
    owner: user.fullName || user.email,
    status: user.status,
    time: formatTime(user.createdAt),
  }));

  const staffActivities = staffMembers.slice(0, 2).map((member) => ({
    id: `staff-${member.id}`,
    title: "Hồ sơ nhân viên",
    owner: member.fullName || member.email,
    status: member.status === "active" ? "done" : "review",
    time: formatTime(member.updatedAt || member.createdAt),
  }));

  return [...userActivities, ...staffActivities].slice(0, 5);
}

function getRoleLabel(role) {
  const labels = {
    admin: "quản trị",
    staff: "nhân viên",
    customer: "khách hàng",
  };

  return labels[role] || "người dùng";
}

module.exports = {
  getHealth,
  getDashboard,
};
