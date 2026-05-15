const adminRepository = require("../models/adminRepository");

function countByStatus(items) {
  return items.reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, {});
}

async function getSummary() {
  const [users, staffMembers] = await Promise.all([
    adminRepository.listUsers(),
    adminRepository.listStaff(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: users.length,
      byStatus: countByStatus(users),
      byRole: users.reduce((result, user) => {
        result[user.role] = (result[user.role] || 0) + 1;
        return result;
      }, {}),
    },
    staff: {
      total: staffMembers.length,
      byStatus: countByStatus(staffMembers),
    },
    operations: {
      monthlyReports: 12,
      pendingApprovals: users.filter((user) => user.status === "pending").length,
      satisfactionScore: 4.9,
    },
  };
}

module.exports = {
  getSummary,
};
