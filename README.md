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
├── TEAM_GUIDE.md
├── customer/
│   ├── index.html
│   ├── pages/
│   └── assets/
├── admin/
│   ├── index.html
│   └── assets/
└── staff/
    ├── index.html
    └── assets/
```

## Cách Mở Giao Diện

Mở trực tiếp file theo khu vực:

```text
FRONTEND/customer/index.html
FRONTEND/admin/index.html
FRONTEND/staff/index.html
```

Không cần cài thêm thư viện, không cần chạy server dev và không cần bước build.

Các khu vực làm việc riêng:

- `FRONTEND/customer/`: giao diện khách hàng.
- `FRONTEND/admin/`: giao diện admin, gồm quản lý hệ thống, quản lý nhân viên, báo cáo và thống kê.
- `FRONTEND/staff/`: giao diện nhân viên cửa hàng, gồm quản lý khách hàng, lịch hẹn, hồ sơ thú cưng, đăng ký dịch vụ, kiểm tra thanh toán và quản lý sản phẩm.
- `FRONTEND/TEAM_GUIDE.md`: quy tắc phân công folder cho nhóm.

Tài khoản demo ở giao diện đăng nhập:

- Khách hàng: `minhnguyen@gmail.com` / `customer123`
- Nhân viên: `staff@mypuppy.vn` / `staff123`
- Admin: `admin@mypuppy.vn` / `admin123`

## File Cấu Hình Giữ Lại

Các file `package.json`, `package-lock.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs` và `jsconfig.json` được giữ lại ở root để dự phòng cho giai đoạn sau. Hiện tại giao diện chính vẫn chỉ dùng HTML, CSS và JavaScript trong thư mục `FRONTEND`.

## Cách Chỉnh Giao Diện

- Thành viên customer chỉ chỉnh trong `FRONTEND/customer/`.
- Thành viên admin chỉ chỉnh trong `FRONTEND/admin/`.
- Thành viên staff chỉ chỉnh trong `FRONTEND/staff/`.
- Nếu cần sửa file ngoài folder của mình, hãy thống nhất với nhóm trước.
