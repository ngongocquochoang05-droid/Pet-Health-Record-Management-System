/**
 * Services Carousel — load tu /api/public/services va render slide.
 * Auto-play 5s, swipe tren mobile, dot indicator, prev/next button.
 */

const CUSTOMER_API_BASE = (window.MyPuppyCustomerApiBase || "http://localhost:4002/api/customer").replace(/\/$/, "");
const LEGACY_PUBLIC_API_BASE = window.MyPuppyAdminApiBase
  ? window.MyPuppyAdminApiBase.replace(/\/api\/admin\/?$/, "")
  : "http://localhost:4000";

const CAROUSEL_AUTO_INTERVAL_MS = 5500;

// Anh placeholder Unsplash mac dinh theo keyword.
// Map dua tren ID dich vu trong DB (1: kham, 2: spa, 3: tiem phong).
const SERVICE_IMAGES = {
  1: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1400&q=80",
  2: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=1400&q=80",
  3: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1400&q=80",
};

// Highlights bo sung — DB chi co MoTa ngan, hard-code chi tiet de hien dep hon.
const SERVICE_HIGHLIGHTS = {
  // 1: Kham tong quat
  1: {
    tagline: "Kiểm tra sức khỏe định kỳ",
    suitableFor: "Mọi giống chó mèo từ 2 tháng tuổi",
    includes: [
      "Khám lâm sàng tổng quát: tim, phổi, da, lông, mắt, tai",
      "Kiểm tra cân nặng và chỉ số cơ thể (BCS)",
      "Tư vấn chế độ dinh dưỡng phù hợp",
      "Xuất sổ khám và lịch nhắc tiêm phòng tiếp theo",
    ],
  },
  // 2: Spa & Grooming tron goi
  2: {
    tagline: "Trải nghiệm chăm sóc cao cấp toàn diện",
    suitableFor: "Chó/mèo lông dài, cần grooming chuyên sâu",
    includes: [
      "Tắm sạch với dầu gội và dầu xả nhập khẩu",
      "Sấy khô bằng máy chuyên dụng, không gây stress",
      "Cắt tỉa lông tạo kiểu nghệ thuật theo yêu cầu",
      "Cắt móng, vệ sinh tai, mắt và túi hôi",
    ],
  },
  // 3: Tiem phong vacxin 7 benh
  3: {
    tagline: "Vacxin chính hãng, an toàn cho thú cưng",
    suitableFor: "Chó từ 6 tuần tuổi trở lên",
    includes: [
      "Vacxin phòng 7 bệnh nguy hiểm: Care, Parvo, Lepto, Rabies, Hepatitis...",
      "Khám sức khỏe trước khi tiêm để đảm bảo an toàn",
      "Theo dõi phản ứng sau tiêm trong 30 phút tại phòng khám",
      "Sổ tiêm chính hãng có dán tem, lịch nhắc lần sau",
    ],
  },
};

