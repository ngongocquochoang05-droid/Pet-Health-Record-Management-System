const revealElements = document.querySelectorAll(".reveal");
const heroParallax = document.getElementById("hero-parallax");

if (revealElements.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

function updateScrollEffects() {
  const scrollTop = window.scrollY;

  if (heroParallax) {
    heroParallax.style.transform = `translateY(${scrollTop * 0.18}px) scale(1.1)`;
  }
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  updateScrollEffects();
});

updateScrollEffects();
window.addEventListener("scroll", updateScrollEffects, { passive: true });
