const startedAt = new Date().toISOString();

const systemModules = [
  { key: "auth", name: "Authentication", status: "ready" },
  { key: "users", name: "User accounts", status: "ready" },
  { key: "staff", name: "Staff management", status: "ready" },
  { key: "reports", name: "Reports", status: "ready" },
];

const users = [
  {
    id: "user-001",
    fullName: "Nguyen Thu Ha",
    email: "ha.nguyen@example.com",
    role: "customer",
    status: "pending",
    createdAt: "2026-05-01T08:30:00.000Z",
  },
  {
    id: "user-002",
    fullName: "Tran Van Hung",
    email: "hung.tran@example.com",
    role: "staff",
    status: "active",
    createdAt: "2026-05-03T10:15:00.000Z",
  },
  {
    id: "user-003",
    fullName: "Le Minh Quan",
    email: "quan.le@example.com",
    role: "admin",
    status: "active",
    createdAt: "2026-05-04T12:45:00.000Z",
  },
];

const staffMembers = [
  {
    id: "staff-001",
    fullName: "Mai Groomer",
    email: "mai.groomer@mypuppy.vn",
    phone: "0901234567",
    position: "Grooming Specialist",
    shift: "Morning",
    status: "active",
    createdAt: "2026-05-02T09:00:00.000Z",
  },
  {
    id: "staff-002",
    fullName: "Tran Van Hung",
    email: "hung.staff@mypuppy.vn",
    phone: "0918222090",
    position: "Veterinary Assistant",
    shift: "Afternoon",
    status: "active",
    createdAt: "2026-05-05T11:20:00.000Z",
  },
  {
    id: "staff-003",
    fullName: "Le Thi Hoa",
    email: "hoa.spa@mypuppy.vn",
    phone: "0987333112",
    position: "Spa Specialist",
    shift: "Evening",
    status: "inactive",
    createdAt: "2026-05-06T13:40:00.000Z",
  },
];

module.exports = {
  startedAt,
  systemModules,
  users,
  staffMembers,
};
