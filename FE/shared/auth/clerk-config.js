(function () {
  const keys = window.MyPuppyClerkKeys || {};

  if (!keys.publishableKey || !keys.frontendApiUrl) {
    console.error(
      "MyPuppy: thieu Clerk Publishable Key. Tao FE/shared/auth/clerk-keys.js dua tren clerk-keys.example.js, hoac set bien moi truong CLERK_PUBLISHABLE_KEY va CLERK_FRONTEND_API_URL khi deploy.",
    );
  }

  const config = {
    publishableKey: keys.publishableKey || "",
    frontendApiUrl: keys.frontendApiUrl || "",
    roleByEmail: {
      "admin@mypuppy.vn": "admin",
      "staff@mypuppy.vn": "staff",
      "mai@mypuppy.vn": "staff",
      "minhnguyen@gmail.com": "customer",
    },
  };

  let clerkLoadPromise;

  function getAppBasePath() {
    const marker = "/FE/";
    const pathname = window.location.pathname.replace(/\\/g, "/");
    const markerIndex = pathname.indexOf(marker);

    if (markerIndex >= 0) {
      return pathname.slice(0, markerIndex + marker.length);
    }

    return "/";
  }

  function appPath(path) {
    return `${getAppBasePath()}${path.replace(/^\/+/, "")}`;
  }

  const routes = {
    login: () => appPath("customer/pages/auth/dang-nhap.html"),
    customer: () => appPath("customer/index.html"),
    staff: () => appPath("staff/index.html"),
    admin: () => appPath("admin/index.html"),
  };

  const appearance = {
    layout: {
      socialButtonsPlacement: "bottom",
      socialButtonsVariant: "blockButton",
    },
    variables: {
      colorPrimary: "#38bdf8",
      colorText: "#0f172a",
      colorTextSecondary: "#64748b",
      colorBackground: "#ffffff",
      colorInputBackground: "#ffffff",
      colorInputText: "#0f172a",
      borderRadius: "1.1rem",
      fontFamily: "Inter, sans-serif",
    },
    elements: {
      rootBox: {
        width: "100%",
      },
      card: {
        width: "100%",
        boxShadow: "none",
        border: "0",
        background: "transparent",
      },
      cardBox: {
        width: "100%",
        boxShadow: "none",
        border: "0",
        background: "transparent",
      },
      footer: {
        background: "transparent",
        borderTop: "1px solid rgba(226, 232, 240, 0.9)",
      },
      headerTitle: {
        color: "#0f172a",
        fontWeight: "800",
      },
      formButtonPrimary: {
        background: "linear-gradient(135deg, #38bdf8, #0284c7)",
        boxShadow: "0 16px 32px rgba(14, 165, 233, 0.24)",
      },
      footerActionLink: {
        color: "#0284c7",
        fontWeight: "700",
      },
      socialButtonsBlockButton: {
        borderRadius: "1rem",
      },
      formFieldInput: {
        borderRadius: "1rem",
      },
    },
  };

  function loadScript(src, attributes = {}) {
    return new Promise((resolve, reject) => {
      // Tim script da load tu truoc bang cach lap qua tags thay vi
      // querySelector — vi src cua Clerk co ky tu @ khong hop le voi CSS selector.
      const existingScript = Array.from(document.scripts).find(
        (s) => s.src === src,
      );

      if (existingScript) {
        if (existingScript.dataset.loaded === "true") {
          resolve();
          return;
        }
        existingScript.addEventListener("load", resolve, { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.type = "text/javascript";

      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      script.addEventListener(
        "load",
        () => {
          script.dataset.loaded = "true";
          resolve();
        },
        { once: true },
      );
      script.addEventListener("error", reject, { once: true });

      document.head.appendChild(script);
    });
  }

  async function loadClerk() {
    if (clerkLoadPromise) {
      return clerkLoadPromise;
    }

    clerkLoadPromise = (async () => {
      if (!window.Clerk) {
        await loadScript(
          `${config.frontendApiUrl}/npm/@clerk/clerk-js@5/dist/clerk.browser.js`,
          {
            "data-clerk-publishable-key": config.publishableKey,
          },
        );
      }

      if (!window.Clerk) {
        throw new Error(
          "MyPuppy: khong tai duoc Clerk JS. Kiem tra CLERK_FRONTEND_API_URL.",
        );
      }

      if (!window.Clerk.loaded) {
        await window.Clerk.load();
      }

      return window.Clerk;
    })();

    return clerkLoadPromise;
  }

  function getPrimaryEmail(user) {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      ""
    ).toLowerCase();
  }

  function getDisplayName(user) {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();

    return (
      user?.fullName ||
      fullName ||
      user?.username ||
      getPrimaryEmail(user) ||
      "Khach hang"
    );
  }

  function getUserRole(user) {
    const metadataRole = user?.publicMetadata?.role;

    if (["admin", "staff", "customer"].includes(metadataRole)) {
      return metadataRole;
    }

    return config.roleByEmail[getPrimaryEmail(user)] || "customer";
  }

  function clearDemoSessions() {
    sessionStorage.removeItem("mypuppy_customer_logged_in");
    sessionStorage.removeItem("mypuppy_customer_name");
    sessionStorage.removeItem("mypuppy_staff_logged_in");
    sessionStorage.removeItem("mypuppy_staff_name");
    sessionStorage.removeItem("mypuppy_admin_logged_in");
    sessionStorage.removeItem("mypuppy_redirect_after_auth");
  }

  function rememberSession(user) {
    const role = getUserRole(user);
    const name = getDisplayName(user);

    clearDemoSessions();
    sessionStorage.setItem("mypuppy_auth_role", role);
    sessionStorage.setItem("mypuppy_auth_name", name);

    if (role === "customer") {
      sessionStorage.setItem("mypuppy_customer_logged_in", "true");
      sessionStorage.setItem("mypuppy_customer_name", name);
    }

    if (role === "staff") {
      sessionStorage.setItem("mypuppy_staff_logged_in", "true");
      sessionStorage.setItem("mypuppy_staff_name", name);
    }

    if (role === "admin") {
      sessionStorage.setItem("mypuppy_admin_logged_in", "true");
    }

    return { role, name };
  }

  function redirectToRole(role) {
    const route = routes[role] || routes.customer;
    window.location.href = route();
  }

  async function signOut(returnPath) {
    try {
      const clerk = await loadClerk();

      if (clerk?.isSignedIn) {
        await clerk.signOut();
      }
    } finally {
      clearDemoSessions();
      sessionStorage.removeItem("mypuppy_auth_role");
      sessionStorage.removeItem("mypuppy_auth_name");
      window.location.href = returnPath || routes.customer();
    }
  }

  async function requireRole(expectedRole) {
    const clerk = await loadClerk();

    if (!clerk.isSignedIn || !clerk.user) {
      window.location.href = routes.login();
      return null;
    }

    const session = rememberSession(clerk.user);

    if (session.role !== expectedRole) {
      redirectToRole(session.role);
      return null;
    }

    return session;
  }

  window.MyPuppyAuth = {
    appearance,
    appPath,
    clearDemoSessions,
    config,
    getDisplayName,
    getPrimaryEmail,
    getUserRole,
    loadClerk,
    redirectToRole,
    rememberSession,
    requireRole,
    routes,
    signOut,
  };
})();
