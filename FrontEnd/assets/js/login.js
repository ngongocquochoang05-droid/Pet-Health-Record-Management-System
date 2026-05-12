const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const adminDemo = document.getElementById("admin-demo");
const adminEmail = document.getElementById("admin-email");
const adminPassword = document.getElementById("admin-password");
const togglePassword = document.getElementById("toggle-password");

if (adminDemo && adminEmail && adminPassword && loginError) {
  adminDemo.addEventListener("click", () => {
    adminEmail.value = "admin@mypuppy.vn";
    adminPassword.value = "admin123";
    loginError.classList.add("hidden");
  });
}

if (togglePassword && adminPassword) {
  togglePassword.addEventListener("click", () => {
    const isPassword = adminPassword.type === "password";
    adminPassword.type = isPassword ? "text" : "password";
    togglePassword.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  });
}

if (loginForm && loginError && adminEmail && adminPassword) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = adminEmail.value.trim().toLowerCase();
    const password = adminPassword.value.trim();

    if (email === "admin@mypuppy.vn" && password === "admin123") {
      sessionStorage.setItem("mypuppy_admin_logged_in", "true");
      window.location.href = "../index.html";
      return;
    }

    loginError.classList.remove("hidden");
  });
}
