let shopProducts = [
  {
    id: "vitamin-long-muot",
    name: "Vitamin tổng hợp cho thú cưng",
    need: "Sức khỏe",
    category: "health",
    badge: "Bán chạy",
    price: 180000,
    image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80",
    description: "Bổ sung dưỡng chất hằng ngày, hỗ trợ lông mượt, tiêu hóa ổn định và tăng sức đề kháng.",
  },
  {
    id: "vong-co-premium",
    name: "Vòng cổ thú cưng premium",
    need: "Dạo chơi",
    category: "walk",
    badge: "Mới",
    price: 120000,
    image: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=1200&q=80",
    description: "Chất liệu mềm, khóa chắc chắn, dễ điều chỉnh kích thước cho chó mèo nhỏ và vừa.",
  },
  {
    id: "day-dat-an-toan",
    name: "Dây dắt an toàn",
    need: "Dạo chơi",
    category: "walk",
    badge: "Gợi ý",
    price: 145000,
    image: "https://images.unsplash.com/photo-1601758123927-1965f6c8634b?auto=format&fit=crop&w=1200&q=80",
    description: "Dây chắc tay, móc khóa kim loại bền, phù hợp cho lịch dạo chơi và đưa thú cưng đi spa.",
  },
  {
    id: "dau-goi-grooming",
    name: "Dầu gội grooming dịu nhẹ",
    need: "Grooming",
    category: "grooming",
    badge: "Spa tại nhà",
    price: 210000,
    image: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=1200&q=80",
    description: "Công thức dịu nhẹ, giảm mùi hôi và giúp lông mềm hơn sau mỗi lần tắm tại nhà.",
  },
  {
    id: "bat-an-chong-truot",
    name: "Bát ăn chống trượt",
    need: "Ăn uống",
    category: "daily",
    badge: "Thiết yếu",
    price: 95000,
    image: "https://images.unsplash.com/photo-1601758228006-964e41e5e8eb?auto=format&fit=crop&w=1200&q=80",
    description: "Đế chống trượt chắc chắn, dễ vệ sinh, phù hợp cho bữa ăn hằng ngày của chó mèo.",
  },
  {
    id: "may-chai-long",
    name: "Bộ chải lông cao cấp",
    need: "Grooming",
    category: "grooming",
    badge: "Top chăm sóc",
    price: 280000,
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
    description: "Giảm rối lông, lấy lông rụng nhẹ nhàng và giúp thú cưng thoải mái trước buổi spa.",
  },
];

const shopRoot = document.getElementById("shop-by-need-carousel");
const shopDetailPanel = document.getElementById("shop-detail-panel");
const shopCategoryButtons = document.querySelectorAll("[data-shop-categories] [data-category]");
const shopPriceFilter = document.getElementById("shop-price-filter");
const shopCartCount = document.getElementById("shop-cart-count");

let activeCategory = "all";
let cartCount = 0;

const CUSTOMER_API_BASE = (window.MyPuppyCustomerApiBase || "http://localhost:4002/api/customer").replace(/\/$/, "");
const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1601758123927-1965f6c8634b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1601758228006-964e41e5e8eb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1200&q=80",
];

function normalizeProductCategory(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("vitamin") || text.includes("suc") || text.includes("health")) return "health";
  if (text.includes("vong") || text.includes("day") || text.includes("dao") || text.includes("walk")) return "walk";
  if (text.includes("groom") || text.includes("tam") || text.includes("long")) return "grooming";
  if (text.includes("an") || text.includes("uong") || text.includes("daily")) return "daily";
  return "daily";
}

function mapApiProduct(product, index) {
  const category = normalizeProductCategory(product.category || product.name);
  const needByCategory = {
    health: "Sức khỏe",
    walk: "Dạo chơi",
    grooming: "Grooming",
    daily: "Ăn uống",
  };

  return {
    id: String(product.id),
    name: product.name || "Sản phẩm MyPuppy",
    need: needByCategory[category] || "Phụ kiện",
    category,
    badge: Number(product.stock || 0) > 0 ? "Còn hàng" : "Liên hệ",
    price: Number(product.price || 0),
    image: PRODUCT_IMAGES[index % PRODUCT_IMAGES.length],
    description: product.description || product.category || "Phụ kiện chăm sóc thú cưng được tuyển chọn tại MyPuppy.",
  };
}

async function loadProductsFromBackend() {
  if (!shopRoot) return;

  try {
    const response = await fetch(`${CUSTOMER_API_BASE}/products`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!payload.success) throw new Error(payload.message || "Fetch failed");

    const products = payload.data || [];
    if (products.length) {
      shopProducts = products.map(mapApiProduct);
      renderShop();
    }
  } catch (error) {
    console.warn("Khong tai duoc san pham tu customer backend, dung du lieu demo.", error);
  }
}

