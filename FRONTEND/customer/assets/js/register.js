const clerkSignUp = document.getElementById("clerk-sign-up");
const clerkLoading = document.getElementById("clerk-loading");
const clerkError = document.getElementById("clerk-error");

function showClerkError() {
  if (clerkLoading) {
    clerkLoading.classList.add("hidden");
  }

  if (clerkError) {
    clerkError.classList.remove("hidden");
  }
}

async function initClerkRegister() {
  if (!window.MyPuppyAuth || !clerkSignUp) {
    showClerkError();
    return;
  }

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();

    if (clerk.isSignedIn && clerk.user) {
      const session = window.MyPuppyAuth.rememberSession(clerk.user);
      window.MyPuppyAuth.redirectToRole(session.role);
      return;
    }

    if (clerkLoading) {
      clerkLoading.classList.add("hidden");
    }

    clerk.mountSignUp(clerkSignUp, {
      appearance: window.MyPuppyAuth.appearance,
      routing: "hash",
      signInUrl: "dang-nhap.html",
      fallbackRedirectUrl: window.MyPuppyAuth.routes.customer(),
      forceRedirectUrl: window.MyPuppyAuth.routes.customer(),
      signInFallbackRedirectUrl: window.MyPuppyAuth.routes.customer(),
      signInForceRedirectUrl: window.MyPuppyAuth.routes.customer(),
    });

    clerk.addListener(({ user }) => {
      if (!user) return;

      const session = window.MyPuppyAuth.rememberSession(user);
      window.MyPuppyAuth.redirectToRole(session.role);
    });
  } catch (error) {
    console.error("Unable to initialize Clerk sign-up:", error);
    showClerkError();
  }
}

initClerkRegister();
