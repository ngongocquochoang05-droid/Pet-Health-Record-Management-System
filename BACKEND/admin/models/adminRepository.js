const { query } = require("../../shared/database");

let schemaReadyPromise;

const requiredTables = [
  "NguoiDung",
  "HoSoNhanVien",
  "HoaDon",
  "LichHen",
  "DichVu",
  "SanPham",
  "ChiTietHoaDon_SanPham",
];

function serializeDate(value) {
  return value ? new Date(value).toISOString() : null;
}

function normalizeRole(value) {
  return String(value || "customer").trim().toLowerCase();
}

function toDatabaseRole(value) {
  const roleMap = {
    admin: "Admin",
    staff: "Staff",
    customer: "Customer",
  };
  return roleMap[normalizeRole(value)] || "Customer";
}

function toUserStatus(value) {
  return value ? "active" : "locked";
}

function toDatabaseActiveStatus(value) {
  if (value === undefined || value === null) return true;
  return !["locked", "inactive"].includes(String(value).toLowerCase());
}

function toStaffStatus(row) {
  if (!row.TrangThaiHoatDong) return "inactive";
  if (row.SanSangLamViec === false) return "on_leave";
  return "active";
}

function getStaffStatusUpdate(status) {
  const normalized = String(status || "active").toLowerCase();
  if (normalized === "inactive") return { userActive: false, staffReady: false };
  if (normalized === "on_leave") return { userActive: true, staffReady: false };
  return { userActive: true, staffReady: true };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.MaNguoiDungClerk,
    fullName: row.HoVaTen || "",
    email: row.Email || "",
    phone: row.SoDienThoai || "",
    address: row.DiaChi || "",
    gender: row.GioiTinh || "",
    role: normalizeRole(row.VaiTro),
    status: toUserStatus(row.TrangThaiHoatDong),
    createdAt: serializeDate(row.NgayTao),
  };
}

function mapStaffMember(row) {
  if (!row) return null;
  return {
    id: row.MaNguoiDungClerk,
    fullName: row.HoVaTen || "",
    email: row.Email || "",
    phone: row.SoDienThoai || "",
    expertise: row.ChuyenMon || "",
    yearsOfExperience: row.NamKinhNghiem ?? 0,
    rating: row.DiemDanhGia ? Number(row.DiemDanhGia) : 0,
    status: toStaffStatus(row),
    createdAt: serializeDate(row.NgayTao),
  };
}

async function ensureAdminSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = verifyExistingTables();
  }
  return schemaReadyPromise;
}

async function verifyExistingTables() {
  const result = await query(
    `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME IN (${requiredTables.map((_, i) => `@table${i}`).join(", ")});
    `,
    Object.fromEntries(requiredTables.map((t, i) => [`table${i}`, t])),
  );
  const existing = new Set(result.recordset.map((r) => r.TABLE_NAME));
  const missing = requiredTables.filter((t) => !existing.has(t));
  if (missing.length) {
    throw new Error(`Missing required dbo table(s): ${missing.join(", ")}.`);
  }
}

/* =========================================================
   USERS
   ========================================================= */

