const staffLoginPanel = document.getElementById("staff-login-panel");
const staffWorkspace = document.getElementById("staff-workspace");
const staffQuickLogin = document.getElementById("staff-quick-login");
const staffLogout = document.getElementById("staff-logout");
const staffName = document.getElementById("staff-name");

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
    window.location.href = "../customer/pages/dang-nhap.html";
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

const staffNavLinks = document.querySelectorAll(".nav-item");
function setActiveStaffNav() {
  const currentPage = window.location.pathname.split("/").pop();
  staffNavLinks.forEach((link) => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (linkPage === currentPage) {
      link.classList.add("nav-item--active");
    } else {
      link.classList.remove("nav-item--active");
    }
  });
}

setActiveStaffNav();

document.querySelectorAll("[data-staff-action]").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Da cap nhat";
    button.classList.add("is-updated");
  });
});

initStaffAuth();
