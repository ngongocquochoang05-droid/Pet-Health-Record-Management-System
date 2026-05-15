const loginForm = document.getElementById("login-form");
const loginVerifyForm = document.getElementById("login-verify-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginCode = document.getElementById("login-code");
const loginError = document.getElementById("login-error");
const loginSubmit = document.getElementById("login-submit");
const loginVerifySubmit = document.getElementById("login-verify-submit");
const googleLogin = document.getElementById("google-login");
const togglePassword = document.getElementById("toggle-password");

let pendingSignIn = null;
let pendingVerificationStep = null;
const redirectAfterAuthKey = "mypuppy_redirect_after_auth";
const redirectAfterAuthMaxAge = 5 * 60 * 1000;

function markRedirectAfterAuth() {
  sessionStorage.setItem(redirectAfterAuthKey, String(Date.now()));
}

function clearRedirectAfterAuth() {
  sessionStorage.removeItem(redirectAfterAuthKey);
}

function shouldRedirectAfterAuth() {
  const createdAt = Number(sessionStorage.getItem(redirectAfterAuthKey));

  if (!Number.isFinite(createdAt)) {
    clearRedirectAfterAuth();
    return false;
  }

  if (Date.now() - createdAt > redirectAfterAuthMaxAge) {
    clearRedirectAfterAuth();
    return false;
  }

  return true;
}

function isClerkRedirectUrl() {
  const href = window.location.href;
  return href.includes("__clerk") || href.includes("_clerk") || href.includes("created_session");
}

function getAuthCompleteUrl() {
  return window.MyPuppyAuth.appPath("customer/pages/auth-complete.html");
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setLoading(isLoading, target = "login") {
  const button = target === "verify" ? loginVerifySubmit : loginSubmit;

  if (button) {
    button.disabled = isLoading;
    button.textContent = target === "verify" ? "Xác minh và đăng nhập" : "Đăng nhập";
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

function getFriendlyClerkErrorMessage(error) {
  const rawMessage = getClerkErrorMessage(error);
  const normalizedMessage = rawMessage.toLowerCase();

  if (normalizedMessage.includes("verified not supported yet")) {
    return "Clerk chưa hỗ trợ bước xác minh này cho tài khoản hiện tại. Bạn hãy thử Tiếp tục với Google hoặc kiểm tra lại phương thức đăng nhập trong Clerk Dashboard.";
  }

  if (normalizedMessage.includes("password") && normalizedMessage.includes("not")) {
    return "Tài khoản này có thể chưa thiết lập mật khẩu. Bạn hãy dùng Tiếp tục với Google hoặc đăng ký tài khoản bằng email và mật khẩu.";
  }

  if (normalizedMessage.includes("sign up") && normalizedMessage.includes("not allowed")) {
    return "Clerk hiện chưa cho phép tạo tài khoản mới. Hãy bật đăng ký người dùng trong Clerk Dashboard.";
  }

  return rawMessage;
}

async function completeLogin(clerk, signInAttempt) {
  if (signInAttempt?.status !== "complete" || !signInAttempt?.createdSessionId) {
    return false;
  }

  await clerk.setActive({ session: signInAttempt.createdSessionId });

  try {
    await clerk.load();
  } catch (error) {
    console.warn("Unable to reload Clerk after setActive:", error);
  }

  const user = clerk.user || clerk.session?.user || signInAttempt.userData;
  const session = window.MyPuppyAuth.rememberSession(user);
  window.MyPuppyAuth.redirectToRole(session.role);
  return true;
}

async function redirectSignedInUser(clerk, attempts = 1) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await activateCompletedOauthSession(clerk);

    try {
      await clerk.load();
    } catch (error) {
      console.warn("Unable to reload Clerk before redirect:", error);
    }

    if (clerk.isSignedIn && clerk.user) {
      clearRedirectAfterAuth();
      const session = window.MyPuppyAuth.rememberSession(clerk.user);
      window.MyPuppyAuth.redirectToRole(session.role);
      return true;
    }

    if (attempt < attempts - 1) {
      await wait(180);
    }
  }

  return false;
}

async function activateCompletedOauthSession(clerk) {
  const createdSessionId =
    clerk.client?.signIn?.createdSessionId ||
    clerk.client?.signUp?.createdSessionId;

  if (!createdSessionId) {
    return false;
  }

  try {
    await clerk.setActive({ session: createdSessionId });
    return true;
  } catch (error) {
    console.warn("Unable to activate OAuth session:", error);
    return false;
  }
}

function getEmailCodeFactor(signInAttempt) {
  const secondFactor = (signInAttempt?.supportedSecondFactors || []).find(
    (factor) => factor.strategy === "email_code",
  );

  if (secondFactor) {
    return { factor: secondFactor, step: "second" };
  }

  const firstFactor = (signInAttempt?.supportedFirstFactors || []).find(
    (factor) => factor.strategy === "email_code",
  );

  if (firstFactor) {
    return { factor: firstFactor, step: "first" };
  }

  return null;
}

async function showEmailVerificationStep(signInAttempt) {
  const emailCode = getEmailCodeFactor(signInAttempt);
  const prepareMethod =
    emailCode?.step === "second" ? "prepareSecondFactor" : "prepareFirstFactor";

  if (!emailCode || typeof signInAttempt[prepareMethod] !== "function") {
    showError("Tài khoản cần xác minh thêm. Hãy kiểm tra email, mật khẩu hoặc cài đặt Clerk.");
    return;
  }

  await signInAttempt[prepareMethod]({
    strategy: "email_code",
    emailAddressId: emailCode.factor.emailAddressId,
  });

  pendingSignIn = signInAttempt;
  pendingVerificationStep = emailCode.step;
  loginForm.classList.add("hidden");
  loginVerifyForm.classList.remove("hidden");
  loginCode.focus();
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
    const isComplete = await completeLogin(clerk, signInAttempt);

    if (!isComplete) {
      await showEmailVerificationStep(signInAttempt);
    }
  } catch (error) {
    console.error("Email/password sign-in failed:", error);
    showError(getFriendlyClerkErrorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function handleEmailVerification(event) {
  event.preventDefault();
  hideError();

  if (!pendingSignIn) {
    showError("Phiên đăng nhập đã hết hạn. Vui lòng nhập lại email và mật khẩu.");
    pendingVerificationStep = null;
    loginVerifyForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    return;
  }

  const code = loginCode.value.trim();

  if (!code) {
    showError("Vui lòng nhập mã xác minh email.");
    return;
  }

  setLoading(true, "verify");

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    const attemptMethod =
      pendingVerificationStep === "second" ? "attemptSecondFactor" : "attemptFirstFactor";

    if (typeof pendingSignIn[attemptMethod] !== "function") {
      showError("Clerk chưa hỗ trợ bước xác minh này. Vui lòng thử đăng nhập lại.");
      return;
    }

    const signInAttempt = await pendingSignIn[attemptMethod]({
      strategy: "email_code",
      code,
    });
    const isComplete = await completeLogin(clerk, signInAttempt);

    if (!isComplete) {
      showError("Mã xác minh chưa đúng hoặc tài khoản cần xác minh thêm.");
    }
  } catch (error) {
    console.error("Email verification failed:", error);
    showError(getFriendlyClerkErrorMessage(error));
  } finally {
    setLoading(false, "verify");
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

    if (typeof clerk.client?.signIn?.authenticateWithRedirect !== "function") {
      showError("Chưa tải được đăng nhập Google từ Clerk. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    markRedirectAfterAuth();

    await clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: window.MyPuppyAuth.appPath("customer/pages/sso-callback.html"),
      redirectUrlComplete: getAuthCompleteUrl(),
    });
  } catch (error) {
    console.error("Google sign-in failed:", error);
    clearRedirectAfterAuth();
    showError(getFriendlyClerkErrorMessage(error));
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
    const isClerkRedirect = isClerkRedirectUrl();
    const oauthStatus = new URLSearchParams(window.location.search).get("oauth");

    if (oauthStatus === "error") {
      clearRedirectAfterAuth();
      window.history.replaceState(null, document.title, window.MyPuppyAuth.routes.login());
      showError("Không thể hoàn tất đăng nhập Google. Vui lòng thử lại.");
      return;
    }

    if (isClerkRedirect) {
      markRedirectAfterAuth();
      const loginUrl = window.MyPuppyAuth.routes.login();

      await clerk.handleRedirectCallback({
        signInUrl: loginUrl,
        signUpUrl: loginUrl,
        continueSignInUrl: getAuthCompleteUrl(),
        continueSignUpUrl: window.MyPuppyAuth.appPath("customer/pages/sso-continue.html"),
        redirectUrlComplete: getAuthCompleteUrl(),
        transferable: true,
      });

      const redirected = await redirectSignedInUser(clerk, 8);
      if (!redirected) {
        clearRedirectAfterAuth();
        window.history.replaceState(null, document.title, loginUrl);
        showError("Tài khoản Google chưa hoàn tất đăng nhập hoặc đăng ký. Vui lòng kiểm tra Clerk đã bật Google OAuth và cho phép tạo tài khoản mới.");
      }
      return;
    }

    if (shouldRedirectAfterAuth()) {
      const redirected = await redirectSignedInUser(clerk, 4);
      if (!redirected) {
        clearRedirectAfterAuth();
      }
    }
  } catch (error) {
    console.warn("Clerk login page init failed:", error);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", handleEmailPasswordLogin);
}

if (loginVerifyForm) {
  loginVerifyForm.addEventListener("submit", handleEmailVerification);
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

setLoading(false);
initLoginPage();