function buildUserWhereClause(filters = {}) {
  const where = [];
  const parameters = {};
  const role = String(filters.role || "").trim().toLowerCase();
  const status = String(filters.status || "").trim().toLowerCase();
  const search = String(filters.search || "").trim();

  if (role) {
    where.push("LOWER(VaiTro) = @role");
    parameters.role = role;
  }
  if (status) {
    where.push("TrangThaiHoatDong = @activeStatus");
    parameters.activeStatus = status === "active";
  }
  if (search) {
    where.push(
      "(HoVaTen LIKE '%' + @search + '%' OR Email LIKE '%' + @search + '%' OR SoDienThoai LIKE '%' + @search + '%')",
    );
    parameters.search = search;
  }
  return {
    parameters,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
}

async function listUsers(filters = {}) {
  await ensureAdminSchema();
  const { whereSql, parameters } = buildUserWhereClause(filters);
  const result = await query(
    `
      SELECT MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, DiaChi, GioiTinh, VaiTro, TrangThaiHoatDong, NgayTao
      FROM dbo.NguoiDung
      ${whereSql}
      ORDER BY NgayTao DESC;
    `,
    parameters,
  );
  return result.recordset.map(mapUser);
}

async function getUserById(id) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, DiaChi, GioiTinh, VaiTro, TrangThaiHoatDong, NgayTao
      FROM dbo.NguoiDung
      WHERE MaNguoiDungClerk = @id;
    `,
    { id },
  );
  return mapUser(result.recordset[0]);
}

async function updateUser(id, payload) {
  await ensureAdminSchema();
  const assignments = [];
  const parameters = { id };

  if (payload.fullName !== undefined) {
    assignments.push("HoVaTen = @fullName");
    parameters.fullName = payload.fullName;
  }
  if (payload.email !== undefined) {
    assignments.push("Email = @email");
    parameters.email = payload.email;
  }
  if (payload.phone !== undefined) {
    assignments.push("SoDienThoai = @phone");
    parameters.phone = payload.phone;
  }
  if (payload.role !== undefined) {
    assignments.push("VaiTro = @role");
    parameters.role = toDatabaseRole(payload.role);
  }
  if (payload.status !== undefined) {
    assignments.push("TrangThaiHoatDong = @status");
    parameters.status = toDatabaseActiveStatus(payload.status);
  }

  if (!assignments.length) {
    return getUserById(id);
  }

  const result = await query(
    `
      UPDATE dbo.NguoiDung
      SET ${assignments.join(", ")}
      OUTPUT INSERTED.MaNguoiDungClerk, INSERTED.HoVaTen, INSERTED.Email, INSERTED.SoDienThoai,
             INSERTED.DiaChi, INSERTED.GioiTinh, INSERTED.VaiTro, INSERTED.TrangThaiHoatDong, INSERTED.NgayTao
      WHERE MaNguoiDungClerk = @id;
    `,
    parameters,
  );

  // Khi promote user lên Staff: tu dong tao HoSoNhanVien neu chua co.
  if (payload.role !== undefined && normalizeRole(payload.role) === "staff") {
    await query(
      `
        IF NOT EXISTS (SELECT 1 FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id)
        BEGIN
          INSERT INTO dbo.HoSoNhanVien (MaNhanVienClerk, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
          VALUES (@id, N'', 0, 0, 1);
        END
      `,
      { id },
    );
  }

  return mapUser(result.recordset[0]);
}

/* =========================================================
   STAFF
   ========================================================= */

function buildStaffWhereClause(filters = {}) {
  const where = ["LOWER(n.VaiTro) = 'staff'"];
  const parameters = {};
  const status = String(filters.status || "").trim().toLowerCase();
  const search = String(filters.search || "").trim();

  if (status) {
    if (status === "active") {
      where.push("n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 1) = 1");
    } else if (status === "on_leave") {
      where.push("n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 0) = 0");
    } else {
      where.push("n.TrangThaiHoatDong = 0");
    }
  }
  if (search) {
    where.push(
      "(n.HoVaTen LIKE '%' + @search + '%' OR n.Email LIKE '%' + @search + '%' OR h.ChuyenMon LIKE '%' + @search + '%' OR n.SoDienThoai LIKE '%' + @search + '%')",
    );
    parameters.search = search;
  }
  return { parameters, whereSql: `WHERE ${where.join(" AND ")}` };
}

async function listStaff(filters = {}) {
  await ensureAdminSchema();
  const { whereSql, parameters } = buildStaffWhereClause(filters);
  const result = await query(
    `
      SELECT
        n.MaNguoiDungClerk, n.HoVaTen, n.Email, n.SoDienThoai, n.VaiTro,
        n.TrangThaiHoatDong, n.NgayTao,
        h.ChuyenMon, h.NamKinhNghiem, h.DiemDanhGia, h.SanSangLamViec
      FROM dbo.NguoiDung n
      LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
      ${whereSql}
      ORDER BY n.NgayTao DESC;
    `,
    parameters,
  );
  return result.recordset.map(mapStaffMember);
}

async function getStaffMemberById(id) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT
        n.MaNguoiDungClerk, n.HoVaTen, n.Email, n.SoDienThoai, n.VaiTro,
        n.TrangThaiHoatDong, n.NgayTao,
        h.ChuyenMon, h.NamKinhNghiem, h.DiemDanhGia, h.SanSangLamViec
      FROM dbo.NguoiDung n
      LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
      WHERE n.MaNguoiDungClerk = @id
        AND LOWER(n.VaiTro) = 'staff';
    `,
    { id },
  );
  return mapStaffMember(result.recordset[0]);
}

