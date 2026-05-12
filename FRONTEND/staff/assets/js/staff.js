const staffLoginPanel = document.getElementById("staff-login-panel");
const staffWorkspace = document.getElementById("staff-workspace");
const staffQuickLogin = document.getElementById("staff-quick-login");
const staffLogout = document.getElementById("staff-logout");
const staffName = document.getElementById("staff-name");

function showStaffWorkspace() {
  const name = sessionStorage.getItem("mypuppy_staff_name") || "Mai Groomer";

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

if (sessionStorage.getItem("mypuppy_staff_logged_in") === "true") {
  showStaffWorkspace();
} else {
  showStaffLogin();
}

if (staffQuickLogin) {
  staffQuickLogin.addEventListener("click", () => {
    sessionStorage.removeItem("mypuppy_customer_logged_in");
    sessionStorage.removeItem("mypuppy_customer_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");
    sessionStorage.setItem("mypuppy_staff_logged_in", "true");
    sessionStorage.setItem("mypuppy_staff_name", "Mai Groomer");
    showStaffWorkspace();
  });
}

if (staffLogout) {
  staffLogout.addEventListener("click", () => {
    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    window.location.href = "../customer/index.html";
  });
}

document.querySelectorAll("[data-staff-action]").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Đã cập nhật";
    button.classList.add("is-updated");
  });
});
