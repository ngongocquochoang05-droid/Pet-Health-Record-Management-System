const STAFF_API_BASE = window.MyPuppyStaffApiBase || "http://localhost:4001/staff";

const staffLoginPanel = document.getElementById("staff-login-panel");
const staffWorkspace = document.getElementById("staff-workspace");
const staffQuickLogin = document.getElementById("staff-quick-login");
const staffLogout = document.getElementById("staff-logout");
const staffName = document.getElementById("staff-name");
const staffContent = document.getElementById("staff-content");
const staffNavLinks = document.querySelectorAll("[data-staff-view]");

/* ============================================================
   API client
============================================================ */

async function apiGet(path) {
  const response = await fetch(`${STAFF_API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} thất bại: ${response.status}`);
  }
  return response.json();
}

/* ============================================================
   UI helpers
============================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return String(value);
  }
}

function showStaffWorkspace(name = "Mai Groomer") {
  if (staffName) staffName.textContent = name;
  if (staffLoginPanel) staffLoginPanel.classList.add("hidden");
  if (staffWorkspace) {
    staffWorkspace.classList.remove("hidden");
    staffWorkspace.classList.add("flex");
  }
}

function showStaffLogin() {
  if (staffWorkspace) {
    staffWorkspace.classList.add("hidden");
    staffWorkspace.classList.remove("flex");
  }
  if (staffLoginPanel) staffLoginPanel.classList.remove("hidden");
}

/* ============================================================
   Render views
============================================================ */

function renderTableShell({ eyebrow, title, description, columns, bodyHtml, searchPlaceholder = "" }) {
  return `
    <section class="flex flex-col gap-4 border border-white/10 bg-black/20 p-6 backdrop-blur-lg md:flex-row md:items-center md:justify-between rounded-[1.75rem]">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.35em] text-sky-300">${eyebrow}</p>
        <h2 class="mt-3 text-3xl font-extrabold md:text-5xl">${title}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-white/60">${description}</p>
      </div>
      ${searchPlaceholder ? `
      <label class="relative w-full max-w-md">
        <span class="sr-only">Tìm kiếm</span>
        <input class="w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white placeholder:text-white/45 outline-none transition focus:border-sky-300/70 focus:bg-white/15" type="search" placeholder="${searchPlaceholder}">
      </label>` : ""}
    </section>

    <div class="overflow-x-auto rounded-[1.75rem] border border-white/10 bg-black/35 p-6 shadow-2xl backdrop-blur-xl">
      <table class="w-full min-w-[860px] text-left text-sm">
        <thead class="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-white/45">
          <tr>${columns.map((c) => `<th class="pb-4">${c}</th>`).join("")}</tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-white/75">
          ${bodyHtml}
        </tbody>
      </table>
    </div>
  `;
}

function renderLoading() {
  return `<tr><td colspan="10" class="py-6 text-center text-white/55">Đang tải dữ liệu...</td></tr>`;
}

function renderEmpty(message = "Chưa có dữ liệu") {
  return `<tr><td colspan="10" class="py-6 text-center text-white/55">${message}</td></tr>`;
}

function renderError(message) {
  return `<tr><td colspan="10" class="py-6 text-center text-rose-300">Lỗi: ${escapeHtml(message)}</td></tr>`;
}

/* ============================================================
   Per-view loaders
============================================================ */

async function loadCustomers() {
  staffContent.innerHTML = renderTableShell({
    eyebrow: "Quản lý khách hàng",
    title: "Danh sách khách hàng",
    description: "Tra cứu và quản lý thông tin khách hàng đã đồng bộ từ Clerk.",
    searchPlaceholder: "Tìm theo tên, email hoặc SĐT...",
    columns: ["Tên khách", "Email", "SĐT", "Địa chỉ"],
    bodyHtml: renderLoading(),
  });

  try {
    const data = await apiGet("/customers");
    const rows = data.length === 0
      ? renderEmpty("Chưa có khách hàng nào.")
      : data.map((c) => `
          <tr>
            <td class="py-4"><strong class="block text-white">${escapeHtml(c.name)}</strong></td>
            <td class="py-4">${escapeHtml(c.email)}</td>
            <td class="py-4">${escapeHtml(c.phone)}</td>
            <td class="py-4">${escapeHtml(c.address || "—")}</td>
          </tr>
        `).join("");
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Quản lý khách hàng",
      title: "Danh sách khách hàng",
      description: `Tổng cộng ${data.length} khách hàng từ database.`,
      searchPlaceholder: "Tìm theo tên, email hoặc SĐT...",
      columns: ["Tên khách", "Email", "SĐT", "Địa chỉ"],
      bodyHtml: rows,
    });
  } catch (error) {
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Quản lý khách hàng",
      title: "Danh sách khách hàng",
      description: "Không kết nối được backend staff (port 4001). Hãy đảm bảo backend đang chạy.",
      columns: ["Tên khách", "Email", "SĐT", "Địa chỉ"],
      bodyHtml: renderError(error.message),
    });
  }
}