const FALLBACK_HIGHLIGHTS = {
  tagline: "Dịch vụ chuyên nghiệp tại MyPuppy",
  suitableFor: "Mọi giống chó mèo",
  includes: [
    "Đội ngũ chuyên viên giàu kinh nghiệm",
    "Trang thiết bị hiện đại, chuẩn quốc tế",
    "Quy trình chăm sóc an toàn, đúng tiêu chuẩn",
  ],
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1400&q=80";

const DEFAULT_SERVICES = [
  {
    id: 1,
    name: "Spa thư giãn cao cấp",
    description: "Gói chăm sóc toàn diện gồm tắm sạch, massage thư giãn, vệ sinh tai, cắt móng và dưỡng lông mềm mượt.",
    price: 350000,
    duration: 120,
    bookingCount: 128,
    ranking: 1,
  },
  {
    id: 2,
    name: "Cắt tỉa lông",
    description: "Tạo kiểu gọn gàng theo dáng thú cưng, xử lý lông rối và hoàn thiện diện mạo sạch đẹp, dễ chăm sóc.",
    price: 220000,
    duration: 90,
    bookingCount: 96,
    ranking: 2,
  },
  {
    id: 3,
    name: "Tắm và sấy lông",
    description: "Tắm bằng sản phẩm dịu nhẹ, sấy khô an toàn và khử mùi giúp thú cưng thơm tho, thoải mái hơn.",
    price: 150000,
    duration: 60,
    bookingCount: 82,
    ranking: 3,
  },
];

const root = document.getElementById("services-carousel");
if (root) {
  init();
}

async function init() {
  root.innerHTML = renderLoading();

  try {
    const services = await fetchServices();
    const visibleServices = services.length ? services : DEFAULT_SERVICES;
    root.innerHTML = renderCarousel(visibleServices);
    bindCarousel(visibleServices.length);
  } catch (error) {
    console.warn("Load services failed, render fallback services:", error);
    root.innerHTML = renderCarousel(DEFAULT_SERVICES);
    bindCarousel(DEFAULT_SERVICES.length);
  }
}

async function fetchServices() {
  const urls = [
    `${CUSTOMER_API_BASE}/services`,
    `${LEGACY_PUBLIC_API_BASE}/api/public/services`,
  ];

  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload.success) {
        throw new Error(payload.message || "Fetch failed");
      }
      return payload.data || [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Fetch failed");
}

function renderLoading() {
  return `
    <div class="services-carousel__placeholder">
      <span class="services-carousel__spinner"></span>
      <p>Đang tải danh sách dịch vụ...</p>
    </div>
  `;
}

function renderEmpty() {
  return `
    <div class="services-carousel__placeholder">
      <p>Chưa có dịch vụ nào. Hãy liên hệ MyPuppy để biết thêm.</p>
    </div>
  `;
}

function renderError(message) {
  return `
    <div class="services-carousel__placeholder services-carousel__placeholder--error">
      <p>Không tải được danh sách dịch vụ.</p>
      <small>${escapeHtml(message)}</small>
      <small>Đảm bảo backend admin đang chạy ở port 4000.</small>
    </div>
  `;
}

function renderCarousel(services) {
  const slides = services.map((service, index) => renderSlide(service, index)).join("");
  const dots = services
    .map((_, index) => `<button type="button" class="services-carousel__dot${index === 0 ? " is-active" : ""}" data-slide-index="${index}" aria-label="Đến slide ${index + 1}"></button>`)
    .join("");

  return `
    <div class="services-carousel__viewport">
      <div class="services-carousel__track">${slides}</div>
    </div>

    <button type="button" class="services-carousel__arrow services-carousel__arrow--prev" data-slide-direction="prev" aria-label="Dịch vụ trước">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m15 19-7-7 7-7"></path>
      </svg>
    </button>
    <button type="button" class="services-carousel__arrow services-carousel__arrow--next" data-slide-direction="next" aria-label="Dịch vụ kế tiếp">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m9 5 7 7-7 7"></path>
      </svg>
    </button>

    <div class="services-carousel__dots" role="tablist">${dots}</div>
  `;
}

function renderSlide(service, index) {
  const image = SERVICE_IMAGES[service.id] || FALLBACK_IMAGE;
  const highlights = SERVICE_HIGHLIGHTS[service.id] || FALLBACK_HIGHLIGHTS;
  const rankClass = service.ranking === 1 ? "is-top1"
    : service.ranking === 2 ? "is-top2"
    : service.ranking === 3 ? "is-top3"
    : "";

  const includesHtml = highlights.includes
    .map((item) => `
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="m5 12 5 5L20 7"></path>
        </svg>
        <span>${escapeHtml(item)}</span>
      </li>
    `).join("");

  return `
    <article class="services-carousel__slide ${index === 0 ? "is-active" : ""}" data-slide="${index}">
      <div class="services-carousel__media">
        <img src="${image}" alt="${escapeHtml(service.name)}" loading="${index === 0 ? "eager" : "lazy"}">
        <span class="services-carousel__rank ${rankClass}">
          <span class="services-carousel__rank-label">Top</span>
          <span class="services-carousel__rank-number">#${service.ranking}</span>
        </span>
      </div>
      <div class="services-carousel__body">
        <p class="services-carousel__bookings">${formatBookings(service.bookingCount)} lượt đặt lịch · ${escapeHtml(highlights.tagline)}</p>
        <h3 class="services-carousel__title">${escapeHtml(service.name)}</h3>
        <p class="services-carousel__description">${escapeHtml(service.description) || "Dịch vụ chất lượng cao tại MyPuppy."}</p>

        <div class="services-carousel__suitable">
          <span class="services-carousel__suitable-label">Phù hợp với</span>
          <span class="services-carousel__suitable-value">${escapeHtml(highlights.suitableFor)}</span>
        </div>

        <div class="services-carousel__includes">
          <p class="services-carousel__includes-title">Bao gồm trong gói</p>
          <ul>${includesHtml}</ul>
        </div>

        <div class="services-carousel__meta">
          <span class="services-carousel__chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M12 7v5l3 2"></path>
            </svg>
            ${service.duration} phút
          </span>
          <span class="services-carousel__chip services-carousel__chip--price">
            ${formatPrice(service.price)}
          </span>
          <a href="#dat-lich" class="services-carousel__cta" data-service-id="${service.id}">
            Đặt dịch vụ
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M5 12h14"></path>
              <path d="m13 5 7 7-7 7"></path>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

function bindCarousel(slideCount) {
  let currentIndex = 0;
  let autoTimer = null;

  const track = root.querySelector(".services-carousel__track");
  const slides = root.querySelectorAll(".services-carousel__slide");
  const dots = root.querySelectorAll(".services-carousel__dot");

  function goTo(index) {
    currentIndex = (index + slideCount) % slideCount;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === currentIndex));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === currentIndex));
  }

  function next() { goTo(currentIndex + 1); }
  function prev() { goTo(currentIndex - 1); }

  function startAuto() {
    stopAuto();
    autoTimer = window.setInterval(next, CAROUSEL_AUTO_INTERVAL_MS);
  }
  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  root.addEventListener("click", (event) => {
    const dir = event.target.closest("[data-slide-direction]");
    const dot = event.target.closest("[data-slide-index]");
    const serviceCta = event.target.closest("[data-service-id]");

    if (serviceCta) {
      const bookingService = document.getElementById("booking-service");
      if (bookingService) {
        bookingService.value = serviceCta.dataset.serviceId;
        bookingService.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    if (dir) {
      stopAuto();
      dir.dataset.slideDirection === "next" ? next() : prev();
      startAuto();
    } else if (dot) {
      stopAuto();
      goTo(Number(dot.dataset.slideIndex));
      startAuto();
    }
  });

  // Pause auto khi hover.
  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  // Swipe tren mobile.
  let touchStartX = 0;
  root.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    stopAuto();
  }, { passive: true });
  root.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      dx < 0 ? next() : prev();
    }
    startAuto();
  });

  // Keyboard navigation.
  root.tabIndex = 0;
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      stopAuto(); prev(); startAuto();
    } else if (event.key === "ArrowRight") {
      stopAuto(); next(); startAuto();
    }
  });

  startAuto();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPrice(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatBookings(count) {
  return new Intl.NumberFormat("vi-VN").format(Number(count || 0));
}
