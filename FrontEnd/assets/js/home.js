const revealElements = document.querySelectorAll(".reveal");
const heroParallax = document.getElementById("hero-parallax");
const landingPage = document.getElementById("landing-page");
const adminDashboard = document.getElementById("admin-dashboard");
const loginModal = document.getElementById("login-modal");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const openLoginButtons = [
  document.getElementById("open-login"),
  document.getElementById("open-login-inline"),
];
const closeModalTargets = document.querySelectorAll("[data-close-modal]");
const logoutAdmin = document.getElementById("logout-admin");

if (revealElements.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  revealElements.forEach((element) => observer.observe(element));
}

function updateScrollEffects() {
  const scrollTop = window.scrollY;
  if (heroParallax) {
    heroParallax.style.transform = `translateY(${scrollTop * 0.18}px) scale(1.1)`;
  }
}

function closeModal() {
  if (!loginModal) return;
  loginModal.classList.add("pointer-events-none", "opacity-0");
  loginModal.classList.remove("opacity-100");
  document.body.classList.remove("overflow-hidden");
}

function openModal() {
  if (!loginModal || !loginError) return;
  loginModal.classList.remove("pointer-events-none", "opacity-0");
  loginModal.classList.add("opacity-100");
  loginError.classList.add("hidden");
  document.body.classList.add("overflow-hidden");
}

function showAdminDashboard() {
  if (!landingPage || !adminDashboard) return;
  landingPage.classList.add("hidden");
  adminDashboard.classList.remove("hidden");
  document.body.classList.remove("overflow-hidden");
  window.scrollTo({ top: 0, behavior: "auto" });
  if (window.location.hash) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  closeModal();
}

function showLandingPage() {
  if (!landingPage || !adminDashboard) return;
  sessionStorage.removeItem("mypuppy_admin_logged_in");
  adminDashboard.classList.add("hidden");
  landingPage.classList.remove("hidden");
  if (window.location.hash) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

openLoginButtons.forEach((button) => {
  if (button) {
    button.addEventListener("click", openModal);
  }
});

closeModalTargets.forEach((target) => {
  target.addEventListener("click", closeModal);
});

if (loginForm && loginError) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("admin-email").value.trim().toLowerCase();
    const password = document.getElementById("admin-password").value.trim();

    if (email === "admin@mypuppy.vn" && password === "admin123") {
      showAdminDashboard();
    } else {
      loginError.classList.remove("hidden");
    }
  });
}

if (logoutAdmin) {
  logoutAdmin.addEventListener("click", showLandingPage);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  if (sessionStorage.getItem("mypuppy_admin_logged_in") === "true") {
    showAdminDashboard();
    return;
  }

  if (landingPage && !landingPage.classList.contains("hidden")) {
    if (window.location.hash) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    updateScrollEffects();
  }
});

updateScrollEffects();
window.addEventListener("scroll", updateScrollEffects, { passive: true });
