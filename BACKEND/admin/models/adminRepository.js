const { randomUUID } = require("crypto");
const { query } = require("../../shared/database");

let schemaReadyPromise;

const requiredTables = ["NguoiDung", "HoSoNhanVien", "HoaDon"];

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

function createId(prefix) {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function toUserStatus(value) {
  return value ? "active" : "locked";
}

function toDatabaseActiveStatus(value) {
  if (value === undefined) return true;
  return !["locked", "inactive"].includes(String(value).toLowerCase());
}

function toStaffStatus(row) {
  if (!row.TrangThaiHoatDong) return "inactive";
  if (row.SanSangLamViec === false) return "on_leave";
  return "active";
}

function getStaffStatusUpdate(status) {
  const normalizedStatus = String(status || "active").toLowerCase();

  if (normalizedStatus === "inactive") {
    return { userActive: false, staffReady: false };
  }

  if (normalizedStatus === "on_leave") {
    return { userActive: true, staffReady: false };
  }

  return { userActive: true, staffReady: true };
}

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.MaNguoiDungClerk,
    fullName: row.HoVaTen || "",
    email: row.Email || "",
    role: normalizeRole(row.VaiTro),
    status: toUserStatus(row.TrangThaiHoatDong),
    createdAt: serializeDate(row.NgayTao),
    updatedAt: null,
  };
}

function mapStaffMember(row) {
  if (!row) return null;

  return {
    id: row.MaNguoiDungClerk,
    fullName: row.HoVaTen || "",
    email: row.Email || "",
    phone: row.SoDienThoai || "",
    position: row.ChuyenMon || "Nhân viên chăm sóc thú cưng",
    shift: row.NamKinhNghiem !== null && row.NamKinhNghiem !== undefined
      ? `${row.NamKinhNghiem} năm kinh nghiệm`
      : "Linh hoạt",
    status: toStaffStatus(row),
    createdAt: serializeDate(row.NgayTao),
    updatedAt: null,
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
        AND TABLE_NAME IN (${requiredTables.map((_, index) => `@table${index}`).join(", ")});
    `,
    Object.fromEntries(requiredTables.map((table, index) => [`table${index}`, table])),
  );

  const existingTables = new Set(result.recordset.map((row) => row.TABLE_NAME));
  const missingTables = requiredTables.filter((table) => !existingTables.has(table));

  if (missingTables.length) {
    throw new Error(`Missing required dbo table(s): ${missingTables.join(", ")}.`);
  }
}

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
    where.push("(HoVaTen LIKE '%' + @search + '%' OR Email LIKE '%' + @search + '%')");
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
      SELECT MaNguoiDungClerk, HoVaTen, Email, VaiTro, TrangThaiHoatDong, NgayTao
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
      SELECT MaNguoiDungClerk, HoVaTen, Email, VaiTro, TrangThaiHoatDong, NgayTao
      FROM dbo.NguoiDung
      WHERE MaNguoiDungClerk = @id;
    `,
    { id },
  );

  return mapUser(result.recordset[0]);
}

async function getUserByEmail(email, excludeId = "") {
  await ensureAdminSchema();

  const result = await query(
    `
      SELECT MaNguoiDungClerk, HoVaTen, Email, VaiTro, TrangThaiHoatDong, NgayTao
      FROM dbo.NguoiDung
      WHERE LOWER(Email) = LOWER(@email)
        AND (@excludeId = '' OR MaNguoiDungClerk <> @excludeId);
    `,
    { email, excludeId },
  );

  return mapUser(result.recordset[0]);
}

