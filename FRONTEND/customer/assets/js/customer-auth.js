const customerName = sessionStorage.getItem("mypuppy_customer_name") || "Khách hàng";
const isCustomerLoggedIn = sessionStorage.getItem("mypuppy_customer_logged_in") === "true";

document.querySelectorAll("[data-customer-name]").forEach((element) => {
  element.textContent = customerName;
});

document.querySelectorAll("[data-auth-customer]").forEach((element) => {
  element.classList.toggle("hidden", !isCustomerLoggedIn);
});

document.querySelectorAll("[data-customer-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    sessionStorage.removeItem("mypuppy_customer_logged_in");
    sessionStorage.removeItem("mypuppy_customer_name");
    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");

    window.location.href = button.dataset.logoutTarget || "index.html";
  });
});
