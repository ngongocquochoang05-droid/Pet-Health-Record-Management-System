const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const adminDemo = document.getElementById("admin-demo");
const staffDemo = document.getElementById("staff-demo");
const customerDemo = document.getElementById("customer-demo");
const loginEmail = document.getElementById("admin-email");
const loginPassword = document.getElementById("admin-password");
const togglePassword = document.getElementById("toggle-password");

const demoAccounts = {
  customer: {
    email: "minhnguyen@gmail.com",
    password: "customer123",
    name: "Minh Nguyễn",
    redirect: "../index.html",
  },
  staff: {
    email: "staff@mypuppy.vn",
    password: "staff123",
    name: "Mai Groomer",
    redirect: "../../staff/index.html",
  },
  admin: {
    email: "admin@mypuppy.vn",
    password: "admin123",
    name: "Quản trị viên",
    redirect: "../../admin/index.html",
  },
};

function clearSessions() {
  sessionStorage.removeItem("mypuppy_customer_logged_in");
  sessionStorage.removeItem("mypuppy_customer_name");
  sessionStorage.removeItem("mypuppy_staff_logged_in");
  sessionStorage.removeItem("mypuppy_staff_name");
  sessionStorage.removeItem("mypuppy_admin_logged_in");
}

function loginAs(role) {
  const account = demoAccounts[role];
  if (!account) return;

  clearSessions();

  if (role === "customer") {
    sessionStorage.setItem("mypuppy_customer_logged_in", "true");
    sessionStorage.setItem("mypuppy_customer_name", account.name);
  }

  if (role === "staff") {
    sessionStorage.setItem("mypuppy_staff_logged_in", "true");
    sessionStorage.setItem("mypuppy_staff_name", account.name);
  }

  if (role === "admin") {
    sessionStorage.setItem("mypuppy_admin_logged_in", "true");
  }

  window.location.href = account.redirect;
}

function fillDemo(role) {
  const account = demoAccounts[role];
  if (!account || !loginEmail || !loginPassword || !loginError) return;

  loginEmail.value = account.email;
  loginPassword.value = account.password;
  loginError.classList.add("hidden");
}

if (customerDemo) {
  customerDemo.addEventListener("click", () => loginAs("customer"));
}

if (staffDemo) {
  staffDemo.addEventListener("click", () => loginAs("staff"));
}

if (adminDemo) {
  adminDemo.addEventListener("click", () => loginAs("admin"));
}

if (togglePassword && loginPassword) {
  togglePassword.addEventListener("click", () => {
    const isPassword = loginPassword.type === "password";
    loginPassword.type = isPassword ? "text" : "password";
    togglePassword.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  });
}

if (loginForm && loginError && loginEmail && loginPassword) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value.trim();
    const matchedRole = Object.keys(demoAccounts).find((role) => {
      const account = demoAccounts[role];
      return account.email === email && account.password === password;
    });

    if (matchedRole) {
      loginAs(matchedRole);
      return;
    }

    loginError.classList.remove("hidden");
  });
}

fillDemo("customer");
