const staffLoginPanel = document.getElementById("staff-login-panel");
const staffWorkspace = document.getElementById("staff-workspace");
const staffQuickLogin = document.getElementById("staff-quick-login");
const staffLogout = document.getElementById("staff-logout");
const staffName = document.getElementById("staff-name");
const staffContent = document.getElementById("staff-content");

function showStaffWorkspace(name = "Mai Groomer") {
  if (staffName) {
    staffName.textContent = name;
  }

  if (staffLoginPanel) {
    staffLoginPanel.classList.add("hidden");
  }

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

  if (staffLoginPanel) {
    staffLoginPanel.classList.remove("hidden");
  }
}

async function initStaffAuth() {
  if (window.MyPuppyAuth) {
    try {
      const clerk = await window.MyPuppyAuth.loadClerk();

      if (clerk.isSignedIn && clerk.user) {
        const session = window.MyPuppyAuth.rememberSession(clerk.user);

        if (session.role === "staff") {
          showStaffWorkspace(session.name);
          return;
        }

        window.MyPuppyAuth.redirectToRole(session.role);
        return;
      }
    } catch (error) {
      console.warn("Staff Clerk guard failed, using local demo fallback.", error);
    }
  }

  if (sessionStorage.getItem("mypuppy_staff_logged_in") === "true") {
    showStaffWorkspace(sessionStorage.getItem("mypuppy_staff_name") || "Mai Groomer");
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

    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_auth_role");
    sessionStorage.removeItem("mypuppy_auth_name");
    window.location.href = "../customer/index.html";
  });
}

const staffNavLinks = document.querySelectorAll("[data-staff-view]");
const initialOverviewContent = staffContent ? staffContent.innerHTML : "";

