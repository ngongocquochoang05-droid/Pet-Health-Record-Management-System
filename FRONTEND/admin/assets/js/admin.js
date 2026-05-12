const logoutButton = document.getElementById("admin-logout");

if (sessionStorage.getItem("mypuppy_admin_logged_in") !== "true") {
  console.info("Admin demo page: open through customer/pages/dang-nhap.html for the intended flow.");
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("mypuppy_customer_logged_in");
    sessionStorage.removeItem("mypuppy_customer_name");
    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");
  });
}
