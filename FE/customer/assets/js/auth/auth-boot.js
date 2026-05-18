/**
 * Auth bootstrap - PHAI chay TRONG <head> truoc khi browser paint navbar.
 * Doc sessionStorage SYNC, set body class de CSS hien dung nut.
 * Khong cho phep <script defer> hoac async - tac dung ngay khi browser parse.
 */
(function () {
  try {
    var loggedIn = sessionStorage.getItem("mypuppy_customer_logged_in") === "true"
      || sessionStorage.getItem("mypuppy_auth_role") === "customer";
    var name = sessionStorage.getItem("mypuppy_customer_name")
      || sessionStorage.getItem("mypuppy_auth_name")
      || "";

    function apply() {
      if (!document.body) {
        // body chua co - thu lai sau micro-task.
        return Promise.resolve().then(apply);
      }
      document.body.classList.toggle("auth-customer", loggedIn);
      document.body.classList.toggle("auth-guest", !loggedIn);

      if (loggedIn && name) {
        document.querySelectorAll("[data-customer-name]").forEach(function (el) {
          el.textContent = name;
        });
      }
    }

    if (document.body) {
      apply();
    } else {
      // body chua parse - dung MutationObserver hoac DOMContentLoaded.
      document.addEventListener("DOMContentLoaded", apply, { once: true });
    }
  } catch (err) {
    // fallback: hien guest mode neu sessionStorage loi.
    if (document.body) document.body.classList.add("auth-guest");
  }
})();
