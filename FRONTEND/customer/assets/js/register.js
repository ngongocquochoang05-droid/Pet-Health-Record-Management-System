const registerForm = document.getElementById("register-form");
const registerVerifyForm = document.getElementById("register-verify-form");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const registerConfirm = document.getElementById("register-confirm");
const registerCode = document.getElementById("register-code");
const registerError = document.getElementById("register-error");
const registerSubmit = document.getElementById("register-submit");
const registerVerifySubmit = document.getElementById("register-verify-submit");
const toggleRegisterPassword = document.getElementById("toggle-register-password");

function setLoading(isLoading, target = "register") {
  const button = target === "verify" ? registerVerifySubmit : registerSubmit;

  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading
      ? target === "verify"
        ? "Dang xac minh..."
        : "Dang tao tai khoan..."
      : target === "verify"
        ? "Xac minh tai khoan"
        : "Tao tai khoan mien phi";
  }
}

function showError(message) {
  if (!registerError) return;

  registerError.textContent = message || "Vui long kiem tra lai thong tin dang ky.";
  registerError.classList.remove("hidden");
}

function hideError() {
  if (registerError) {
    registerError.classList.add("hidden");
  }
}

function getClerkErrorMessage(error) {
  return (
    error?.errors?.[0]?.longMessage ||
    error?.errors?.[0]?.message ||
    error?.message ||
    "Khong the tao tai khoan. Vui long thu lai."
  );
}

async function completeRegister(clerk, signUpAttempt) {
  if (signUpAttempt?.status === "complete" && signUpAttempt?.createdSessionId) {
    await clerk.setActive({ session: signUpAttempt.createdSessionId });

    try {
      await clerk.load();
    } catch (error) {
      console.warn("Unable to reload Clerk after setActive:", error);
    }

    const user = clerk.user || clerk.session?.user || signUpAttempt.userData;
    const session = window.MyPuppyAuth.rememberSession(user);
    window.MyPuppyAuth.redirectToRole(session.role);
    return true;
  }

  return false;
}

async function handleRegister(event) {
  event.preventDefault();
  hideError();

  if (!window.MyPuppyAuth) {
    showError("Chua tai duoc cau hinh dang ky MyPuppy.");
    return;
  }

  const email = registerEmail.value.trim();
  const password = registerPassword.value.trim();
  const confirm = registerConfirm.value.trim();

  if (!email || !password || !confirm) {
    showError("Vui long nhap day du email, mat khau va xac nhan mat khau.");
    return;
  }

  if (password.length < 8) {
    showError("Mat khau nen co it nhat 8 ky tu.");
    return;
  }

  if (password !== confirm) {
    showError("Mat khau xac nhan chua trung khop.");
    return;
  }

  setLoading(true);

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    const signUpAttempt = await clerk.client.signUp.create({
      emailAddress: email,
      password,
    });
    const isComplete = await completeRegister(clerk, signUpAttempt);

    if (isComplete) {
      return;
    }

    await clerk.client.signUp.prepareEmailAddressVerification({
      strategy: "email_code",
    });

    registerForm.classList.add("hidden");
    registerVerifyForm.classList.remove("hidden");
    registerCode.focus();
  } catch (error) {
    console.error("Email/password sign-up failed:", error);
    showError(getClerkErrorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function handleVerifyEmail(event) {
  event.preventDefault();
  hideError();

  const code = registerCode.value.trim();

  if (!code) {
    showError("Vui long nhap ma xac minh email.");
    return;
  }

  setLoading(true, "verify");

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    const signUpAttempt = await clerk.client.signUp.attemptEmailAddressVerification({
      code,
    });
    const isComplete = await completeRegister(clerk, signUpAttempt);

    if (!isComplete) {
      showError("Ma xac minh chua dung hoac tai khoan can xac minh them.");
    }
  } catch (error) {
    console.error("Email verification failed:", error);
    showError(getClerkErrorMessage(error));
  } finally {
    setLoading(false, "verify");
  }
}

async function initRegisterPage() {
  if (!window.MyPuppyAuth) {
    showError("Chua tai duoc cau hinh dang ky MyPuppy.");
    return;
  }

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    if (clerk.isSignedIn && clerk.user) {
      const session = window.MyPuppyAuth.rememberSession(clerk.user);
      window.MyPuppyAuth.redirectToRole(session.role);
    }
  } catch (error) {
    console.warn("Clerk register page init failed:", error);
  }
}

if (registerForm) {
  registerForm.addEventListener("submit", handleRegister);
}

if (registerVerifyForm) {
  registerVerifyForm.addEventListener("submit", handleVerifyEmail);
}

if (toggleRegisterPassword && registerPassword) {
  toggleRegisterPassword.addEventListener("click", () => {
    const isPassword = registerPassword.type === "password";
    registerPassword.type = isPassword ? "text" : "password";
    toggleRegisterPassword.setAttribute("aria-label", isPassword ? "An mat khau" : "Hien mat khau");
  });
}

initRegisterPage();
