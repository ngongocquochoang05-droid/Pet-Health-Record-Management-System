# Backend Admin MyPuppy

Folder này chỉ dành cho phần backend của quản trị viên. Không chỉnh phần `BACKEND/customer` và `BACKEND/staff` để tránh đụng công việc của các thành viên khác.

## Chức Năng Đã Dựng

- Quản lý hệ thống: kiểm tra trạng thái server và dữ liệu dashboard.
- Quản lý tài khoản người dùng: xem, thêm, sửa, xóa tài khoản mẫu.
- Quản lý nhân viên: xem, thêm, sửa, xóa nhân viên mẫu.
- Báo cáo thống kê: tổng hợp số lượng tài khoản, nhân viên và chỉ số vận hành.

## Cấu Trúc

```text
BACKEND/admin/
├── server.js
├── package.json
├── routes/
│   └── adminRoutes.js
├── controllers/
│   ├── systemController.js
│   ├── userController.js
│   ├── staffController.js
│   └── reportController.js
├── services/
│   ├── systemService.js
│   ├── userService.js
│   ├── staffService.js
│   ├── reportService.js
│   └── errors.js
└── models/
    └── adminRepository.js
```

## Cách Chạy

```bash
cd BACKEND/admin
npm run dev
```

Server mặc định chạy tại:

```text
http://localhost:4000
```

Có thể đổi port bằng biến môi trường:

```bash
set ADMIN_PORT=4100
npm run dev
```

## API Chính

```text
GET    /api/admin/health
GET    /api/admin/dashboard
GET    /api/admin/users
GET    /api/admin/users/:id
POST   /api/admin/users
PATCH  /api/admin/users/:id
DELETE /api/admin/users/:id
GET    /api/admin/staff
GET    /api/admin/staff/:id
POST   /api/admin/staff
PATCH  /api/admin/staff/:id
DELETE /api/admin/staff/:id
GET    /api/admin/reports/summary
```

## Ví Dụ Body Tạo Tài Khoản

```json
{
  "fullName": "Nguyen Van A",
  "email": "vana@example.com",
  "role": "customer",
  "status": "pending"
}
```

## Ví Dụ Body Tạo Nhân Viên

```json
{
  "fullName": "Pham Thi Mai",
  "email": "mai.staff@mypuppy.vn",
  "phone": "0901234567",
  "position": "Grooming Specialist",
  "shift": "Morning",
  "status": "active"
}
```
