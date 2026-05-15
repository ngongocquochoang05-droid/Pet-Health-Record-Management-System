const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const googleLogin = document.getElementById("google-login");
const togglePassword = document.getElementById("toggle-password");

function setLoading(isLoading) {
  if (loginSubmit) {
    loginSubmit.disabled = isLoading;
    loginSubmit.textContent = isLoading ? "Đang đăng nhập..." : "Đăng nhập";
  }

  if (googleLogin) {
    googleLogin.disabled = isLoading;
  }
}

function showError(message) {
  if (!loginError) return;

  loginError.textContent = message || "Thông tin đăng nhập chưa đúng. Vui lòng thử lại.";
  loginError.classList.remove("hidden");
}

function hideError() {
  if (loginError) {
    loginError.classList.add("hidden");
  }
}

function getClerkErrorMessage(error) {
  return (
    error?.errors?.[0]?.longMessage ||
    error?.errors?.[0]?.message ||
    error?.message ||
    "Không thể đăng nhập. Vui lòng thử lại."
  );
}

async function completeLogin(clerk, signInAttempt) {
  if (signInAttempt?.status !== "complete" || !signInAttempt?.createdSessionId) {
    showError("Tài khoản cần xác minh thêm trước khi đăng nhập.");
    return;
  }

  await clerk.setActive({ session: signInAttempt.createdSessionId });
  const user = clerk.user || clerk.session?.user;

  if (!user) {
    window.location.href = window.MyPuppyAuth.routes.customer();
    return;
  }

  const session = window.MyPuppyAuth.rememberSession(user);
  window.MyPuppyAuth.redirectToRole(session.role);
}

async function handleEmailPasswordLogin(event) {
  event.preventDefault();
  hideError();

  if (!window.MyPuppyAuth) {
    showError("Chưa tải được cấu hình đăng nhập MyPuppy.");
    return;
  }

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    showError("Vui lòng nhập đầy đủ email và mật khẩu.");
    return;
  }

  setLoading(true);

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    const signInAttempt = await clerk.client.signIn.create({
      identifier: email,
      password,
    });

    await completeLogin(clerk, signInAttempt);
  } catch (error) {
    console.error("Email/password sign-in failed:", error);
    showError(getClerkErrorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function handleGoogleLogin() {
  hideError();

  if (!window.MyPuppyAuth) {
    showError("Chưa tải được cấu hình đăng nhập MyPuppy.");
    return;
  }

  setLoading(true);

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    await clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: window.location.href,
      redirectUrlComplete: window.MyPuppyAuth.routes.customer(),
    });
  } catch (error) {
    console.error("Google sign-in failed:", error);
    showError(getClerkErrorMessage(error));
    setLoading(false);
  }
}

async function initLoginPage() {
  if (!window.MyPuppyAuth) {
    showError("Chưa tải được cấu hình đăng nhập MyPuppy.");
    return;
  }

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    if (window.location.href.includes("__clerk_status")) {
      await clerk.handleRedirectCallback({
        signInUrl: window.MyPuppyAuth.routes.login(),
        signUpUrl: `${window.MyPuppyAuth.appPath("customer/pages/dang-ky.html")}`,
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
    console.warn("Clerk login page init failed:", error);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", handleEmailPasswordLogin);
}

if (googleLogin) {
  googleLogin.addEventListener("click", handleGoogleLogin);
}

if (togglePassword && loginPassword) {
  togglePassword.addEventListener("click", () => {
    const isPassword = loginPassword.type === "password";
    loginPassword.type = isPassword ? "text" : "password";
    togglePassword.setAttribute("aria-label", isPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu");
  });
}

initLoginPage();
