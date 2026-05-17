/* MyPuppy Admin Dashboard
   Theo yeu cau Admin (chu cua hang):
   1. Quan ly tai khoan: xem, search ten/SDT/email, doi role, khoa/mo khoa.
      Khong cho create/delete tai khoan moi.
   2. Quan ly nhan vien: cap nhat ChuyenMon, NamKinhNghiem, SanSangLamViec.
   3. Bao cao thong ke: doanh thu, hoat dong lich hen, top nhan vien/dich vu/san pham.
*/

const ADMIN_API_BASE = window.MyPuppyAdminApiBase || "http://localhost:4000/api/admin";

const logoutButton = document.getElementById("admin-logout");
const contentRoot = document.getElementById("admin-content");
const globalSearchInput = document.getElementById("admin-global-search");
const navLinks = document.querySelectorAll("[data-admin-view]");

const state = {
  backendOnline: false,
  currentView: "dashboard",
  search: "",
  users: [],
  staff: [],
  report: null,
};

/* ================================================================
   Helpers
================================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function createToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `admin-toast admin-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 240);
  }, 2600);
}

const ROLE_LABELS = {
  admin: "Quản trị",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

const STATUS_LABELS = {
  active: "Đang hoạt động",
  locked: "Đã khóa",
  on_leave: "Nghỉ phép",
  inactive: "Không hoạt động",
};

const STATUS_CLASS = {
  active: "status status--done",
  locked: "status status--danger",
  on_leave: "status status--pending",
  inactive: "status status--danger",
};

/* ================================================================
   API
================================================================ */

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${ADMIN_API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
      ...options,
    });

    const payload = await response.json();

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || "Yêu cầu API không thành công.");
    }

    state.backendOnline = true;
    return payload.data;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadAdminData() {
  try {
    const [users, staff, report] = await Promise.all([
      apiRequest("/users"),
      apiRequest("/staff"),
      apiRequest("/reports/summary"),
    ]);
    state.users = users;
    state.staff = staff;
    state.report = report;
    state.backendOnline = true;
  } catch (error) {
    state.backendOnline = false;
    state.users = [];
    state.staff = [];
    state.report = null;
    createToast(`Không kết nối được backend admin: ${error.message}`, "error");
  }
}

function filterItems(items, fields) {
  if (!state.search) return items;
  return items.filter((item) =>
    fields.some((field) => normalizeText(item[field]).includes(state.search)),
  );
}

/* ================================================================
   Render: Dashboard
================================================================ */

function updateActiveNav(view) {
  navLinks.forEach((link) => {
    link.classList.toggle("nav-link--active", link.dataset.adminView === view);
  });
}

function renderViewHeader(title, description, actions = "") {
  return `
    <section class="admin-view-header">
      <div>
        <p>${state.backendOnline ? "Đang kết nối backend & SQL Server" : "Backend chưa chạy"}</p>
        <h2>${escapeHtml(title)}</h2>
        <span>${escapeHtml(description)}</span>
      </div>
      <div class="admin-view-actions">${actions}</div>
    </section>
  `;
}

