const ADMIN_API_BASE = window.MyPuppyAdminApiBase || "http://localhost:4000/api/admin";

const logoutButton = document.getElementById("admin-logout");
const contentRoot = document.getElementById("admin-content");
const globalSearchInput = document.getElementById("admin-global-search");
const navLinks = document.querySelectorAll("[data-admin-view]");

const fallbackData = {
  dashboard: {
    overview: {
      totalUsers: 1284,
      activeUsers: 1160,
      pendingUsers: 24,
      totalStaff: 28,
      activeStaff: 28,
      reportCount: 12,
    },
    modules: [
      { key: "auth", name: "Xác thực đăng nhập", status: "ready" },
      { key: "users", name: "Tài khoản người dùng", status: "ready" },
      { key: "staff", name: "Quản lý nhân viên", status: "ready" },
      { key: "reports", name: "Báo cáo thống kê", status: "ready" },
    ],
    recentActivities: [
      { id: "activity-001", title: "Tài khoản mới", owner: "Nguyễn Thu Hà", status: "pending", time: "10:30" },
      { id: "activity-002", title: "Cập nhật nhân viên", owner: "Trần Văn Hùng", status: "done", time: "13:15" },
      { id: "activity-003", title: "Báo cáo tháng", owner: "Lê Minh Quân", status: "review", time: "16:45" },
    ],
  },
  users: [
    { id: "user-001", fullName: "Nguyễn Thu Hà", email: "ha.nguyen@example.com", role: "customer", status: "pending" },
    { id: "user-002", fullName: "Trần Văn Hùng", email: "hung.tran@example.com", role: "staff", status: "active" },
    { id: "user-003", fullName: "Lê Minh Quân", email: "quan.le@example.com", role: "admin", status: "active" },
  ],
  staff: [
    { id: "staff-001", fullName: "Mai Groomer", email: "mai.groomer@mypuppy.vn", phone: "0901234567", position: "Grooming Specialist", shift: "Sáng", status: "active" },
    { id: "staff-002", fullName: "Trần Văn Hùng", email: "hung.staff@mypuppy.vn", phone: "0918222090", position: "Veterinary Assistant", shift: "Chiều", status: "active" },
    { id: "staff-003", fullName: "Lê Thị Hoa", email: "hoa.spa@mypuppy.vn", phone: "0987333112", position: "Spa Specialist", shift: "Tối", status: "inactive" },
  ],
};

const state = {
  backendOnline: false,
  currentView: "dashboard",
  search: "",
  dashboard: fallbackData.dashboard,
  users: [...fallbackData.users],
  staff: [...fallbackData.staff],
  report: null,
};

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

function getStatusLabel(status) {
  const labels = {
    active: "Hoạt động",
    inactive: "Tạm nghỉ",
    pending: "Chờ duyệt",
    locked: "Đã khóa",
    on_leave: "Nghỉ phép",
    ready: "Sẵn sàng",
    done: "Hoàn thành",
    review: "Rà soát",
  };

  return labels[status] || status || "Không rõ";
}

function getStatusClass(status) {
  if (["active", "done", "ready"].includes(status)) return "status status--done";
  if (["pending", "review"].includes(status)) return "status status--pending";
  if (["locked", "inactive", "on_leave"].includes(status)) return "status status--danger";
  return "status status--ok";
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 3500);

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

function filterItems(items, fields) {
  if (!state.search) return items;

  return items.filter((item) =>
    fields.some((field) => normalizeText(item[field]).includes(state.search)),
  );
}

async function loadAdminData() {
  try {
    const [dashboard, users, staff, report] = await Promise.all([
      apiRequest("/dashboard"),
      apiRequest("/users"),
      apiRequest("/staff"),
      apiRequest("/reports/summary"),
    ]);

    state.dashboard = dashboard;
    state.users = users;
    state.staff = staff;
    state.report = report;
    createToast("Đã kết nối backend admin.", "success");
  } catch (error) {
    state.backendOnline = false;
    state.dashboard = fallbackData.dashboard;
    state.users = [...fallbackData.users];
    state.staff = [...fallbackData.staff];
    state.report = buildFallbackReport();
    createToast("Backend admin chưa chạy, đang dùng dữ liệu demo.", "warning");
  }
}

function buildFallbackReport() {
  const countBy = (items, key) =>
    items.reduce((result, item) => {
      result[item[key]] = (result[item[key]] || 0) + 1;
      return result;
    }, {});

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: state.users.length,
      byStatus: countBy(state.users, "status"),
      byRole: countBy(state.users, "role"),
    },
    staff: {
      total: state.staff.length,
      byStatus: countBy(state.staff, "status"),
    },
    operations: {
      monthlyReports: state.dashboard.overview.reportCount,
      pendingApprovals: state.dashboard.overview.pendingUsers,
      satisfactionScore: 4.9,
    },
  };
}

