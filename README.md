# MyPuppy Frontend

`MyPuppy` là giao diện frontend tĩnh cho web app chăm sóc thú cưng, sử dụng HTML, CSS và JavaScript thuần.

## Tech Stack

- `HTML5`
- `CSS3`
- `JavaScript`
- `Tailwind CSS CDN`
- `Google Fonts`

## Cấu Trúc Thư Mục

```text
FRONTEND/
├── index.html
├── pages/
│   ├── dang-nhap.html
│   ├── danh-gia.html
│   ├── dat-lich.html
│   ├── dich-vu.html
│   └── phu-kien.html
└── assets/
    ├── css/
    │   └── frontend-ui.css
    └── js/
        ├── home.js
        ├── login.js
        ├── reveal.js
        └── tailwind-config.js
```

## Cách Mở Dự Án

Mở trực tiếp file:

```text
FRONTEND/index.html
```

Không cần cài thêm thư viện, không cần chạy server dev và không cần bước build.

## File Cấu Hình Giữ Lại

Các file `package.json`, `package-lock.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs` và `jsconfig.json` được giữ lại ở root để dự phòng cho giai đoạn sau. Hiện tại giao diện chính vẫn chỉ dùng HTML, CSS và JavaScript trong thư mục `FRONTEND`.

## Cách Chỉnh Giao Diện

- Chỉnh giao diện dùng chung tại `FRONTEND/assets/css/frontend-ui.css`.
- Chỉnh animation scroll tại `FRONTEND/assets/js/reveal.js`.
- Chỉnh tương tác landing page và admin demo tại `FRONTEND/assets/js/home.js`.
- Chỉnh form đăng nhập tại `FRONTEND/assets/js/login.js`.
- Chỉnh nội dung từng trang trong các file `.html` ở `FRONTEND/` và `FRONTEND/pages/`.