function renderDashboard() {
  const overview = state.report?.overview;

  if (!overview) {
    return `
      <section class="activity-panel">
        <div class="admin-empty">Chưa có dữ liệu. Hãy đảm bảo backend đang chạy ở port 4000.</div>
      </section>
    `;
  }

  return `
    <section class="metrics-grid" aria-label="Chỉ số quản trị">
      <article class="metric-card">
        <p>Doanh thu (Paid)</p>
        <strong>${formatCurrency(overview.totalRevenue)}</strong>
        <span>Tổng tiền hóa đơn đã thanh toán</span>
      </article>
      <article class="metric-card metric-card--blue">
        <p>Tài khoản người dùng</p>
        <strong>${formatNumber(overview.totalUsers)}</strong>
        <span>${formatNumber(overview.activeUsers)} hoạt động · ${formatNumber(overview.lockedUsers)} đã khóa</span>
      </article>
      <article class="metric-card">
        <p>Nhân viên</p>
        <strong>${formatNumber(overview.activeStaff)}/${formatNumber(overview.totalStaff)}</strong>
        <span>Đang sẵn sàng làm việc</span>
      </article>
      <article class="metric-card metric-card--yellow">
        <p>Lịch hẹn</p>
        <strong>${formatNumber(overview.totalAppointments)}</strong>
        <span>${formatNumber(overview.completedAppointments)} hoàn thành · ${formatNumber(overview.cancelledAppointments)} hủy</span>
      </article>
    </section>

    <section class="admin-panel-grid" aria-label="Chức năng quản trị">
      <article class="admin-panel admin-panel--clickable" data-admin-view="users">
        <p>Quản lý tài khoản</p>
        <h2>Phân quyền & khóa tài khoản</h2>
        <span>Đổi vai trò Customer/Staff/Admin, khóa tài khoản và đăng xuất khỏi Clerk.</span>
      </article>
      <article class="admin-panel admin-panel--clickable" data-admin-view="staff">
        <p>Quản lý nhân viên</p>
        <h2>Hồ sơ chuyên môn</h2>
        <span>Cập nhật chuyên môn, năm kinh nghiệm và trạng thái sẵn sàng làm việc.</span>
      </article>
      <article class="admin-panel admin-panel--clickable" data-admin-view="reports">
        <p>Báo cáo thống kê</p>
        <h2>Doanh thu & hiệu suất</h2>
        <span>Doanh thu theo ngày/tháng, top nhân viên, dịch vụ và sản phẩm bán chạy.</span>
      </article>
    </section>
  `;
}

/* ================================================================
   Render: Users
================================================================ */

function renderUsers() {
  const users = filterItems(state.users, ["fullName", "email", "phone"]);

  return `
    ${renderViewHeader(
      "Quản lý tài khoản",
      "Tìm theo tên, số điện thoại hoặc email. Đổi vai trò hoặc khóa tài khoản.",
    )}
    <section class="activity-panel">
      ${renderUsersTable(users)}
    </section>
  `;
}

