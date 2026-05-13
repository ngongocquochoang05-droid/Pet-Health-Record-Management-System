const registerForm = document.getElementById("register-form");
const registerError = document.getElementById("register-error");
const registerSuccess = document.getElementById("register-success");
const registerName = document.getElementById("register-name");
const registerEmail = document.getElementById("register-email");
const registerPhone = document.getElementById("register-phone");
const registerPassword = document.getElementById("register-password");
const registerConfirm = document.getElementById("register-confirm");
const toggleRegisterPassword = document.getElementById("toggle-register-password");

function togglePassword(input, button) {
  if (!input || !button) return;

  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  button.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
}

if (toggleRegisterPassword) {
  toggleRegisterPassword.addEventListener("click", () => {
    togglePassword(registerPassword, toggleRegisterPassword);
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const phone = registerPhone.value.trim();
    const password = registerPassword.value.trim();
    const confirm = registerConfirm.value.trim();
    const isValid = name && email.includes("@") && phone.length >= 9 && password.length >= 6 && password === confirm;

    registerError.classList.toggle("hidden", isValid);
    registerSuccess.classList.toggle("hidden", !isValid);

    if (!isValid) return;

    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");
    sessionStorage.setItem("mypuppy_customer_logged_in", "true");
    sessionStorage.setItem("mypuppy_customer_name", name);

    window.setTimeout(() => {
      window.location.href = "../index.html";
    }, 600);
  });
}