async function loadAppointments() {
  staffContent.innerHTML = renderTableShell({
    eyebrow: "Quản lý lịch hẹn",
    title: "Lịch hẹn cửa hàng",
    description: "Cập nhật trạng thái lịch hẹn của khách.",
    searchPlaceholder: "Tìm lịch hẹn...",
    columns: ["Khách hàng", "Thú cưng", "Dịch vụ", "Ngày", "Giờ", "Trạng thái"],
    bodyHtml: renderLoading(),
  });

  try {
    const data = await apiGet("/appointments");
    const rows = data.length === 0
      ? renderEmpty("Chưa có lịch hẹn nào.")
      : data.map((a) => `
          <tr>
            <td class="py-4"><span class="text-xs text-white/45">${escapeHtml(a.customer)}</span></td>
            <td class="py-4">${escapeHtml(a.pet)}</td>
            <td class="py-4">${escapeHtml(a.service)}</td>
            <td class="py-4">${formatDate(a.date)}</td>
            <td class="py-4">${escapeHtml(a.time || "—")}</td>
            <td class="py-4"><span class="status status--${a.status === "Completed" ? "done" : a.status === "Cancelled" ? "danger" : "pending"}">${escapeHtml(a.status)}</span></td>
          </tr>
        `).join("");
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Quản lý lịch hẹn",
      title: "Lịch hẹn cửa hàng",
      description: `Tổng cộng ${data.length} lịch hẹn.`,
      searchPlaceholder: "Tìm lịch hẹn...",
      columns: ["Khách hàng", "Thú cưng", "Dịch vụ", "Ngày", "Giờ", "Trạng thái"],
      bodyHtml: rows,
    });
  } catch (error) {
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Quản lý lịch hẹn",
      title: "Lịch hẹn cửa hàng",
      description: "Không kết nối được backend staff (port 4001).",
      columns: ["Khách hàng", "Thú cưng", "Dịch vụ", "Ngày", "Giờ", "Trạng thái"],
      bodyHtml: renderError(error.message),
    });
  }
}

async function loadPets() {
  staffContent.innerHTML = renderTableShell({
    eyebrow: "Hồ sơ thú cưng",
    title: "Quản lý thú cưng",
    description: "Theo dõi hồ sơ thú cưng của khách hàng.",
    searchPlaceholder: "Tìm thú cưng...",
    columns: ["Tên", "Loài", "Giống", "Tuổi", "Cân nặng", "Chủ"],
    bodyHtml: renderLoading(),
  });

  try {
    const data = await apiGet("/pets");
    const rows = data.length === 0
      ? renderEmpty("Chưa có thú cưng nào.")
      : data.map((p) => `
          <tr>
            <td class="py-4"><strong class="block text-white">${escapeHtml(p.name)}</strong></td>
            <td class="py-4">${escapeHtml(p.species)}</td>
            <td class="py-4">${escapeHtml(p.breed || "—")}</td>
            <td class="py-4">${p.age ?? "—"}</td>
            <td class="py-4">${p.weight ? `${p.weight} kg` : "—"}</td>
            <td class="py-4"><span class="text-xs text-white/45">${escapeHtml(p.owner)}</span></td>
          </tr>
        `).join("");
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Hồ sơ thú cưng",
      title: "Quản lý thú cưng",
      description: `Tổng cộng ${data.length} thú cưng.`,
      searchPlaceholder: "Tìm thú cưng...",
      columns: ["Tên", "Loài", "Giống", "Tuổi", "Cân nặng", "Chủ"],
      bodyHtml: rows,
    });
  } catch (error) {
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Hồ sơ thú cưng",
      title: "Quản lý thú cưng",
      description: "Không kết nối được backend staff (port 4001).",
      columns: ["Tên", "Loài", "Giống", "Tuổi", "Cân nặng", "Chủ"],
      bodyHtml: renderError(error.message),
    });
  }
}

