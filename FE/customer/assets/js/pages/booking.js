const bookingService = document.getElementById("booking-service");
const bookingPet = document.getElementById("booking-pet");
const bookingDate = document.getElementById("booking-date");
const bookingTime = document.getElementById("booking-time");
const bookingAddons = document.querySelectorAll("[data-addon]");

const summaryService = document.getElementById("booking-summary-service");
const summaryPet = document.getElementById("booking-summary-pet");
const summaryTime = document.getElementById("booking-summary-time");
const summaryDuration = document.getElementById("booking-summary-duration");
const summaryAddons = document.getElementById("booking-summary-addons");
const summaryTotal = document.getElementById("booking-total");
const bookingSubmit = document.querySelector("[data-booking-submit]");

const CUSTOMER_API_BASE = (window.MyPuppyCustomerApiBase || "http://localhost:4002/api/customer").replace(/\/$/, "");

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function getSelectedServiceOption() {
  return bookingService?.selectedOptions?.[0];
}

function getSelectedAddons() {
  return [...bookingAddons].filter((addon) => addon.checked);
}

function getBookingTotal() {
  const serviceOption = getSelectedServiceOption();
  if (!serviceOption) return 0;

  const basePrice = Number(serviceOption.dataset.price || 0);
  return getSelectedAddons()
    .reduce((total, addon) => total + Number(addon.dataset.price || 0), basePrice);
}

function updateBookingSummary() {
  const serviceOption = getSelectedServiceOption();
  if (!serviceOption) return;

  const basePrice = Number(serviceOption.dataset.price || 0);
  const duration = Number(serviceOption.dataset.duration || 0);
  const addons = getSelectedAddons();
  const addonsTotal = addons.reduce((total, addon) => total + Number(addon.dataset.price || 0), 0);
  const selectedDate = bookingDate?.value
    ? new Date(`${bookingDate.value}T00:00:00`).toLocaleDateString("vi-VN")
    : "Chưa chọn ngày";
  const selectedTime = bookingTime?.value || "09:00";

  summaryService.textContent = serviceOption.textContent.trim();
  summaryPet.textContent = bookingPet.value;
  summaryTime.textContent = `${selectedDate} · ${selectedTime}`;
  summaryDuration.textContent = `${duration} phút`;
  summaryAddons.textContent = addons.length
    ? addons.map((addon) => addon.dataset.addon).join(", ")
    : "Chưa chọn dịch vụ thêm";
  summaryTotal.textContent = formatCurrency(getBookingTotal());
}

function getCustomerId() {
  return sessionStorage.getItem("mypuppy_auth_id")
    || sessionStorage.getItem("mypuppy_customer_id")
    || "";
}

function ensureBookingFeedback() {
  let feedback = document.getElementById("booking-feedback");
  if (!feedback && bookingSubmit) {
    feedback = document.createElement("p");
    feedback.id = "booking-feedback";
    feedback.className = "mt-4 text-sm font-bold leading-6";
    bookingSubmit.insertAdjacentElement("afterend", feedback);
  }
  return feedback;
}

function showBookingFeedback(message, type = "info") {
  const feedback = ensureBookingFeedback();
  if (!feedback) return;

  feedback.textContent = message;
  feedback.classList.toggle("text-emerald-600", type === "success");
  feedback.classList.toggle("text-red-600", type === "error");
  feedback.classList.toggle("text-slate-500", type === "info");
}

async function submitBooking() {
  const serviceOption = getSelectedServiceOption();
  if (!serviceOption || !bookingDate?.value || !bookingTime?.value) {
    showBookingFeedback("Vui lòng chọn đầy đủ dịch vụ, ngày và khung giờ đặt lịch.", "error");
    return;
  }

  const payload = {
    customerId: getCustomerId(),
    serviceId: Number(serviceOption.value),
    petType: bookingPet?.value || "",
    petName: "",
    bookingDate: bookingDate.value,
    bookingTime: bookingTime.value,
    notes: document.querySelector("[data-booking-form] textarea")?.value || "",
    totalAmount: getBookingTotal(),
    addons: getSelectedAddons().map((addon) => addon.dataset.addon),
  };

  try {
    bookingSubmit.disabled = true;
    showBookingFeedback("Đang gửi lịch hẹn tới hệ thống MyPuppy...", "info");

    const response = await fetch(`${CUSTOMER_API_BASE}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error(result.message || `HTTP ${response.status}`);
    }

    showBookingFeedback("Đặt lịch thành công. MyPuppy đã lưu lịch hẹn vào database PetHealth.", "success");
  } catch (error) {
    console.warn("Create booking failed:", error);
    showBookingFeedback("Chưa thể lưu lịch hẹn. Hãy kiểm tra customer backend port 4002 và cấu trúc bảng LichHen.", "error");
  } finally {
    bookingSubmit.disabled = false;
  }
}

function preselectServiceFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("service");
  if (!serviceId || !bookingService) return;

  const matchedOption = [...bookingService.options].find((option) => option.value === serviceId);
  if (matchedOption) {
    bookingService.value = serviceId;
  }
}

function initBookingPage() {
  if (!bookingService) return;

  const today = new Date();
  const todayValue = today.toISOString().split("T")[0];
  bookingDate.min = todayValue;

  preselectServiceFromUrl();
  updateBookingSummary();

  bookingService.addEventListener("change", updateBookingSummary);
  bookingPet.addEventListener("change", updateBookingSummary);
  bookingDate.addEventListener("change", updateBookingSummary);
  bookingTime.addEventListener("change", updateBookingSummary);
  bookingAddons.forEach((addon) => addon.addEventListener("change", updateBookingSummary));
  bookingSubmit?.addEventListener("click", submitBooking);
}

initBookingPage();