const staffViews = {
  overview: {
    title: "MyPuppy Staff Dashboard",
    html: initialOverviewContent,
  },
  customers: {
    title: "Staff | Quản lý khách hàng",
    html: createStaffTableView({
      eyebrow: "Quản lý khách hàng",
      title: "Danh sách khách hàng",
      description: "Tra cứu, cập nhật và quản lý thông tin khách hàng của cửa hàng.",
      searchLabel: "Tìm kiếm khách hàng",
      searchPlaceholder: "Tìm khách hàng theo tên hoặc số điện thoại...",
      columns: ["Tên khách", "Liên hệ", "Địa chỉ", "Số thú cưng", "Ghi chú", "Tác vụ"],
      rows: [
        ["<strong class=\"block text-white\">Nguyễn Minh</strong><span class=\"text-xs text-white/45\">Thành viên VIP</span>", "0901 234 567", "Quận 1, TP.HCM", "2", "Ưu tiên sản phẩm dịu nhẹ", "<button data-staff-action class=\"action-button\">Xem chi tiết</button>"],
        ["<strong class=\"block text-white\">Trần Hoài An</strong><span class=\"text-xs text-white/45\">Thành viên mới</span>", "0918 222 090", "Thủ Đức, TP.HCM", "1", "Cần nhắc lịch tiếp theo", "<button data-staff-action class=\"action-button\">Xem chi tiết</button>"],
        ["<strong class=\"block text-white\">Lê Khánh Vy</strong><span class=\"text-xs text-white/45\">Khách hàng thân thiết</span>", "0987 333 112", "Bình Thạnh, TP.HCM", "3", "Cho thú cưng dùng combo spa", "<button data-staff-action class=\"action-button\">Xem chi tiết</button>"],
      ],
    }),
  },
  appointments: {
    title: "Staff | Quản lý lịch hẹn",
    html: createStaffTableView({
      eyebrow: "Quản lý lịch hẹn",
      title: "Lịch hẹn cửa hàng",
      description: "Cập nhật trạng thái, xác nhận và hoàn thành các lịch hẹn của thú cưng.",
      searchLabel: "Tìm kiếm lịch hẹn",
      searchPlaceholder: "Tìm theo tên khách hàng, thú cưng hoặc dịch vụ...",
      columns: ["Khách hàng", "Thú cưng", "Dịch vụ", "Ngày giờ", "Trạng thái", "Tác vụ"],
      rows: [
        ["<strong class=\"block text-white\">Nguyễn Minh</strong><span class=\"text-xs text-white/45\">0901 234 567</span>", "Bông - Corgi", "Spa thư giãn", "15/05/2026 10:30", "<span class=\"status status--pending\">Đang chờ</span>", "<button data-staff-action class=\"action-button\">Xác nhận</button><button data-staff-action class=\"action-button ml-2\">Hoàn thành</button>"],
        ["<strong class=\"block text-white\">Trần Hoài An</strong><span class=\"text-xs text-white/45\">0918 222 090</span>", "Miu - Mèo Anh", "Tắm & sấy", "15/05/2026 13:30", "<span class=\"status status--ok\">Đã xác nhận</span>", "<button data-staff-action class=\"action-button\">Hoàn thành</button>"],
        ["<strong class=\"block text-white\">Lê Khánh Vy</strong><span class=\"text-xs text-white/45\">0987 333 112</span>", "Lucky - Poodle", "Cắt tỉa", "15/05/2026 15:00", "<span class=\"status status--done\">Hoàn thành</span>", "<button data-staff-action class=\"action-button\">Xem</button>"],
      ],
    }),
  },
  pets: {
    title: "Staff | Hồ sơ thú cưng",
    html: createStaffTableView({
      eyebrow: "Hồ sơ thú cưng",
      title: "Quản lý thú cưng",
      description: "Theo dõi hồ sơ, tình trạng sức khỏe và ghi chú dịch vụ cho từng thú cưng.",
      searchLabel: "Tìm kiếm thú cưng",
      searchPlaceholder: "Tìm theo tên thú cưng hoặc chủ sở hữu...",
      columns: ["Tên thú cưng", "Loài", "Chủ", "Tuổi", "Ghi chú", "Tác vụ"],
      rows: [
        ["<strong class=\"block text-white\">Bông</strong><span class=\"text-xs text-white/45\">Corgi</span>", "Chó", "Nguyễn Minh", "4", "Da nhạy cảm, dùng dầu gội dịu nhẹ", "<button data-staff-action class=\"action-button\">Xem hồ sơ</button>"],
        ["<strong class=\"block text-white\">Miu</strong><span class=\"text-xs text-white/45\">Mèo Anh</span>", "Mèo", "Trần Hoài An", "2", "Cần theo dõi phục hồi sau tắm sấy", "<button data-staff-action class=\"action-button\">Xem hồ sơ</button>"],
        ["<strong class=\"block text-white\">Lucky</strong><span class=\"text-xs text-white/45\">Poodle</span>", "Chó", "Lê Khánh Vy", "3", "Nhu cầu cắt tỉa định kỳ mỗi 6 tuần", "<button data-staff-action class=\"action-button\">Xem hồ sơ</button>"],
      ],
    }),
  },
  services: {
    title: "Staff | Đăng ký dịch vụ",
    html: createStaffTableView({
      eyebrow: "Đăng ký dịch vụ",
      title: "Tạo dịch vụ mới",
      description: "Thêm dịch vụ, gói spa và ghi chú cho mỗi ca phục vụ.",
      searchLabel: "Tìm kiếm dịch vụ",
      searchPlaceholder: "Tìm kiếm dịch vụ...",
      metrics: [
        { className: "metric-card--blue", label: "Số gói dịch vụ", value: "12", note: "Gồm spa, grooming, tắm sấy, cắt tỉa, chăm sóc da." },
        { label: "Giá trung bình", value: "320.000 đ", note: "Giá đề xuất cho combo dịch vụ cao cấp." },
      ],
      columns: ["Tên dịch vụ", "Mô tả", "Giá", "Thời gian", "Tác vụ"],
      rows: [
        ["<strong class=\"block text-white\">Spa thư giãn</strong>", "Tắm, massage và sấy khô.", "220.000 đ", "90 phút", "<button data-staff-action class=\"action-button\">Chỉnh sửa</button>"],
        ["<strong class=\"block text-white\">Tắm & sấy</strong>", "Tắm sạch và sấy lông mềm mượt.", "150.000 đ", "60 phút", "<button data-staff-action class=\"action-button\">Chỉnh sửa</button>"],
        ["<strong class=\"block text-white\">Cắt tỉa + tạo kiểu</strong>", "Cắt tỉa lông theo kiểu yêu cầu.", "280.000 đ", "120 phút", "<button data-staff-action class=\"action-button\">Chỉnh sửa</button>"],
      ],
    }),
  },
  payments: {
    title: "Staff | Kiểm tra thanh toán",
    html: createStaffTableView({
      eyebrow: "Kiểm tra thanh toán",
      title: "Danh sách thanh toán",
      description: "Kiểm tra và hoàn tất các giao dịch dành cho khách hàng sau khi phục vụ.",
      searchLabel: "Tìm kiếm thanh toán",
      searchPlaceholder: "Tìm theo khách hàng, dịch vụ hoặc trạng thái...",
      columns: ["Khách hàng", "Dịch vụ", "Số tiền", "Phương thức", "Trạng thái", "Tác vụ"],
      rows: [
        ["<strong class=\"block text-white\">Nguyễn Minh</strong><span class=\"text-xs text-white/45\">Spa thư giãn</span>", "Spa thư giãn", "220.000 đ", "Tiền mặt", "<span class=\"status status--pending\">Chờ xác nhận</span>", "<button data-staff-action class=\"action-button\">Đã thanh toán</button>"],
        ["<strong class=\"block text-white\">Trần Hoài An</strong><span class=\"text-xs text-white/45\">Tắm & sấy</span>", "Tắm & sấy", "150.000 đ", "Thẻ", "<span class=\"status status--done\">Đã thanh toán</span>", "<button data-staff-action class=\"action-button\">Xem hóa đơn</button>"],
        ["<strong class=\"block text-white\">Lê Khánh Vy</strong><span class=\"text-xs text-white/45\">Cắt tỉa</span>", "Cắt tỉa", "280.000 đ", "Chuyển khoản", "<span class=\"status status--ok\">Đã cọc</span>", "<button data-staff-action class=\"action-button\">Hoàn tất</button>"],
      ],
    }),
  },
  products: {
    title: "Staff | Quản lý sản phẩm",
    html: createStaffTableView({
      eyebrow: "Quản lý sản phẩm",
      title: "Tồn kho phụ kiện",
      description: "Kiểm tra tồn kho, chỉnh sửa giá và quản lý phụ kiện ngay tại quầy.",
      searchLabel: "Tìm kiếm sản phẩm",
      searchPlaceholder: "Tìm kiếm sản phẩm hoặc phụ kiện...",
      metrics: [
        { className: "metric-card--yellow", label: "Sản phẩm sắp hết", value: "4", note: "Các mặt hàng cần bổ sung trước cuối tuần." },
        { label: "Giá bán trung bình", value: "190.000 đ", note: "Phụ kiện và đồ chăm sóc thú cưng." },
      ],
      columns: ["Tên sản phẩm", "Danh mục", "Giá", "Tồn kho", "Tác vụ"],
      rows: [
        ["<strong class=\"block text-white\">Vitamin cho chó</strong>", "Thực phẩm bảo vệ sức khỏe", "120.000 đ", "24", "<button data-staff-action class=\"action-button\">Cập nhật</button>"],
        ["<strong class=\"block text-white\">Vòng cổ mềm</strong>", "Phụ kiện", "85.000 đ", "38", "<button data-staff-action class=\"action-button\">Cập nhật</button>"],
        ["<strong class=\"block text-white\">Sữa tắm dịu nhẹ</strong>", "Chăm sóc lông", "138.000 đ", "16", "<button data-staff-action class=\"action-button\">Cập nhật</button>"],
      ],
    }),
  },
};

