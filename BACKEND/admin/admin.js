/* ================================================================
   Helpers
================================================================ */

/**
 * Hiển thị một thông báo toast ngắn gọn.
 * @param {string} message Nội dung thông báo.
 * @param {'info'|'success'|'warning'|'error'} type Loại thông báo.
 */
function createToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `admin-toast admin-toast--${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 240);
  }, 2600);
}

/* ================================================================
   Bind UI
================================================================ */

function bindAdminUi() {
  // Thêm confirm dialog cho các form action nguy hiểm
  document.addEventListener("submit", function (event) {
    const form = event.target;

    if (form.classList.contains("user-action-form")) {
      const buttonText = form.querySelector("button")?.textContent || "thực hiện";
      if (!window.confirm(`Bạn chắc chắn muốn ${buttonText.toLowerCase()} tài khoản này?`)) {
        event.preventDefault();
      }
    }

    if (form.classList.contains("role-change-form")) {
        const select = form.querySelector('select[name="role"]');
        if (!window.confirm(`Bạn chắc chắn muốn đổi vai trò thành "${select.options[select.selectedIndex].text}"?`)) {
            event.preventDefault();
        }
    }
  });
}

// Khởi chạy các event listener
bindAdminUi();