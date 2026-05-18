const CUSTOMER_API_BASE = (window.MyPuppyCustomerApiBase || "http://localhost:4002/api/customer").replace(/\/$/, "");

function setProfileText(selector, value, fallback = "Chưa cập nhật") {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value || fallback;
  });
}

async function getCurrentCustomerId() {
  const cachedId = sessionStorage.getItem("mypuppy_customer_id")
    || sessionStorage.getItem("mypuppy_auth_id");
  if (cachedId) return cachedId;

  if (!window.MyPuppyAuth) return "";

  try {
    const clerk = await window.MyPuppyAuth.loadClerk();
    if (clerk.isSignedIn && clerk.user) {
      window.MyPuppyAuth.rememberSession(clerk.user);
      return clerk.user.id || "";
    }
  } catch (error) {
    console.warn("Khong lay duoc Clerk user cho profile.", error);
  }

  return "";
}

async function loadCustomerProfile() {
  const customerId = await getCurrentCustomerId();
  if (!customerId) {
    setProfileText("[data-profile-status]", "Chưa đăng nhập", "Chưa đăng nhập");
    return;
  }

  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/profile/${encodeURIComponent(customerId)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload.success || !payload.data) throw new Error(payload.message || "Profile not found");

    const profile = payload.data;
    setProfileText("[data-customer-name]", profile.fullName, "Khách hàng");
    setProfileText("[data-profile-email]", profile.email);
    setProfileText("[data-profile-phone]", profile.phone);
    setProfileText("[data-profile-status]", profile.status === "active" ? "Đang hoạt động" : "Đã khóa");
  } catch (error) {
    console.warn("Khong tai duoc ho so tu customer backend.", error);
    setProfileText("[data-profile-status]", "Chưa kết nối backend", "Chưa kết nối backend");
  }
}

window.addEventListener("DOMContentLoaded", loadCustomerProfile);