function updateActiveNav(view) {
  navLinks.forEach((link) => {
    link.classList.toggle("nav-link--active", link.dataset.adminView === view);
  });
}

function renderCurrentView() {
  updateActiveNav(state.currentView);

  const renderers = {
    dashboard: renderDashboard,
    system: renderSystem,
    users: renderUsers,
    staff: renderStaff,
    reports: renderReports,
  };

  const renderer = renderers[state.currentView] || renderDashboard;
  contentRoot.innerHTML = renderer();
}

function renderViewHeader(title, description, actions = "") {
  return `
    <section class="admin-view-header">
      <div>
        <p>${state.backendOnline ? "Backend đang kết nối" : "Chế độ dữ liệu demo"}</p>
        <h2>${escapeHtml(title)}</h2>
        <span>${escapeHtml(description)}</span>
      </div>
      <div class="admin-view-actions">${actions}</div>
    </section>
  `;
}

function renderDashboard() {
  const overview = state.dashboard.overview;
  const activities = state.dashboard.recentActivities || [];

  return `
    <section class="metrics-grid" aria-label="Chỉ số quản trị">
      <article class="metric-card">
        <p>Tài khoản người dùng</p>
        <strong>${overview.totalUsers}</strong>
        <span>${overview.pendingUsers} tài khoản đang chờ duyệt</span>
      </article>
      <article class="metric-card metric-card--blue">
        <p>Nhân viên hoạt động</p>
        <strong>${overview.activeStaff}</strong>
        <span>${overview.totalStaff} nhân viên trong hệ thống</span>
      </article>
      <article class="metric-card">
        <p>Báo cáo tháng</p>
        <strong>${overview.reportCount}</strong>
        <span>Doanh thu, nhân sự và dịch vụ</span>
      </article>
      <article class="metric-card metric-card--yellow">
        <p>Chờ duyệt</p>
        <strong>${overview.pendingUsers}</strong>
        <span>Cần quản trị viên xem xét</span>
      </article>
    </section>

    <section class="admin-panel-grid" aria-label="Chức năng quản trị">
      <article class="admin-panel admin-panel--clickable" data-admin-view="users">
        <p>Quản lý tài khoản</p>
        <h2>Kiểm soát người dùng hệ thống</h2>
        <span>Xem, thêm, sửa trạng thái và khóa tài khoản người dùng.</span>
      </article>
      <article class="admin-panel admin-panel--clickable" data-admin-view="staff">
        <p>Quản lý nhân viên</p>
        <h2>Theo dõi đội ngũ nội bộ</h2>
        <span>Cập nhật hồ sơ, chức vụ, ca làm việc và trạng thái nhân viên.</span>
      </article>
      <article class="admin-panel admin-panel--clickable" data-admin-view="reports">
        <p>Báo cáo thống kê</p>
        <h2>Ra quyết định từ dữ liệu</h2>
        <span>Xem báo cáo tổng hợp và xuất dữ liệu JSON.</span>
      </article>
    </section>

    <section class="activity-panel">
      <div class="activity-panel__heading">
        <div>
          <h2>Hoạt động gần đây</h2>
          <p>Dữ liệu được tải từ backend admin hoặc dữ liệu demo khi backend chưa chạy.</p>
        </div>
        <button type="button" data-admin-action="export-report">Xuất báo cáo</button>
      </div>
      ${renderActivityTable(activities)}
    </section>
  `;
}

