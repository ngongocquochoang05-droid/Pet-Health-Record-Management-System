/**
 * Customer auth UI sync.
 *
 * IMPORTANT - chong flicker:
 * Khi load trang, ta SYNCHRONOUSLY apply UI tu sessionStorage NGAY LAP TUC,
 * truoc khi cho Clerk init (async). Cach nay tranh user thay nut "Dang nhap"
 * mot khoang ngan roi mat di khi co session.
 */

(function applyCustomerAuthFromCache() {
  const cachedLoggedIn = sessionStorage.getItem("mypuppy_customer_logged_in") === "true"
    || sessionStorage.getItem("mypuppy_auth_role") === "customer";
  const cachedName = sessionStorage.getItem("mypuppy_customer_name")
    || sessionStorage.getItem("mypuppy_auth_name")
    || "";

  applyAuthUi({ isLoggedIn: cachedLoggedIn, name: cachedName });
})();

function applyAuthUi({ isLoggedIn, name }) {
  document.querySelectorAll("[data-customer-name]").forEach((element) => {
    element.textContent = name || "Khách hàng";
  });

  document.querySelectorAll("[data-auth-customer]").forEach((element) => {
    element.classList.toggle("hidden", !isLoggedIn);
  });

  document.querySelectorAll("[data-guest-only]").forEach((element) => {
    element.classList.toggle("hidden", isLoggedIn);
  });
}

async function refreshCustomerAuthFromClerk() {
  if (!window.MyPuppyAuth) return;

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    if (clerk.isSignedIn && clerk.user && window.MyPuppyAuth.getUserRole(clerk.user) === "customer") {
      const session = window.MyPuppyAuth.rememberSession(clerk.user);
      applyAuthUi({ isLoggedIn: true, name: session.name });
    } else if (!clerk.isSignedIn) {
      // Clerk noi user khong sign in -> clear cache + UI ve guest mode.
      sessionStorage.removeItem("mypuppy_customer_logged_in");
      sessionStorage.removeItem("mypuppy_customer_name");
      applyAuthUi({ isLoggedIn: false, name: "" });
    }
  } catch (error) {
    console.warn("Clerk customer auth check failed, keep cached UI.", error);
    // Khi Clerk loi, KHONG clear cache - user van thay dung UI tu cache.
  }
}

document.querySelectorAll("[data-customer-logout]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();

    if (window.MyPuppyAuth) {
      window.MyPuppyAuth.signOut(button.dataset.logoutTarget || "index.html");
      return;
    }

    ["mypuppy_customer_logged_in", "mypuppy_customer_name",
     "mypuppy_staff_logged_in", "mypuppy_staff_name",
     "mypuppy_admin_logged_in", "mypuppy_auth_role", "mypuppy_auth_name"]
      .forEach((key) => sessionStorage.removeItem(key));

    window.location.href = button.dataset.logoutTarget || "index.html";
  });
});

document.querySelectorAll("a[href*='dang-nhap.html']").forEach((link) => {
  link.addEventListener("click", () => {
    sessionStorage.removeItem("mypuppy_redirect_after_auth");
  });
});

// Khi load lan dau hoac sau khi navigate (back/forward), refresh tu Clerk de catch session moi.
window.addEventListener("DOMContentLoaded", () => {
  refreshCustomerAuthFromClerk();
});

// pageshow trigger ca khi user back/forward (kien browser cache lai page).
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Page tu bfcache -> apply cache lai NGAY (khong cho Clerk).
    const cachedLoggedIn = sessionStorage.getItem("mypuppy_customer_logged_in") === "true";
    const cachedName = sessionStorage.getItem("mypuppy_customer_name") || "";
    applyAuthUi({ isLoggedIn: cachedLoggedIn, name: cachedName });
  }
});