function createStaffTableView({ eyebrow, title, description, searchLabel, searchPlaceholder, metrics = [], columns, rows }) {
  const metricCards = metrics.length
    ? `<section class="grid gap-5 xl:grid-cols-2">${metrics.map((metric) => `
        <article class="metric-card ${metric.className || ""}">
          <p>${metric.label}</p>
          <strong>${metric.value}</strong>
          <span>${metric.note}</span>
        </article>
      `).join("")}</section>`
    : "";

  return `
    <section class="flex flex-col gap-4 border border-white/10 bg-black/20 p-6 backdrop-blur-lg md:flex-row md:items-center md:justify-between rounded-[1.75rem]">
      <div>
        <p class="text-sm font-bold uppercase tracking-[0.35em] text-sky-300">${eyebrow}</p>
        <h2 class="mt-3 text-3xl font-extrabold md:text-5xl">${title}</h2>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-white/60">${description}</p>
      </div>
      <label class="relative w-full max-w-md">
        <span class="sr-only">${searchLabel}</span>
        <input class="w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white placeholder:text-white/45 outline-none transition focus:border-sky-300/70 focus:bg-white/15" type="search" placeholder="${searchPlaceholder}">
      </label>
    </section>

    ${metricCards}

    <div class="overflow-x-auto rounded-[1.75rem] border border-white/10 bg-black/35 p-6 shadow-2xl backdrop-blur-xl">
      <table class="w-full min-w-[860px] text-left text-sm">
        <thead class="border-b border-white/10 text-xs uppercase tracking-[0.25em] text-white/45">
          <tr>${columns.map((column) => `<th class="pb-4">${column}</th>`).join("")}</tr>
        </thead>
        <tbody class="divide-y divide-white/5 text-white/75">
          ${rows.map((row) => `<tr>${row.map((cell) => `<td class="py-4">${cell}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getCurrentStaffView() {
  const view = window.location.hash.replace("#", "");
  return staffViews[view] ? view : "overview";
}

function renderStaffView(view = getCurrentStaffView()) {
  if (!staffContent) {
    return;
  }

  const selectedView = staffViews[view] || staffViews.overview;
  staffContent.innerHTML = selectedView.html;
  document.title = selectedView.title;

  staffNavLinks.forEach((link) => {
    link.classList.toggle("nav-item--active", link.dataset.staffView === view);
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

window.addEventListener("popstate", () => {
  renderStaffView();
});

if (!window.location.hash) {
  history.replaceState({ staffView: "overview" }, "", "#overview");
}

renderStaffView();

if (staffContent) {
  staffContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-staff-action]");
    if (!button) {
      return;
    }

    button.textContent = "Đã cập nhật";
    button.classList.add("is-updated");
  });
}

initStaffAuth();