async function loadServices() {
  staffContent.innerHTML = renderTableShell({
    eyebrow: "Dịch vụ",
    title: "Danh mục dịch vụ",
    description: "Quản lý các gói spa, grooming, khám chữa.",
    columns: ["Tên dịch vụ", "Mô tả", "Giá", "Thời gian (phút)"],
    bodyHtml: renderLoading(),
  });

  try {
    const data = await apiGet("/services");
    const rows = data.length === 0
      ? renderEmpty("Chưa có dịch vụ nào.")
      : data.map((s) => `
          <tr>
            <td class="py-4"><strong class="block text-white">${escapeHtml(s.name)}</strong></td>
            <td class="py-4">${escapeHtml(s.description || "—")}</td>
            <td class="py-4">${formatCurrency(s.price)}</td>
            <td class="py-4">${s.duration ?? "—"}</td>
          </tr>
        `).join("");
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Dịch vụ",
      title: "Danh mục dịch vụ",
      description: `Tổng cộng ${data.length} dịch vụ.`,
      columns: ["Tên dịch vụ", "Mô tả", "Giá", "Thời gian (phút)"],
      bodyHtml: rows,
    });
  } catch (error) {
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Dịch vụ",
      title: "Danh mục dịch vụ",
      description: "Không kết nối được backend staff (port 4001).",
      columns: ["Tên dịch vụ", "Mô tả", "Giá", "Thời gian (phút)"],
      bodyHtml: renderError(error.message),
    });
  }
}

async function loadProducts() {
  staffContent.innerHTML = renderTableShell({
    eyebrow: "Sản phẩm",
    title: "Tồn kho phụ kiện",
    description: "Quản lý sản phẩm bán tại quầy.",
    searchPlaceholder: "Tìm sản phẩm...",
    columns: ["Tên sản phẩm", "Loại", "Giá", "Tồn kho"],
    bodyHtml: renderLoading(),
  });

  try {
    const data = await apiGet("/products");
    const rows = data.length === 0
      ? renderEmpty("Chưa có sản phẩm nào.")
      : data.map((p) => `
          <tr>
            <td class="py-4"><strong class="block text-white">${escapeHtml(p.name)}</strong></td>
            <td class="py-4">${escapeHtml(p.category || "—")}</td>
            <td class="py-4">${formatCurrency(p.price)}</td>
            <td class="py-4">${p.stock}</td>
          </tr>
        `).join("");
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Sản phẩm",
      title: "Tồn kho phụ kiện",
      description: `Tổng cộng ${data.length} sản phẩm.`,
      searchPlaceholder: "Tìm sản phẩm...",
      columns: ["Tên sản phẩm", "Loại", "Giá", "Tồn kho"],
      bodyHtml: rows,
    });
  } catch (error) {
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Sản phẩm",
      title: "Tồn kho phụ kiện",
      description: "Không kết nối được backend staff (port 4001).",
      columns: ["Tên sản phẩm", "Loại", "Giá", "Tồn kho"],
      bodyHtml: renderError(error.message),
    });
  }
}

async function loadPayments() {
  staffContent.innerHTML = renderTableShell({
    eyebrow: "Thanh toán",
    title: "Danh sách hóa đơn",
    description: "Kiểm tra và xác nhận hóa đơn.",
    columns: ["Mã hóa đơn", "Lịch hẹn", "Số tiền", "Phương thức", "Trạng thái", "Ngày thanh toán"],
    bodyHtml: renderLoading(),
  });

  try {
    const data = await apiGet("/payments");
    const rows = data.length === 0
      ? renderEmpty("Chưa có hóa đơn nào.")
      : data.map((p) => `
          <tr>
            <td class="py-4">#${escapeHtml(p.id)}</td>
            <td class="py-4">${escapeHtml(p.appointment)}</td>
            <td class="py-4">${formatCurrency(p.amount)}</td>
            <td class="py-4">${escapeHtml(p.method)}</td>
            <td class="py-4"><span class="status status--${p.status === "Paid" ? "done" : "pending"}">${escapeHtml(p.status)}</span></td>
            <td class="py-4">${formatDate(p.paidAt)}</td>
          </tr>
        `).join("");
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Thanh toán",
      title: "Danh sách hóa đơn",
      description: `Tổng cộng ${data.length} hóa đơn.`,
      columns: ["Mã hóa đơn", "Lịch hẹn", "Số tiền", "Phương thức", "Trạng thái", "Ngày thanh toán"],
      bodyHtml: rows,
    });
  } catch (error) {
    staffContent.innerHTML = renderTableShell({
      eyebrow: "Thanh toán",
      title: "Danh sách hóa đơn",
      description: "Không kết nối được backend staff (port 4001).",
      columns: ["Mã hóa đơn", "Lịch hẹn", "Số tiền", "Phương thức", "Trạng thái", "Ngày thanh toán"],
      bodyHtml: renderError(error.message),
    });
  }
}