function renderActivityTable(activities) {
  const rows = activities
    .map(
      (activity) => `
        <tr>
          <td>${escapeHtml(activity.title)}</td>
          <td>${escapeHtml(activity.owner)}</td>
          <td>${escapeHtml(activity.time)}</td>
          <td><span class="${getStatusClass(activity.status)}">${getStatusLabel(activity.status)}</span></td>
        </tr>
      `,
    )
    .join("");

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Hạng mục</th>
            <th>Người phụ trách</th>
            <th>Thời gian</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSystem() {
  const modules = state.dashboard.modules || [];

  return `
    ${renderViewHeader(
      "Quản lý hệ thống",
      "Kiểm tra tình trạng các module lõi của backend admin.",
      '<button type="button" class="admin-action-button" data-admin-action="reload">Kiểm tra lại</button>',
    )}
    <section class="activity-panel">
      <div class="activity-panel__heading">
        <div>
          <h2>Trạng thái hệ thống</h2>
          <p>${state.backendOnline ? "Backend admin đang phản hồi bình thường." : "Backend chưa chạy, đang hiển thị trạng thái demo."}</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Mã</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${modules
              .map(
                (module) => `
                  <tr>
                    <td>${escapeHtml(module.name)}</td>
                    <td>${escapeHtml(module.key)}</td>
                    <td><span class="${getStatusClass(module.status)}">${getStatusLabel(module.status)}</span></td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderUsers() {
  const users = filterItems(state.users, ["fullName", "email", "role", "status"]);

  return `
    ${renderViewHeader(
      "Tài khoản người dùng",
      "Quản lý tài khoản, vai trò và trạng thái truy cập của người dùng.",
      '<button type="button" class="admin-action-button" data-admin-action="create-user">Thêm tài khoản</button>',
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
            <th>Người dùng</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (user) => `
                <tr>
                  <td>${escapeHtml(user.fullName)}</td>
                  <td>${escapeHtml(user.email)}</td>
                  <td>${escapeHtml(user.role)}</td>
                  <td><span class="${getStatusClass(user.status)}">${getStatusLabel(user.status)}</span></td>
                  <td>
                    <div class="inline-actions">
                      <button type="button" data-user-action="activate" data-id="${escapeHtml(user.id)}">Duyệt</button>
                      <button type="button" data-user-action="lock" data-id="${escapeHtml(user.id)}">Khóa</button>
                      <button type="button" data-user-action="delete" data-id="${escapeHtml(user.id)}">Xóa</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStaff() {
  const staff = filterItems(state.staff, ["fullName", "email", "position", "status"]);

  return `
    ${renderViewHeader(
      "Quản lý nhân viên",
      "Quản lý hồ sơ, chức vụ, ca làm việc và trạng thái nhân viên.",
      '<button type="button" class="admin-action-button" data-admin-action="create-staff">Thêm nhân viên</button>',
    )}
    <section class="activity-panel">
      ${renderStaffTable(staff)}
    </section>
  `;
}

function renderStaffTable(staff) {
  if (!staff.length) {
    return '<div class="admin-empty">Không tìm thấy nhân viên phù hợp.</div>';
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Email</th>
            <th>Chức vụ</th>
            <th>Ca làm</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${staff
            .map(
              (member) => `
                <tr>
                  <td>${escapeHtml(member.fullName)}</td>
                  <td>${escapeHtml(member.email)}</td>
                  <td>${escapeHtml(member.position)}</td>
                  <td>${escapeHtml(member.shift)}</td>
                  <td><span class="${getStatusClass(member.status)}">${getStatusLabel(member.status)}</span></td>
                  <td>
                    <div class="inline-actions">
                      <button type="button" data-staff-action="activate" data-id="${escapeHtml(member.id)}">Kích hoạt</button>
                      <button type="button" data-staff-action="leave" data-id="${escapeHtml(member.id)}">Nghỉ phép</button>
                      <button type="button" data-staff-action="delete" data-id="${escapeHtml(member.id)}">Xóa</button>
                    </div>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderReports() {
  const report = state.report || buildFallbackReport();

  return `
    ${renderViewHeader(
      "Báo cáo thống kê",
      "Tổng hợp nhanh tài khoản, nhân viên và tình trạng vận hành.",
      '<button type="button" class="admin-action-button" data-admin-action="export-report">Xuất JSON</button>',
    )}
    <section class="metrics-grid" aria-label="Chỉ số báo cáo">
      <article class="metric-card">
        <p>Tổng tài khoản</p>
        <strong>${report.users.total}</strong>
        <span>Admin: ${report.users.byRole.admin || 0}, nhân viên: ${report.users.byRole.staff || 0}, khách hàng: ${report.users.byRole.customer || 0}</span>
      </article>
      <article class="metric-card metric-card--blue">
        <p>Tổng nhân viên</p>
        <strong>${report.staff.total}</strong>
        <span>Đang hoạt động: ${report.staff.byStatus.active || 0}</span>
      </article>
      <article class="metric-card metric-card--yellow">
        <p>Chờ duyệt</p>
        <strong>${report.operations.pendingApprovals}</strong>
        <span>Tài khoản cần kiểm tra</span>
      </article>
      <article class="metric-card">
        <p>Đánh giá</p>
        <strong>${report.operations.satisfactionScore}</strong>
        <span>Điểm hài lòng trung bình</span>
      </article>
    </section>
  `;
}

async function reloadData() {
  createToast("Đang tải lại dữ liệu admin...");
  await loadAdminData();
  renderCurrentView();
}

async function updateUserStatus(id, status) {
  const user = state.users.find((item) => item.id === id);
  if (!user) return;

  try {
    const updatedUser = state.backendOnline
      ? await apiRequest(`/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        })
      : { ...user, status };

    Object.assign(user, updatedUser);
    createToast("Đã cập nhật tài khoản.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

async function deleteUser(id) {
  if (!window.confirm("Bạn chắc chắn muốn xóa tài khoản này?")) return;

  try {
    if (state.backendOnline) {
      await apiRequest(`/users/${id}`, { method: "DELETE" });
    }

    state.users = state.users.filter((user) => user.id !== id);
    createToast("Đã xóa tài khoản.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

async function createUser() {
  const fullName = window.prompt("Nhập họ tên người dùng:");
  if (!fullName) return;

  const email = window.prompt("Nhập email người dùng:");
  if (!email) return;

  const role = window.prompt("Nhập vai trò: admin, staff hoặc customer", "customer");
  if (!role) return;

  try {
    const createdUser = state.backendOnline
      ? await apiRequest("/users", {
          method: "POST",
          body: JSON.stringify({ fullName, email, role, status: "pending" }),
        })
      : {
          id: `user-${Date.now()}`,
          fullName,
          email,
          role,
          status: "pending",
        };

    state.users.push(createdUser);
    createToast("Đã thêm tài khoản mới.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

async function updateStaffStatus(id, status) {
  const member = state.staff.find((item) => item.id === id);
  if (!member) return;

  try {
    const updatedMember = state.backendOnline
      ? await apiRequest(`/staff/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        })
      : { ...member, status };

    Object.assign(member, updatedMember);
    createToast("Đã cập nhật nhân viên.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

async function deleteStaffMember(id) {
  if (!window.confirm("Bạn chắc chắn muốn xóa nhân viên này?")) return;

  try {
    if (state.backendOnline) {
      await apiRequest(`/staff/${id}`, { method: "DELETE" });
    }

    state.staff = state.staff.filter((member) => member.id !== id);
    createToast("Đã xóa nhân viên.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

async function createStaffMember() {
  const fullName = window.prompt("Nhập họ tên nhân viên:");
  if (!fullName) return;

  const email = window.prompt("Nhập email nhân viên:");
  if (!email) return;

  const position = window.prompt("Nhập chức vụ:", "Grooming Specialist");
  if (!position) return;

  try {
    const createdMember = state.backendOnline
      ? await apiRequest("/staff", {
          method: "POST",
          body: JSON.stringify({ fullName, email, position, shift: "Flexible", status: "active" }),
        })
      : {
          id: `staff-${Date.now()}`,
          fullName,
          email,
          phone: "",
          position,
          shift: "Flexible",
          status: "active",
        };

    state.staff.push(createdMember);
    createToast("Đã thêm nhân viên mới.", "success");
    renderCurrentView();
  } catch (error) {
    createToast(error.message, "error");
  }
}

function exportReport() {
  const data = state.report || buildFallbackReport();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
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
    "create-user": createUser,
    "create-staff": createStaffMember,
    "export-report": exportReport,
    help: () => createToast("Khu vực trợ giúp sẽ được phát triển ở bước tiếp theo."),
    messages: () => createToast("Bạn chưa có tin nhắn quản trị mới."),
    notifications: () => createToast("Có 4 yêu cầu đang chờ duyệt."),
    settings: () => createToast("Cài đặt admin sẽ được tách thành trang riêng sau."),
    profile: () => createToast("Hồ sơ quản trị viên đang dùng tài khoản demo."),
  };

  if (actions[action]) {
    actions[action]();
  }
}

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
      if (action === "activate") updateUserStatus(id, "active");
      if (action === "lock") updateUserStatus(id, "locked");
      if (action === "delete") deleteUser(id);
      return;
    }

    if (staffAction) {
      const { id, staffAction: action } = staffAction.dataset;
      if (action === "activate") updateStaffStatus(id, "active");
      if (action === "leave") updateStaffStatus(id, "on_leave");
      if (action === "delete") deleteStaffMember(id);
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

async function initAdminAuth() {
  if (!window.MyPuppyAuth) {
    return true;
  }

  try {
    await window.MyPuppyAuth.requireRole("admin");
    return true;
  } catch (error) {
    console.warn("Kiểm tra quyền quản trị bằng Clerk không thành công, chuyển sang phiên đăng nhập demo cục bộ.", error);

    if (sessionStorage.getItem("mypuppy_admin_logged_in") !== "true") {
      window.location.href = "../customer/pages/dang-nhap.html";
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

    sessionStorage.removeItem("mypuppy_customer_logged_in");
    sessionStorage.removeItem("mypuppy_customer_name");
    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");
    sessionStorage.removeItem("mypuppy_auth_role");
    sessionStorage.removeItem("mypuppy_auth_name");
    window.location.href = "../customer/index.html";
  });
}

async function initAdminPage() {
  const canAccess = await initAdminAuth();

  if (!canAccess || !contentRoot) {
    return;
  }

  bindAdminUi();

  const hashView = window.location.hash.replace("#", "");
  if (["dashboard", "system", "users", "staff", "reports"].includes(hashView)) {
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