async function createUser(payload) {
  await ensureAdminSchema();

  const result = await query(
    `
      INSERT INTO dbo.NguoiDung (MaNguoiDungClerk, HoVaTen, Email, VaiTro, TrangThaiHoatDong)
      OUTPUT INSERTED.MaNguoiDungClerk, INSERTED.HoVaTen, INSERTED.Email, INSERTED.VaiTro, INSERTED.TrangThaiHoatDong, INSERTED.NgayTao
      VALUES (@id, @fullName, @email, @role, @status);
    `,
    {
      id: createId("user"),
      fullName: payload.fullName,
      email: payload.email,
      role: toDatabaseRole(payload.role),
      status: toDatabaseActiveStatus(payload.status),
    },
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
      OUTPUT INSERTED.MaNguoiDungClerk, INSERTED.HoVaTen, INSERTED.Email, INSERTED.VaiTro, INSERTED.TrangThaiHoatDong, INSERTED.NgayTao
      WHERE MaNguoiDungClerk = @id;
    `,
    parameters,
  );

  return mapUser(result.recordset[0]);
}

async function deleteUser(id) {
  await ensureAdminSchema();

  await query("DELETE FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id;", { id });

  const result = await query(
    `
      DELETE FROM dbo.NguoiDung
      OUTPUT DELETED.MaNguoiDungClerk, DELETED.HoVaTen, DELETED.Email, DELETED.VaiTro, DELETED.TrangThaiHoatDong, DELETED.NgayTao
      WHERE MaNguoiDungClerk = @id;
    `,
    { id },
  );

  return mapUser(result.recordset[0]);
}

function buildStaffWhereClause(filters = {}) {
  const where = ["(LOWER(n.VaiTro) = 'staff' OR h.MaNhanVienClerk IS NOT NULL)"];
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
    where.push("(n.HoVaTen LIKE '%' + @search + '%' OR n.Email LIKE '%' + @search + '%' OR h.ChuyenMon LIKE '%' + @search + '%')");
    parameters.search = search;
  }

  return {
    parameters,
    whereSql: `WHERE ${where.join(" AND ")}`,
  };
}

async function listStaff(filters = {}) {
  await ensureAdminSchema();

  const { whereSql, parameters } = buildStaffWhereClause(filters);
  const result = await query(
    `
      SELECT
        n.MaNguoiDungClerk,
        n.HoVaTen,
        n.Email,
        n.SoDienThoai,
        n.VaiTro,
        n.TrangThaiHoatDong,
        n.NgayTao,
        h.ChuyenMon,
        h.NamKinhNghiem,
        h.DiemDanhGia,
        h.SanSangLamViec
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
        n.MaNguoiDungClerk,
        n.HoVaTen,
        n.Email,
        n.SoDienThoai,
        n.VaiTro,
        n.TrangThaiHoatDong,
        n.NgayTao,
        h.ChuyenMon,
        h.NamKinhNghiem,
        h.DiemDanhGia,
        h.SanSangLamViec
      FROM dbo.NguoiDung n
      LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
      WHERE n.MaNguoiDungClerk = @id
        AND (LOWER(n.VaiTro) = 'staff' OR h.MaNhanVienClerk IS NOT NULL);
    `,
    { id },
  );

  return mapStaffMember(result.recordset[0]);
}

async function getStaffMemberByEmail(email, excludeId = "") {
  await ensureAdminSchema();

  const result = await query(
    `
      SELECT
        n.MaNguoiDungClerk,
        n.HoVaTen,
        n.Email,
        n.SoDienThoai,
        n.VaiTro,
        n.TrangThaiHoatDong,
        n.NgayTao,
        h.ChuyenMon,
        h.NamKinhNghiem,
        h.DiemDanhGia,
        h.SanSangLamViec
      FROM dbo.NguoiDung n
      LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
      WHERE LOWER(n.Email) = LOWER(@email)
        AND (@excludeId = '' OR n.MaNguoiDungClerk <> @excludeId);
    `,
    { email, excludeId },
  );

  return mapStaffMember(result.recordset[0]);
}

async function createStaffMember(payload) {
  await ensureAdminSchema();

  const id = createId("staff");
  const staffStatus = getStaffStatusUpdate(payload.status);

  await query(
    `
      INSERT INTO dbo.NguoiDung (MaNguoiDungClerk, HoVaTen, Email, SoDienThoai, VaiTro, TrangThaiHoatDong)
      VALUES (@id, @fullName, @email, @phone, 'Staff', @userActive);

      INSERT INTO dbo.HoSoNhanVien (MaNhanVienClerk, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
      VALUES (@id, @position, 0, 0, @staffReady);
    `,
    {
      id,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone || "",
      position: payload.position,
      staffReady: staffStatus.staffReady,
      userActive: staffStatus.userActive,
    },
  );

  return getStaffMemberById(id);
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

  if (payload.position !== undefined) {
    staffAssignments.push("ChuyenMon = @position");
    parameters.position = payload.position;
  }

  if (payload.status !== undefined) {
    const staffStatus = getStaffStatusUpdate(payload.status);
    userAssignments.push("TrangThaiHoatDong = @userActive");
    staffAssignments.push("SanSangLamViec = @staffReady");
    parameters.userActive = staffStatus.userActive;
    parameters.staffReady = staffStatus.staffReady;
  }

  if (parameters.position === undefined) {
    parameters.position = null;
  }

  if (parameters.staffReady === undefined) {
    parameters.staffReady = null;
  }

  if (userAssignments.length) {
    await query(
      `
        UPDATE dbo.NguoiDung
        SET ${userAssignments.join(", ")}
        WHERE MaNguoiDungClerk = @id;
      `,
      parameters,
    );
  }

  await query(
    `
      IF EXISTS (SELECT 1 FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id)
      BEGIN
        UPDATE dbo.HoSoNhanVien
        SET ${staffAssignments.length ? staffAssignments.join(", ") : "MaNhanVienClerk = MaNhanVienClerk"}
        WHERE MaNhanVienClerk = @id;
      END
      ELSE
      BEGIN
        INSERT INTO dbo.HoSoNhanVien (MaNhanVienClerk, ChuyenMon, NamKinhNghiem, DiemDanhGia, SanSangLamViec)
        VALUES (@id, ISNULL(@position, N'Nhân viên chăm sóc thú cưng'), 0, 0, ISNULL(@staffReady, 1));
      END
    `,
    parameters,
  );

  return getStaffMemberById(id);
}

async function deleteStaffMember(id) {
  await ensureAdminSchema();

  const deletedMember = await getStaffMemberById(id);

  if (!deletedMember) {
    return null;
  }

  await query("DELETE FROM dbo.HoSoNhanVien WHERE MaNhanVienClerk = @id;", { id });
  await query("DELETE FROM dbo.NguoiDung WHERE MaNguoiDungClerk = @id;", { id });

  return deletedMember;
}

async function getOverview() {
  await ensureAdminSchema();

  const result = await query(`
    SELECT
      COUNT(*) AS totalUsers,
      SUM(CASE WHEN TrangThaiHoatDong = 1 THEN 1 ELSE 0 END) AS activeUsers,
      SUM(CASE WHEN TrangThaiHoatDong = 0 THEN 1 ELSE 0 END) AS pendingUsers
    FROM dbo.NguoiDung;

    SELECT
      COUNT(*) AS totalStaff,
      SUM(CASE WHEN n.TrangThaiHoatDong = 1 AND ISNULL(h.SanSangLamViec, 1) = 1 THEN 1 ELSE 0 END) AS activeStaff
    FROM dbo.NguoiDung n
    LEFT JOIN dbo.HoSoNhanVien h ON h.MaNhanVienClerk = n.MaNguoiDungClerk
    WHERE LOWER(n.VaiTro) = 'staff' OR h.MaNhanVienClerk IS NOT NULL;

    SELECT COUNT(*) AS reportCount
    FROM dbo.HoaDon;
  `);

  const userStats = result.recordsets[0][0] || {};
  const staffStats = result.recordsets[1][0] || {};
  const reportStats = result.recordsets[2][0] || {};

  return {
    totalUsers: userStats.totalUsers || 0,
    activeUsers: userStats.activeUsers || 0,
    pendingUsers: userStats.pendingUsers || 0,
    totalStaff: staffStats.totalStaff || 0,
    activeStaff: staffStats.activeStaff || 0,
    reportCount: reportStats.reportCount || 0,
  };
}

module.exports = {
  createStaffMember,
  createUser,
  deleteStaffMember,
  deleteUser,
  ensureAdminSchema,
  getOverview,
  getStaffMemberByEmail,
  getStaffMemberById,
  getUserByEmail,
  getUserById,
  listStaff,
  listUsers,
  updateStaffMember,
  updateUser,
};