async function updateStaffMember(id, payload) {
  await ensureAdminSchema();
  const userAssignments = [];
  const staffAssignments = [];
  const parameters = { id };

  if (payload.fullName !== undefined) {
    userAssignments.push("HoVaTen = @fullName");
    parameters.fullName = payload.fullName;
  }
  if (payload.email !== undefined) {
    userAssignments.push("Email = @email");
    parameters.email = payload.email;
  }
  if (payload.phone !== undefined) {
    userAssignments.push("SoDienThoai = @phone");
    parameters.phone = payload.phone;
  }
  if (payload.expertise !== undefined) {
    staffAssignments.push("ChuyenMon = @expertise");
    parameters.expertise = payload.expertise;
  }
  if (payload.yearsOfExperience !== undefined) {
    staffAssignments.push("NamKinhNghiem = @yearsOfExperience");
    parameters.yearsOfExperience = Number(payload.yearsOfExperience) || 0;
  }
  if (payload.status !== undefined) {
    const s = getStaffStatusUpdate(payload.status);
    userAssignments.push("TrangThaiHoatDong = @userActive");
    staffAssignments.push("SanSangLamViec = @staffReady");
    parameters.userActive = s.userActive;
    parameters.staffReady = s.staffReady;
  }

  if (userAssignments.length) {
    await query(
      `UPDATE dbo.NguoiDung SET ${userAssignments.join(", ")} WHERE MaNguoiDungClerk = @id;`,
      parameters,
    );
  }

  if (staffAssignments.length) {
    await query(
      `
        IF EXISTS (SELECT 1 FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id)
        BEGIN
          UPDATE dbo.HoSoNhanVien SET ${staffAssignments.join(", ")} WHERE MaNhanVienClerk = @id;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.HoSoNhanVien (MaNhanVienClerk, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
          VALUES (@id, ISNULL(@expertise, N''), ISNULL(@yearsOfExperience, 0), 0, ISNULL(@staffReady, 1));
        END
      `,
      parameters,
    );
  }

  return getStaffMemberById(id);
}

/* =========================================================
   REPORTS
   ========================================================= */