function renderUsersTable(users) {
  if (!users.length) {
    return '<div class="admin-empty">Không tìm thấy tài khoản phù hợp.</div>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(renderUserRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderUserRow(user) {
  const isLocked = user.status === "locked";
  const lockButton = isLocked
    ? `<button type="button" data-user-action="unlock" data-id="${escapeHtml(user.id)}">Mở khóa</button>`
    : `<button type="button" data-user-action="lock" data-id="${escapeHtml(user.id)}">Khóa</button>`;

  const roleSelect = `
    <select data-user-role data-id="${escapeHtml(user.id)}" class="admin-select">
      ${["customer", "staff", "admin"]
        .map(
          (role) =>
            `<option value="${role}" ${user.role === role ? "selected" : ""}>${ROLE_LABELS[role]}</option>`,
        )
        .join("")}
    </select>
  `;

  return `
    <tr>
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.phone)}</td>
      <td>${roleSelect}</td>
      <td><span class="${STATUS_CLASS[user.status] || "status"}">${STATUS_LABELS[user.status] || user.status}</span></td>
      <td><div class="inline-actions">${lockButton}</div></td>
    </tr>
  `;
}

/* ================================================================
   Render: Staff
================================================================ */

function renderStaff() {
  const staff = filterItems(state.staff, ["fullName", "email", "expertise", "phone"]);

  return `
    ${renderViewHeader(
      "Quản lý nhân viên",
      "Cập nhật chuyên môn, năm kinh nghiệm và trạng thái sẵn sàng làm việc.",
    )}
    <section class="activity-panel">
      ${renderStaffTable(staff)}
    </section>
  `;
}

function renderStaffTable(staff) {
  if (!staff.length) {
    return '<div class="admin-empty">Chưa có nhân viên. Hãy promote một tài khoản lên vai trò Staff trong phần Quản lý tài khoản.</div>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Liên hệ</th>
            <th>Chuyên môn</th>
            <th>KN</th>
            <th>Đánh giá</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${staff.map(renderStaffRow).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStaffRow(member) {
  return `
    <tr>
      <td>${escapeHtml(member.fullName)}</td>
      <td>
        ${escapeHtml(member.email)}<br>
        <span class="muted">${escapeHtml(member.phone)}</span>
      </td>
      <td>
        <input type="text" class="admin-input" data-staff-field="expertise" data-id="${escapeHtml(member.id)}"
          value="${escapeHtml(member.expertise)}" placeholder="Vd: Chuyên gia cắt tỉa Poodle">
      </td>
      <td>
        <input type="number" min="0" max="80" class="admin-input admin-input--small"
          data-staff-field="yearsOfExperience" data-id="${escapeHtml(member.id)}"
          value="${member.yearsOfExperience}">
      </td>
      <td>${Number(member.rating || 0).toFixed(1)}</td>
      <td>
        <select data-staff-field="status" data-id="${escapeHtml(member.id)}" class="admin-select">
          <option value="active" ${member.status === "active" ? "selected" : ""}>Sẵn sàng</option>
          <option value="on_leave" ${member.status === "on_leave" ? "selected" : ""}>Nghỉ phép</option>
          <option value="inactive" ${member.status === "inactive" ? "selected" : ""}>Không hoạt động</option>
        </select>
      </td>
      <td>
        <div class="inline-actions">
          <button type="button" data-staff-action="save" data-id="${escapeHtml(member.id)}">Lưu</button>
        </div>
      </td>
    </tr>
  `;
}

/* ================================================================
   Render: Reports
================================================================ */

function renderReports() {
  const report = state.report;
  if (!report) {
    return `
      ${renderViewHeader("Báo cáo thống kê", "Backend chưa chạy hoặc chưa có dữ liệu.")}
      <section class="activity-panel"><div class="admin-empty">Chưa có dữ liệu báo cáo.</div></section>
    `;
  }

  return `
    ${renderViewHeader(
      "Báo cáo thống kê",
      "Doanh thu, lịch hẹn và xếp hạng hiệu suất.",
      '<button type="button" class="admin-action-button" data-admin-action="export-report">Xuất JSON</button>',
    )}

    ${renderRevenueSection(report)}
    ${renderOperationsSection(report)}
    ${renderRankingsSection(report)}
  `;
}

function renderRevenueSection(report) {
  const r = report.revenue;
  const total = r.total || 1;
  const servicePct = (r.service / total) * 100;
  const productPct = (r.product / total) * 100;

  const dailyRows = r.daily.length
    ? r.daily
        .map(
          (d) => `
            <tr>
              <td>${escapeHtml(d.day)}</td>
              <td>${formatNumber(d.invoices)}</td>
              <td>${formatCurrency(d.revenue)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="3" class="muted">Chưa có doanh thu trong 14 ngày qua.</td></tr>';

  const monthlyRows = r.monthly.length
    ? r.monthly
        .map(
          (m) => `
            <tr>
              <td>${escapeHtml(m.month)}</td>
              <td>${formatNumber(m.invoices)}</td>
              <td>${formatCurrency(m.revenue)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="3" class="muted">Chưa có doanh thu trong 6 tháng qua.</td></tr>';

  return `
    <section class="activity-panel">
      <div class="activity-panel__heading">
        <div>
          <h2>Doanh thu</h2>
          <p>Tổng hợp từ HoaDon đã thanh toán (TrangThaiThanhToan = 'Paid').</p>
        </div>
      </div>

      <div class="metrics-grid">
        <article class="metric-card">
          <p>Tổng doanh thu</p>
          <strong>${formatCurrency(r.total)}</strong>
        </article>
        <article class="metric-card metric-card--blue">
          <p>Doanh thu Dịch vụ</p>
          <strong>${formatCurrency(r.service)}</strong>
          <span>${servicePct.toFixed(1)}% tổng</span>
        </article>
        <article class="metric-card metric-card--yellow">
          <p>Doanh thu Sản phẩm</p>
          <strong>${formatCurrency(r.product)}</strong>
          <span>${productPct.toFixed(1)}% tổng</span>
        </article>
      </div>

      <div class="revenue-bar" aria-label="Tỉ lệ dịch vụ vs sản phẩm">
        <div class="revenue-bar__service" style="width:${servicePct}%" title="Dịch vụ ${servicePct.toFixed(1)}%"></div>
        <div class="revenue-bar__product" style="width:${productPct}%" title="Sản phẩm ${productPct.toFixed(1)}%"></div>
      </div>
      <div class="revenue-legend">
        <span><i class="dot dot--service"></i> Dịch vụ</span>
        <span><i class="dot dot--product"></i> Sản phẩm</span>
      </div>

      <div class="report-grid">
        <div>
          <h3>Doanh thu 14 ngày qua</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Ngày</th><th>Hóa đơn</th><th>Doanh thu</th></tr></thead>
              <tbody>${dailyRows}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h3>Doanh thu 6 tháng qua</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tháng</th><th>Hóa đơn</th><th>Doanh thu</th></tr></thead>
              <tbody>${monthlyRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderOperationsSection(report) {
  const a = report.appointments;
  return `
    <section class="activity-panel">
      <div class="activity-panel__heading">
        <div>
          <h2>Hoạt động lịch hẹn</h2>
          <p>Tỉ lệ hủy: ${formatPercent(a.cancellationRate)}</p>
        </div>
      </div>
      <div class="metrics-grid">
        <article class="metric-card">
          <p>Tổng lịch hẹn</p>
          <strong>${formatNumber(a.total)}</strong>
        </article>
        <article class="metric-card metric-card--blue">
          <p>Hoàn thành</p>
          <strong>${formatNumber(a.completed)}</strong>
        </article>
        <article class="metric-card metric-card--yellow">
          <p>Chờ xử lý</p>
          <strong>${formatNumber(a.pending)}</strong>
        </article>
        <article class="metric-card metric-card--danger">
          <p>Đã hủy</p>
          <strong>${formatNumber(a.cancelled)}</strong>
        </article>
      </div>
    </section>
  `;
}

function renderRankingsSection(report) {
  const r = report.rankings;

  const staffRows = r.topStaff.length
    ? r.topStaff
        .map(
          (s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>
                <strong>${escapeHtml(s.fullName)}</strong>
                <div class="muted">${escapeHtml(s.expertise || "Chưa có chuyên môn")}</div>
              </td>
              <td>${formatNumber(s.completedAppointments)}</td>
              <td>${formatCurrency(s.totalRevenue)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="4" class="muted">Chưa có dữ liệu nhân viên.</td></tr>';

  const serviceRows = r.topServices.length
    ? r.topServices
        .map(
          (s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${escapeHtml(s.name)}</td>
              <td>${formatNumber(s.bookingCount)}</td>
              <td>${formatCurrency(s.price)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="4" class="muted">Chưa có dịch vụ nào được đặt.</td></tr>';

  const productRows = r.topProducts.length
    ? r.topProducts
        .map(
          (p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>
                <strong>${escapeHtml(p.name)}</strong>
                <div class="muted">${escapeHtml(p.category || "")}</div>
              </td>
              <td>${formatNumber(p.totalSold)}</td>
              <td>${formatNumber(p.stock)}</td>
              <td>${formatCurrency(p.totalRevenue)}</td>
            </tr>
          `,
        )
        .join("")
    : '<tr><td colspan="5" class="muted">Chưa có sản phẩm nào được bán.</td></tr>';

  return `
    <section class="activity-panel">
      <div class="activity-panel__heading">
        <div>
          <h2>Xếp hạng hiệu suất</h2>
          <p>Top 5 nhân viên, dịch vụ và sản phẩm.</p>
        </div>
      </div>

      <div class="report-grid">
        <div>
          <h3>Top nhân viên (theo doanh thu)</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Nhân viên</th><th>Lịch hoàn thành</th><th>Doanh thu</th></tr></thead>
              <tbody>${staffRows}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h3>Top dịch vụ (theo lượt đặt)</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Dịch vụ</th><th>Lượt đặt</th><th>Giá</th></tr></thead>
              <tbody>${serviceRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <h3 style="margin-top:1.5rem">Top sản phẩm bán chạy</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Sản phẩm</th><th>Đã bán</th><th>Tồn kho</th><th>Doanh thu</th></tr></thead>
          <tbody>${productRows}</tbody>
        </table>
      </div>
    </section>
  `;
}

/* ================================================================
   Render dispatcher
================================================================ */

function renderCurrentView() {
  updateActiveNav(state.currentView);
  const renderers = {
    dashboard: renderDashboard,
    users: renderUsers,
    staff: renderStaff,
    reports: renderReports,
  };
  contentRoot.innerHTML = (renderers[state.currentView] || renderDashboard)();
}

/* ================================================================
   Actions
================================================================ */

async function reloadData() {
  createToast("Đang tải lại dữ liệu admin...");
  await loadAdminData();
  renderCurrentView();
}

async function changeUserRole(id, role) {
  const user = state.users.find((u) => u.id === id);
  if (!user || user.role === role) return;

  if (
    !window.confirm(
      `Đổi vai trò của ${user.fullName} từ "${ROLE_LABELS[user.role]}" sang "${ROLE_LABELS[role]}"?`,
    )
  ) {
    renderCurrentView();
    return;
  }

  try {
    const updated = await apiRequest(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    Object.assign(user, updated);
    createToast("Đã cập nhật vai trò.", "success");
    // Promote -> staff: tai lai staff list
    if (role === "staff") {
      try {
        state.staff = await apiRequest("/staff");
      } catch (_) { /* ignore */ }
    }
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
    renderCurrentView();
  }
}

async function setUserLockState(id, lock) {
  const user = state.users.find((u) => u.id === id);
  if (!user) return;
  const verb = lock ? "khóa" : "mở khóa";

  if (!window.confirm(`Bạn chắc chắn muốn ${verb} tài khoản ${user.fullName}?`)) {
    return;
  }

  try {
    const action = lock ? "lock" : "unlock";
    const result = await apiRequest(`/users/${id}/${action}`, { method: "POST" });
    Object.assign(user, result);

    if (lock && result.clerk?.skipped) {
      createToast(`Đã khóa trong DB. Lưu ý: chưa cấu hình CLERK_SECRET_KEY nên không revoke session Clerk được.`, "warning");
    } else if (lock && result.clerk?.revoked > 0) {
      createToast(`Đã khóa tài khoản và đăng xuất ${result.clerk.revoked} session khỏi Clerk.`, "success");
    } else {
      createToast(`Đã ${verb} tài khoản.`, "success");
    }
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

async function saveStaffMember(id) {
  const member = state.staff.find((s) => s.id === id);
  if (!member) return;

  const expertiseInput = document.querySelector(`[data-staff-field="expertise"][data-id="${id}"]`);
  const yearsInput = document.querySelector(`[data-staff-field="yearsOfExperience"][data-id="${id}"]`);
  const statusInput = document.querySelector(`[data-staff-field="status"][data-id="${id}"]`);

  const payload = {
    expertise: expertiseInput?.value.trim() ?? member.expertise,
    yearsOfExperience: Number(yearsInput?.value || 0),
    status: statusInput?.value || member.status,
  };

  try {
    const updated = await apiRequest(`/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    Object.assign(member, updated);
    createToast("Đã lưu hồ sơ nhân viên.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

function exportReport() {
  if (!state.report) {
    createToast("Chưa có dữ liệu báo cáo.", "warning");
    return;
  }
  const blob = new Blob([JSON.stringify(state.report, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mypuppy-admin-report-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  createToast("Đã xuất báo cáo JSON.", "success");
}

function handleAdminAction(action) {
  const actions = {
    reload: reloadData,
    "export-report": exportReport,
    help: () => createToast("Liên hệ team backend nếu cần hỗ trợ."),
    messages: () => createToast("Bạn chưa có tin nhắn quản trị mới."),
    notifications: () => {
      const overview = state.report?.overview;
      const pending = overview?.pendingAppointments ?? 0;
      createToast(`Có ${pending} lịch hẹn đang chờ xử lý.`);
    },
    settings: () => createToast("Cài đặt admin sẽ được tách ra trang riêng sau."),
    profile: () => createToast("Hồ sơ quản trị viên đang dùng tài khoản đăng nhập."),
  };
  actions[action]?.();
}

/* ================================================================
   Bind UI
================================================================ */

function bindAdminUi() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      state.currentView = link.dataset.adminView;
      window.history.replaceState(null, "", `#${state.currentView}`);
      renderCurrentView();
    });
  });

  document.addEventListener("click", (event) => {
    const viewTrigger = event.target.closest("[data-admin-view]");
    const actionTrigger = event.target.closest("[data-admin-action]");
    const userAction = event.target.closest("[data-user-action]");
    const staffAction = event.target.closest("[data-staff-action]");

    if (viewTrigger && !viewTrigger.classList.contains("nav-link")) {
      state.currentView = viewTrigger.dataset.adminView;
      window.history.replaceState(null, "", `#${state.currentView}`);
      renderCurrentView();
      return;
    }

    if (actionTrigger) {
      event.preventDefault();
      handleAdminAction(actionTrigger.dataset.adminAction);
      return;
    }

    if (userAction) {
      const { id, userAction: action } = userAction.dataset;
      if (action === "lock") setUserLockState(id, true);
      if (action === "unlock") setUserLockState(id, false);
      return;
    }

    if (staffAction) {
      const { id, staffAction: action } = staffAction.dataset;
      if (action === "save") saveStaffMember(id);
    }
  });

  document.addEventListener("change", (event) => {
    const roleSelect = event.target.closest("[data-user-role]");
    if (roleSelect) {
      changeUserRole(roleSelect.dataset.id, roleSelect.value);
    }
  });

  if (globalSearchInput) {
    globalSearchInput.addEventListener("input", () => {
      state.search = normalizeText(globalSearchInput.value);
      if (!["users", "staff"].includes(state.currentView)) {
        state.currentView = "users";
      }
      renderCurrentView();
    });
  }
}

/* ================================================================
   Auth + Init
================================================================ */

async function initAdminAuth() {
  if (!window.MyPuppyAuth) return true;

  try {
    await window.MyPuppyAuth.requireRole("admin");
    return true;
  } catch (error) {
    console.warn("Kiem tra quyen admin Clerk that bai:", error);
    if (sessionStorage.getItem("mypuppy_admin_logged_in") !== "true") {
      window.location.href = "../customer/pages/auth/dang-nhap.html";
      return false;
    }
    return true;
  }
}

if (logoutButton) {
  logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (window.MyPuppyAuth) {
      window.MyPuppyAuth.signOut("../customer/index.html");
      return;
    }
    sessionStorage.clear();
    window.location.href = "../customer/index.html";
  });
}

async function initAdminPage() {
  const canAccess = await initAdminAuth();
  if (!canAccess || !contentRoot) return;

  bindAdminUi();

  const hashView = window.location.hash.replace("#", "");
  if (["dashboard", "users", "staff", "reports"].includes(hashView)) {
    state.currentView = hashView;
  }

  contentRoot.innerHTML = `
    <section class="activity-panel">
      <div class="admin-empty">Đang tải dữ liệu quản trị...</div>
    </section>
  `;

  await loadAdminData();
  renderCurrentView();
}

initAdminPage();
