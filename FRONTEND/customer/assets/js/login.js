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
const redirectAfterAuthKey = "mypuppy_redirect_after_auth";

function setLoading(isLoading, target = "login") {
  const button = target === "verify" ? loginVerifySubmit : loginSubmit;

  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading
      ? target === "verify"
        ? "Dang xac minh..."
        : "Dang dang nhap..."
      : target === "verify"
        ? "Xac minh va dang nhap"
        : "Dang nhap";
  }

  if (googleLogin) {
    googleLogin.disabled = isLoading;
  }
}

function showError(message) {
  if (!loginError) return;

  loginError.textContent = message || "Thong tin dang nhap chua dung. Vui long thu lai.";
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
    "Khong the dang nhap. Vui long thu lai."
  );
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

function getEmailCodeFactor(signInAttempt) {
  const factors = [
    ...(signInAttempt?.supportedSecondFactors || []),
    ...(signInAttempt?.supportedFirstFactors || []),
  ];

  return factors.find((factor) => factor.strategy === "email_code");
}

async function showEmailVerificationStep(signInAttempt) {
  const emailCodeFactor = getEmailCodeFactor(signInAttempt);

  if (!emailCodeFactor || typeof signInAttempt.prepareSecondFactor !== "function") {
    showError("Tai khoan can xac minh them. Hay kiem tra email, mat khau hoac cai dat Clerk.");
    return;
  }

  await signInAttempt.prepareSecondFactor({
    strategy: "email_code",
    emailAddressId: emailCodeFactor.emailAddressId,
  });

  pendingSignIn = signInAttempt;
  loginForm.classList.add("hidden");
  loginVerifyForm.classList.remove("hidden");
  loginCode.focus();
}

async function handleEmailPasswordLogin(event) {
  event.preventDefault();
  hideError();

  if (!window.MyPuppyAuth) {
    showError("Chua tai duoc cau hinh dang nhap MyPuppy.");
    return;
  }

  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    showError("Vui long nhap day du email va mat khau.");
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
    showError(getClerkErrorMessage(error));
  } finally {
    setLoading(false);
  }
}

async function handleEmailVerification(event) {
  event.preventDefault();
  hideError();

  if (!pendingSignIn) {
    showError("Phien dang nhap da het han. Vui long nhap lai email va mat khau.");
    loginVerifyForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    return;
  }

  const code = loginCode.value.trim();

  if (!code) {
    showError("Vui long nhap ma xac minh email.");
    return;
  }

  setLoading(true, "verify");

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    const signInAttempt = await pendingSignIn.attemptSecondFactor({
      strategy: "email_code",
      code,
    });
    const isComplete = await completeLogin(clerk, signInAttempt);

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

async function handleGoogleLogin() {
  hideError();

  if (!window.MyPuppyAuth) {
    showError("Chua tai duoc cau hinh dang nhap MyPuppy.");
    return;
  }

  setLoading(true);

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    sessionStorage.setItem(redirectAfterAuthKey, "true");

    await clerk.client.signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: window.location.href,
      redirectUrlComplete: window.MyPuppyAuth.routes.login(),
    });
  } catch (error) {
    console.error("Google sign-in failed:", error);
    showError(getClerkErrorMessage(error));
    setLoading(false);
  }
}

async function initLoginPage() {
  if (!window.MyPuppyAuth) {
    showError("Chua tai duoc cau hinh dang nhap MyPuppy.");
    return;
  }

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    const shouldRedirectAfterAuth = sessionStorage.getItem(redirectAfterAuthKey) === "true";

    if (window.location.href.includes("__clerk_status")) {
      sessionStorage.setItem(redirectAfterAuthKey, "true");

      await clerk.handleRedirectCallback({
        signInUrl: window.MyPuppyAuth.routes.login(),
        signUpUrl: window.MyPuppyAuth.appPath("customer/pages/dang-ky.html"),
        signInForceRedirectUrl: window.MyPuppyAuth.routes.login(),
        signUpForceRedirectUrl: window.MyPuppyAuth.routes.login(),
      });
      return;
    }

    if (clerk.isSignedIn && clerk.user && shouldRedirectAfterAuth) {
      sessionStorage.removeItem(redirectAfterAuthKey);
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
    togglePassword.setAttribute("aria-label", isPassword ? "An mat khau" : "Hien mat khau");
  });
}

initLoginPage();
