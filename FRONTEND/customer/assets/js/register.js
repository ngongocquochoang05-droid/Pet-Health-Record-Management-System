const registerForm = document.getElementById("register-form");
const registerVerifyForm = document.getElementById("register-verify-form");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const registerConfirm = document.getElementById("register-confirm");
const registerCode = document.getElementById("register-code");
const registerError = document.getElementById("register-error");
const registerSubmit = document.getElementById("register-submit");
const registerVerifySubmit = document.getElementById("register-verify-submit");
const googleRegister = document.getElementById("google-register");
const toggleRegisterPassword = document.getElementById("toggle-register-password");

function setLoading(isLoading, target = "register") {
  const button = target === "verify" ? registerVerifySubmit : registerSubmit;

  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading
      ? target === "verify"
        ? "Đang xác minh..."
        : "Đang tạo tài khoản..."
      : target === "verify"
        ? "Xác minh tài khoản"
        : "Tạo tài khoản miễn phí";
  }

  if (googleRegister) {
    googleRegister.disabled = isLoading;
  }
}

function showError(message) {
  if (!registerError) return;

  registerError.textContent = message || "Vui lòng kiểm tra lại thông tin đăng ký.";
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
    "Không thể tạo tài khoản. Vui lòng thử lại."
  );
}

async function completeRegister(clerk, signUpAttempt) {
  if (signUpAttempt?.status === "complete" && signUpAttempt?.createdSessionId) {
    await clerk.setActive({ session: signUpAttempt.createdSessionId });
    const user = clerk.user || clerk.session?.user;

    if (!user) {
      window.location.href = window.MyPuppyAuth.routes.customer();
      return true;
    }

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
    showError("Chưa tải được cấu hình đăng ký MyPuppy.");
    return;
  }

  const email = registerEmail.value.trim();
  const password = registerPassword.value.trim();
  const confirm = registerConfirm.value.trim();

  if (!email || !password || !confirm) {
    showError("Vui lòng nhập đầy đủ email, mật khẩu và xác nhận mật khẩu.");
    return;
  }

  if (password.length < 8) {
    showError("Mật khẩu nên có ít nhất 8 ký tự.");
    return;
  }

  if (password !== confirm) {
    showError("Mật khẩu xác nhận chưa trùng khớp.");
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
    showError("Vui lòng nhập mã xác minh email.");
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
      showError("Mã xác minh chưa đúng hoặc tài khoản cần xác minh thêm.");
    }
  } catch (error) {
    console.error("Email verification failed:", error);
    showError(getClerkErrorMessage(error));
  } finally {
    setLoading(false, "verify");
  }
}

async function handleGoogleRegister() {
  hideError();

  if (!window.MyPuppyAuth) {
    showError("Chưa tải được cấu hình đăng ký MyPuppy.");
    return;
  }

  setLoading(true);

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    await clerk.client.signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: window.location.href,
      redirectUrlComplete: window.MyPuppyAuth.routes.customer(),
    });
  } catch (error) {
    console.error("Google sign-up failed:", error);
    showError(getClerkErrorMessage(error));
    setLoading(false);
  }
}

async function initRegisterPage() {
  if (!window.MyPuppyAuth) {
    showError("Chưa tải được cấu hình đăng ký MyPuppy.");
    return;
  }

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    if (window.location.href.includes("__clerk_status")) {
      await clerk.handleRedirectCallback({
        signInUrl: window.MyPuppyAuth.routes.login(),
        signUpUrl: window.MyPuppyAuth.appPath("customer/pages/dang-ky.html"),
        signInForceRedirectUrl: window.MyPuppyAuth.routes.customer(),
        signUpForceRedirectUrl: window.MyPuppyAuth.routes.customer(),
      });
      return;
    }

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

if (googleRegister) {
  googleRegister.addEventListener("click", handleGoogleRegister);
}

if (toggleRegisterPassword && registerPassword) {
  toggleRegisterPassword.addEventListener("click", () => {
    const isPassword = registerPassword.type === "password";
    registerPassword.type = isPassword ? "text" : "password";
    toggleRegisterPassword.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  });
}

initRegisterPage();
