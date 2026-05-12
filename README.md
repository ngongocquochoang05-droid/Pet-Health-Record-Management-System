# MyPuppy Frontend

Frontend hiện tại của dự án `MyPuppy` đã được chuyển sang `React + Next.js` để bạn tiếp tục customize giao diện trước, sau đó mới nối backend.

## Mục tiêu hiện tại

- Hoàn thiện landing page và các page con bằng cấu trúc frontend hiện đại
- Giữ giao diện premium hiện có, nhưng dễ mở rộng hơn cho backend sau này
- Tách rõ page, component và style để tối ưu SEO, maintainability và tốc độ phát triển

## Tech Stack

- `Next.js 16` với `App Router`
- `React 19`
- `Tailwind CSS 4`
- `CSS thuần` cho phần UI dùng chung
- `Google Fonts`
  - `Inter`
  - `Playfair Display`

## Cấu trúc thư mục

```text
app/
├── page.js
├── dich-vu/page.js
├── dat-lich/page.js
├── danh-gia/page.js
├── globals.css
└── layout.js

components/
├── booking-page-client.jsx
├── home-page-client.jsx
├── icons.jsx
├── reviews-page-client.jsx
├── service-page-client.jsx
├── site-logo.jsx
├── subpage-layout.jsx
└── use-reveal-on-scroll.js

FrontEnd/
├── index.html
├── assets/css/frontend-ui.css
└── pages/

package.json
next.config.mjs
postcss.config.mjs
jsconfig.json
```

## Chức năng frontend hiện có

- Landing page chính tại route `/`
- Page `Dịch vụ` tại `/dich-vu`
- Page `Đặt lịch` tại `/dat-lich`
- Page `Đánh giá` tại `/danh-gia`
- Giao diện `Admin Dashboard` hiển thị sau khi đăng nhập từ landing page
- Animation scroll reveal cho landing page và page con
- Logo `MyPuppy` dùng chung giữa landing page và admin page
- SEO metadata và JSON-LD cơ bản cho trang chủ

## File quan trọng

- [app/page.js](./app/page.js)
  - Route trang chủ

- [components/home-page-client.jsx](./components/home-page-client.jsx)
  - Chứa landing page, modal đăng nhập admin và admin dashboard

- [components/service-page-client.jsx](./components/service-page-client.jsx)
  - Giao diện trang dịch vụ

- [components/booking-page-client.jsx](./components/booking-page-client.jsx)
  - Giao diện trang đặt lịch

- [components/reviews-page-client.jsx](./components/reviews-page-client.jsx)
  - Giao diện trang đánh giá

- [app/globals.css](./app/globals.css)
  - CSS global của Next.js
  - Import thêm style UI dùng chung

- [FrontEnd/assets/css/frontend-ui.css](./FrontEnd/assets/css/frontend-ui.css)
  - File CSS UI dùng chung được tái sử dụng từ bản frontend cũ

## Cách chạy dự án

```bash
npm run dev
```

Sau đó mở:

- `http://localhost:3000`

Build production:

```bash
npm run build
```

## Cách chỉnh giao diện

Nếu muốn chỉnh style dùng chung:

- [app/globals.css](./app/globals.css)
- [FrontEnd/assets/css/frontend-ui.css](./FrontEnd/assets/css/frontend-ui.css)

Nếu muốn chỉnh bố cục hoặc nội dung từng trang:

- [components/home-page-client.jsx](./components/home-page-client.jsx)
- [components/service-page-client.jsx](./components/service-page-client.jsx)
- [components/booking-page-client.jsx](./components/booking-page-client.jsx)
- [components/reviews-page-client.jsx](./components/reviews-page-client.jsx)

## Ghi chú

- Thư mục [FrontEnd](./FrontEnd) hiện được giữ lại như bản frontend tĩnh cũ để tham chiếu.
- Frontend mới đang chạy bằng `Next.js`, nên từ bây giờ bạn nên ưu tiên chỉnh trong `app/` và `components/`.
- Luồng hiện tại vẫn đúng định hướng của bạn:
  - Frontend trước
  - Backend sau
  - Ưu tiên UI/UX trước khi nối dữ liệu động