async function getOverviewMetrics() {
  await ensureAdminSchema();
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM dbo.NguoiDung) AS totalUsers,
      (SELECT COUNT(*) FROM dbo.NguoiDung WHERE TrangThaiHoatDong = 1) AS activeUsers,
      (SELECT COUNT(*) FROM dbo.NguoiDung WHERE TrangThaiHoatDong = 0) AS lockedUsers,
      (SELECT COUNT(*) FROM dbo.NguoiDung WHERE LOWER(VaiTro) = 'staff') AS totalStaff,
      (SELECT COUNT(*)
        FROM dbo.NguoiDung n
        LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
        WHERE LOWER(n.VaiTro) = 'staff' AND n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 1) = 1) AS activeStaff,
      (SELECT COUNT(*) FROM dbo.LichHen) AS totalAppointments,
      (SELECT COUNT(*) FROM dbo.LichHen WHERE TrangThai = 'Pending') AS pendingAppointments,
      (SELECT COUNT(*) FROM dbo.LichHen WHERE TrangThai = 'Completed') AS completedAppointments,
      (SELECT COUNT(*) FROM dbo.LichHen WHERE TrangThai = 'Cancelled') AS cancelledAppointments,
      (SELECT ISNULL(SUM(TongTien), 0) FROM dbo.HoaDon WHERE TrangThaiThanhToan = 'Paid') AS totalRevenue;
  `);
  const r = result.recordset[0] || {};
  return {
    totalUsers: r.totalUsers || 0,
    activeUsers: r.activeUsers || 0,
    lockedUsers: r.lockedUsers || 0,
    totalStaff: r.totalStaff || 0,
    activeStaff: r.activeStaff || 0,
    totalAppointments: r.totalAppointments || 0,
    pendingAppointments: r.pendingAppointments || 0,
    completedAppointments: r.completedAppointments || 0,
    cancelledAppointments: r.cancelledAppointments || 0,
    totalRevenue: Number(r.totalRevenue || 0),
  };
}

async function getRevenueByDay(days = 14) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT
        CAST(NgayThanhToan AS date) AS day,
        SUM(TongTien) AS revenue,
        COUNT(*) AS invoices
      FROM dbo.HoaDon
      WHERE TrangThaiThanhToan = 'Paid'
        AND NgayThanhToan >= DATEADD(day, -@days, CAST(GETDATE() AS date))
      GROUP BY CAST(NgayThanhToan AS date)
      ORDER BY day;
    `,
    { days },
  );
  return result.recordset.map((row) => ({
    day: row.day instanceof Date ? row.day.toISOString().slice(0, 10) : String(row.day).slice(0, 10),
    revenue: Number(row.revenue || 0),
    invoices: row.invoices || 0,
  }));
}

async function getRevenueByMonth(months = 6) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT
        FORMAT(NgayThanhToan, 'yyyy-MM') AS month,
        SUM(TongTien) AS revenue,
        COUNT(*) AS invoices
      FROM dbo.HoaDon
      WHERE TrangThaiThanhToan = 'Paid'
        AND NgayThanhToan >= DATEADD(month, -@months, CAST(GETDATE() AS date))
      GROUP BY FORMAT(NgayThanhToan, 'yyyy-MM')
      ORDER BY month;
    `,
    { months },
  );
  return result.recordset.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue || 0),
    invoices: row.invoices || 0,
  }));
}

async function getRevenueBreakdown() {
  await ensureAdminSchema();
  // Doanh thu dich vu = TongTien hoa don co MaLichHen, tru di phan san pham di kem.
  // Doanh thu san pham = SUM(SoLuong * DonGia) trong ChiTietHoaDon_SanPham (chi tinh hoa don da Paid).
  const result = await query(`
    SELECT
      ISNULL((
        SELECT SUM(c.SoLuong * c.DonGia)
        FROM dbo.ChiTietHoaDon_SanPham c
        INNER JOIN dbo.HoaDon h ON h.MaHoaDon = c.MaHoaDon
        WHERE h.TrangThaiThanhToan = 'Paid'
      ), 0) AS productRevenue,
      ISNULL((
        SELECT SUM(h.TongTien)
        FROM dbo.HoaDon h
        WHERE h.TrangThaiThanhToan = 'Paid'
      ), 0) AS totalRevenue;
  `);
  const row = result.recordset[0] || {};
  const total = Number(row.totalRevenue || 0);
  const product = Number(row.productRevenue || 0);
  const service = Math.max(total - product, 0);
  return {
    serviceRevenue: service,
    productRevenue: product,
    totalRevenue: total,
  };
}

async function getAppointmentStatusBreakdown(monthsBack = 1) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT TrangThai AS status, COUNT(*) AS total
      FROM dbo.LichHen
      WHERE NgayHen >= DATEADD(month, -@monthsBack, CAST(GETDATE() AS date))
      GROUP BY TrangThai;
    `,
    { monthsBack },
  );
  const breakdown = { Pending: 0, Completed: 0, Cancelled: 0, InProgress: 0 };
  result.recordset.forEach((row) => {
    breakdown[row.status] = row.total;
  });
  return breakdown;
}

