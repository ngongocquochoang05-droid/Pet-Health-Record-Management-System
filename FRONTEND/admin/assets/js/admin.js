const logoutButton = document.getElementById("admin-logout");

async function initAdminAuth() {
  if (!window.MyPuppyAuth) {
    return;
  }

  try {
    await window.MyPuppyAuth.requireRole("admin");
  } catch (error) {
    console.warn("Admin Clerk guard failed, using local demo fallback.", error);

    if (sessionStorage.getItem("mypuppy_admin_logged_in") !== "true") {
      window.location.href = "../customer/pages/dang-nhap.html";
    }
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

initAdminAuth();
