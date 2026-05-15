function updateCustomerAuthUI({ isLoggedIn, name }) {
  document.querySelectorAll("[data-customer-name]").forEach((element) => {
    element.textContent = name || "Khach hang";
  });

  document.querySelectorAll("[data-auth-customer]").forEach((element) => {
    element.classList.toggle("hidden", !isLoggedIn);
  });

  document.querySelectorAll("[data-guest-only]").forEach((element) => {
    element.classList.toggle("hidden", isLoggedIn);
  });
}

async function initCustomerAuth() {
  let isLoggedIn = sessionStorage.getItem("mypuppy_customer_logged_in") === "true";
  let name = sessionStorage.getItem("mypuppy_customer_name") || "Khach hang";

  if (window.MyPuppyAuth) {
    try {
      const clerk = await window.MyPuppyAuth.loadClerk();

      if (clerk.isSignedIn && clerk.user && window.MyPuppyAuth.getUserRole(clerk.user) === "customer") {
        const session = window.MyPuppyAuth.rememberSession(clerk.user);
        isLoggedIn = true;
        name = session.name;
      }
    } catch (error) {
      console.warn("Clerk customer auth check failed, using local session fallback.", error);
    }
  }

  updateCustomerAuthUI({ isLoggedIn, name });
}

document.querySelectorAll("[data-customer-logout]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    if (window.MyPuppyAuth) {
      window.MyPuppyAuth.signOut(button.dataset.logoutTarget || "index.html");
      return;
    }

    sessionStorage.removeItem("mypuppy_customer_logged_in");
    sessionStorage.removeItem("mypuppy_customer_name");
    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");
    sessionStorage.removeItem("mypuppy_auth_role");
    sessionStorage.removeItem("mypuppy_auth_name");

    window.location.href = button.dataset.logoutTarget || "index.html";
  });
});

initCustomerAuth();