async function getTopStaffByRevenue(limit = 5) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT TOP (@limit)
        n.MaNguoiDungClerk AS id,
        n.HoVaTen AS fullName,
        h.ChuyenMon AS expertise,
        COUNT(DISTINCT lh.MaLichHen) AS completedAppointments,
        ISNULL(SUM(hd.TongTien), 0) AS totalRevenue
      FROM dbo.NguoiDung n
      LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
      LEFT JOIN dbo.LichHen lh
        ON lh.MaNhanVienClerk = n.MaNguoiDungClerk AND lh.TrangThai = 'Completed'
      LEFT JOIN dbo.HoaDon hd
        ON hd.MaLichHen = lh.MaLichHen AND hd.TrangThaiThanhToan = 'Paid'
      WHERE LOWER(n.VaiTro) = 'staff'
      GROUP BY n.MaNguoiDungClerk, n.HoVaTen, h.ChuyenMon
      ORDER BY totalRevenue DESC, completedAppointments DESC;
    `,
    { limit },
  );
  return result.recordset.map((row) => ({
    id: row.id,
    fullName: row.fullName || "",
    expertise: row.expertise || "",
    completedAppointments: row.completedAppointments || 0,
    totalRevenue: Number(row.totalRevenue || 0),
  }));
}

async function getTopServices(limit = 5) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT TOP (@limit)
        d.MaDichVu AS id,
        d.TenDichVu AS name,
        d.GiaTien AS price,
        COUNT(lh.MaLichHen) AS bookingCount
      FROM dbo.DichVu d
      LEFT JOIN dbo.LichHen lh ON lh.MaDichVu = d.MaDichVu
      GROUP BY d.MaDichVu, d.TenDichVu, d.GiaTien
      ORDER BY bookingCount DESC, name;
    `,
    { limit },
  );
  return result.recordset.map((row) => ({
    id: row.id,
    name: row.name || "",
    price: Number(row.price || 0),
    bookingCount: row.bookingCount || 0,
  }));
}

async function getTopProducts(limit = 5) {
  await ensureAdminSchema();
  const result = await query(
    `
      SELECT TOP (@limit)
        s.MaSanPham AS id,
        s.TenSanPham AS name,
        s.LoaiSanPham AS category,
        s.SoLuongTon AS stock,
        ISNULL(SUM(c.SoLuong), 0) AS totalSold,
        ISNULL(SUM(c.SoLuong * c.DonGia), 0) AS totalRevenue
      FROM dbo.SanPham s
      LEFT JOIN dbo.ChiTietHoaDon_SanPham c ON c.MaSanPham = s.MaSanPham
      LEFT JOIN dbo.HoaDon h ON h.MaHoaDon = c.MaHoaDon AND h.TrangThaiThanhToan = 'Paid'
      GROUP BY s.MaSanPham, s.TenSanPham, s.LoaiSanPham, s.SoLuongTon
      ORDER BY totalSold DESC, name;
    `,
    { limit },
  );
  return result.recordset.map((row) => ({
    id: row.id,
    name: row.name || "",
    category: row.category || "",
    stock: row.stock || 0,
    totalSold: row.totalSold || 0,
    totalRevenue: Number(row.totalRevenue || 0),
  }));
}

module.exports = {
  ensureAdminSchema,
  // users
  listUsers,
  getUserById,
  updateUser,
  // staff
  listStaff,
  getStaffMemberById,
  updateStaffMember,
  // reports
  getOverviewMetrics,
  getRevenueByDay,
  getRevenueByMonth,
  getRevenueBreakdown,
  getAppointmentStatusBreakdown,
  getTopStaffByRevenue,
  getTopServices,
  getTopProducts,
};