function renderOverview() {
  staffContent.innerHTML = `
    <section class="flex flex-col gap-4 border border-white/10 bg-black/20 p-6 backdrop-blur-lg md:flex-row md:items-center md:justify-between rounded-[1.75rem]">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.35em] text-sky-300">Tổng quan ca làm</p>
        <h2 class="mt-3 text-3xl font-extrabold md:text-5xl">Chào mừng đến MyPuppy Staff</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-white/60">Chọn module ở sidebar bên trái để xem dữ liệu thật từ database.</p>
      </div>
    </section>
    <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article class="metric-card metric-card--blue" data-staff-view="customers" style="cursor:pointer">
        <p>Khách hàng</p>
        <strong>👥</strong>
        <span>Quản lý thông tin khách</span>
      </article>
      <article class="metric-card" data-staff-view="appointments" style="cursor:pointer">
        <p>Lịch hẹn</p>
        <strong>📅</strong>
        <span>Theo dõi lịch hẹn dịch vụ</span>
      </article>
      <article class="metric-card metric-card--yellow" data-staff-view="pets" style="cursor:pointer">
        <p>Thú cưng</p>
        <strong>🐶</strong>
        <span>Hồ sơ thú cưng của khách</span>
      </article>
      <article class="metric-card" data-staff-view="services" style="cursor:pointer">
        <p>Dịch vụ</p>
        <strong>✂️</strong>
        <span>Danh mục dịch vụ spa/grooming</span>
      </article>
      <article class="metric-card metric-card--blue" data-staff-view="payments" style="cursor:pointer">
        <p>Thanh toán</p>
        <strong>💵</strong>
        <span>Xem hóa đơn của khách</span>
      </article>
      <article class="metric-card metric-card--yellow" data-staff-view="products" style="cursor:pointer">
        <p>Sản phẩm</p>
        <strong>🛒</strong>
        <span>Tồn kho phụ kiện</span>
      </article>
    </section>
  `;
}

const staffViews = {
  overview: { title: "MyPuppy Staff Dashboard", load: renderOverview },
  customers: { title: "Staff | Quản lý khách hàng", load: loadCustomers },
  appointments: { title: "Staff | Quản lý lịch hẹn", load: loadAppointments },
  pets: { title: "Staff | Hồ sơ thú cưng", load: loadPets },
  services: { title: "Staff | Đăng ký dịch vụ", load: loadServices },
  payments: { title: "Staff | Kiểm tra thanh toán", load: loadPayments },
  products: { title: "Staff | Quản lý sản phẩm", load: loadProducts },
};

function getCurrentStaffView() {
  const view = window.location.hash.replace("#", "");
  return staffViews[view] ? view : "overview";
}

function renderStaffView(view = getCurrentStaffView()) {
  if (!staffContent) return;
  const selected = staffViews[view] || staffViews.overview;
  document.title = selected.title;
  staffNavLinks.forEach((link) => {
    link.classList.toggle("nav-item--active", link.dataset.staffView === view);
  });
  selected.load();
}

/* ============================================================
   Auth + Bind UI
============================================================ */

async function initStaffAuth() {
  if (window.MyPuppyAuth) {
    try {
      const clerk = await window.MyPuppyAuth.loadClerk();
      if (clerk.isSignedIn && clerk.user) {
        const session = window.MyPuppyAuth.rememberSession(clerk.user);
        if (session.role === "staff") {
          showStaffWorkspace(session.name);
          renderStaffView();
          return;
        }
        window.MyPuppyAuth.redirectToRole(session.role);
        return;
      }
    } catch (error) {
      console.warn("Staff Clerk guard failed:", error);
    }
  }

  if (sessionStorage.getItem("mypuppy_staff_logged_in") === "true") {
    showStaffWorkspace(sessionStorage.getItem("mypuppy_staff_name") || "Mai Groomer");
    renderStaffView();
    return;
  }

  showStaffLogin();
}

if (staffQuickLogin) {
  staffQuickLogin.addEventListener("click", () => {
    sessionStorage.removeItem("mypuppy_redirect_after_auth");
    window.location.href = "../customer/pages/auth/dang-nhap.html";
  });
}

if (staffLogout) {
  staffLogout.addEventListener("click", () => {
    if (window.MyPuppyAuth) {
      window.MyPuppyAuth.signOut("../customer/index.html");
      return;
    }
    sessionStorage.clear();
    window.location.href = "../customer/index.html";
  });
}

staffNavLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const view = link.dataset.staffView || "overview";
    history.pushState({ staffView: view }, "", `#${view}`);
    renderStaffView(view);
  });
});

// Click vào metric card cũng đổi view
if (staffContent) {
  staffContent.addEventListener("click", (event) => {
    const card = event.target.closest("[data-staff-view]");
    if (card && card.dataset.staffView) {
      history.pushState({ staffView: card.dataset.staffView }, "", `#${card.dataset.staffView}`);
      renderStaffView(card.dataset.staffView);
    }
  });
}

window.addEventListener("popstate", () => {
  renderStaffView();
});

if (!window.location.hash) {
  history.replaceState({ staffView: "overview" }, "", "#overview");
}

initStaffAuth();
