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

const UI_STRINGS = {
  VERIFYING: "Đang xác minh...",
  CREATING_ACCOUNT: "Đang tạo tài khoản...",
  VERIFY_ACCOUNT: "Xác minh tài khoản",
  CREATE_FREE_ACCOUNT: "Tạo tài khoản miễn phí",
  CHECK_INFO: "Vui lòng kiểm tra lại thông tin đăng ký.",
  CANNOT_CREATE: "Không thể tạo tài khoản. Vui lòng thử lại.",
  ENTER_CODE: "Vui lòng nhập mã xác minh email.",
  CONFIG_FAIL: "Chưa tải được cấu hình đăng ký MyPuppy.",
  ENTER_ALL_FIELDS: "Vui lòng nhập đầy đủ email, mật khẩu và xác nhận mật khẩu.",
  PASSWORD_TOO_SHORT: "Mật khẩu nên có ít nhất 8 ký tự.",
  PASSWORD_MISMATCH: "Mật khẩu xác nhận chưa trùng khớp.",
  VERIFICATION_FAIL: "Mã xác minh chưa đúng hoặc tài khoản cần xác minh thêm.",
  HIDE_PASSWORD: "Ẩn mật khẩu",
  SHOW_PASSWORD: "Hiện mật khẩu",
};

function setLoading(isLoading, target = "register") {
  const button = target === "verify" ? registerVerifySubmit : registerSubmit;

  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading
      ? target === "verify" ? UI_STRINGS.VERIFYING : UI_STRINGS.CREATING_ACCOUNT
      : target === "verify" ? UI_STRINGS.VERIFY_ACCOUNT : UI_STRINGS.CREATE_FREE_ACCOUNT;
  }
}

function showError(message) {
  if (!registerError) return;

  registerError.textContent = message || UI_STRINGS.CHECK_INFO;
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
    UI_STRINGS.CANNOT_CREATE
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
    showError(UI_STRINGS.CONFIG_FAIL);
    return;
  }

  const email = registerEmail.value.trim();
  const password = registerPassword.value.trim();
  const confirm = registerConfirm.value.trim();

  if (!email || !password || !confirm) {
    showError(UI_STRINGS.ENTER_ALL_FIELDS);
    return;
  }

  if (password.length < 8) {
    showError(UI_STRINGS.PASSWORD_TOO_SHORT);
    return;
  }

  if (password !== confirm) {
    showError(UI_STRINGS.PASSWORD_MISMATCH);
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
    showError(UI_STRINGS.ENTER_CODE);
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
      showError(UI_STRINGS.VERIFICATION_FAIL);
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
    showError(UI_STRINGS.CONFIG_FAIL);
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
    toggleRegisterPassword.setAttribute("aria-label", isPassword ? UI_STRINGS.HIDE_PASSWORD : UI_STRINGS.SHOW_PASSWORD);
  });
}

initRegisterPage();