function formatShopPrice(price) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function escapeShopHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function matchPriceRange(product) {
  const range = shopPriceFilter?.value || "all";
  if (range === "under150") return product.price < 150000;
  if (range === "150to250") return product.price >= 150000 && product.price <= 250000;
  if (range === "above250") return product.price > 250000;
  return true;
}

function getFilteredProducts() {
  return shopProducts.filter((product) => {
    const matchCategory = activeCategory === "all" || product.category === activeCategory;
    return matchCategory && matchPriceRange(product);
  });
}

function renderShop() {
  if (!shopRoot) return;

  const products = getFilteredProducts();
  if (!products.length) {
    shopRoot.innerHTML = `
      <div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p class="text-xl font-bold text-slate-950">Chưa có sản phẩm phù hợp.</p>
        <p class="mt-3 text-slate-500">Hãy thử đổi bộ lọc loại sản phẩm hoặc khoảng giá.</p>
      </div>
    `;
    return;
  }

  shopRoot.innerHTML = `
    <div class="shop-carousel__viewport">
      <div class="shop-carousel__track" data-shop-track>
        ${products.map(renderProductCard).join("")}
      </div>
    </div>
    <div class="shop-carousel__controls">
      <button type="button" class="shop-carousel__control" data-shop-scroll="prev" aria-label="Sản phẩm trước">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"></path></svg>
      </button>
      <button type="button" class="shop-carousel__control" data-shop-scroll="next" aria-label="Sản phẩm tiếp theo">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"></path></svg>
      </button>
    </div>
  `;
}

function renderProductCard(product) {
  return `
    <article class="shop-card">
      <div class="shop-card__media">
        <img src="${product.image}" alt="${escapeShopHtml(product.name)}" loading="lazy">
        <span class="shop-card__badge">${escapeShopHtml(product.badge)}</span>
      </div>
      <div class="shop-card__body">
        <p class="shop-card__need">${escapeShopHtml(product.need)}</p>
        <h3 class="shop-card__title">${escapeShopHtml(product.name)}</h3>
        <p class="shop-card__description">${escapeShopHtml(product.description)}</p>
        <div class="shop-card__price-row">
          <span class="shop-card__price">${formatShopPrice(product.price)}</span>
        </div>
        <div class="shop-card__actions">
          <button type="button" class="shop-card__primary" data-shop-buy="${product.id}">Mua ngay</button>
          <button type="button" class="shop-card__secondary" data-shop-cart="${product.id}">Thêm vào giỏ hàng</button>
          <button type="button" class="shop-card__secondary" data-shop-detail="${product.id}">Xem chi tiết đơn hàng</button>
        </div>
      </div>
    </article>
  `;
}

function findProduct(productId) {
  return shopProducts.find((product) => product.id === productId);
}

function addToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;

  cartCount += 1;
  shopCartCount.textContent = String(cartCount);
  renderProductDetail(product, "Đã thêm vào giỏ hàng demo.");
}

function renderProductDetail(product, message = "Thông tin chi tiết sản phẩm") {
  shopDetailPanel.innerHTML = `
    <article class="shop-detail-card">
      <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.35em] text-sky-600">${escapeShopHtml(message)}</p>
          <h3 class="mt-3 text-3xl font-extrabold text-slate-950">${escapeShopHtml(product.name)}</h3>
          <p class="mt-3 max-w-3xl text-base leading-7 text-slate-600">${escapeShopHtml(product.description)}</p>
        </div>
        <div class="shrink-0 rounded-3xl bg-white px-6 py-4 text-right shadow-sm">
          <span class="text-sm font-bold uppercase tracking-[0.25em] text-slate-400">Giá bán</span>
          <p class="mt-1 text-3xl font-extrabold text-sky-700">${formatShopPrice(product.price)}</p>
        </div>
      </div>
    </article>
  `;
  shopDetailPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function bindShopEvents() {
  shopCategoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      shopCategoryButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      renderShop();
    });
  });

  shopPriceFilter?.addEventListener("change", renderShop);

  shopRoot?.addEventListener("click", (event) => {
    const control = event.target.closest("[data-shop-scroll]");
    const addCartButton = event.target.closest("[data-shop-cart]");
    const buyButton = event.target.closest("[data-shop-buy]");
    const detailButton = event.target.closest("[data-shop-detail]");
    const track = shopRoot.querySelector("[data-shop-track]");

    if (control && track) {
      const direction = control.dataset.shopScroll === "next" ? 1 : -1;
      track.scrollBy({ left: direction * Math.max(320, track.clientWidth * 0.78), behavior: "smooth" });
      return;
    }

    if (addCartButton) {
      addToCart(addCartButton.dataset.shopCart);
      return;
    }

    if (buyButton) {
      addToCart(buyButton.dataset.shopBuy);
      return;
    }

    if (detailButton) {
      const product = findProduct(detailButton.dataset.shopDetail);
      if (product) renderProductDetail(product);
    }
  });
}

if (shopRoot) {
  renderShop();
  bindShopEvents();
  loadProductsFromBackend();
}
