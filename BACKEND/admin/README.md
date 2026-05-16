# Backend Admin MyPuppy

Folder này chỉ dành cho phần backend của quản trị viên. Không chỉnh phần `BACKEND/customer` để tránh đụng công việc của thành viên khác.

## Chức Năng (theo yêu cầu Admin)

### 1. Quản lý tài khoản
- Xem danh sách user, tìm theo Tên / SĐT / Email.
- Thay đổi vai trò (admin/staff/customer).
- Khóa / mở khóa tài khoản; khi khóa, gọi Clerk để revoke session.
- **Không** tạo mới và **không** xóa user (Clerk lo auth).

### 2. Quản lý nhân viên
- Hiện tự động sau khi promote user lên Staff (tự tạo `HoSoNhanVien`).
- Cập nhật `ChuyenMon`, `NamKinhNghiem`.
- Bật/tắt `SanSangLamViec` để ẩn nhân viên khỏi UI khách hàng.

### 3. Báo cáo thống kê
- Doanh thu theo ngày/tháng (TongTien của HoaDon Paid).
- Cơ cấu doanh thu Dịch vụ vs Sản phẩm.
- Số lịch hẹn Completed/Pending/Cancelled.
- Top 5 nhân viên theo doanh thu, top 5 dịch vụ theo lượt đặt, top 5 sản phẩm bán chạy.

## API

```text
GET    /api/admin/health
GET    /api/admin/dashboard
GET    /api/admin/users?search=&role=&status=
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id/role         body: { role: 'admin'|'staff'|'customer' }
POST   /api/admin/users/:id/lock
POST   /api/admin/users/:id/unlock
GET    /api/admin/staff?search=&status=
GET    /api/admin/staff/:id
PATCH  /api/admin/staff/:id              body: { expertise, yearsOfExperience, status }
POST   /api/admin/staff/:id/availability body: { status: 'active'|'on_leave'|'inactive' }
GET    /api/admin/reports/summary
```

## Cách Chạy

```bash
cd BACKEND
node admin/server.js
```

Mặc định chạy ở `http://localhost:4000`. Đổi port qua biến `ADMIN_PORT`.

VS Code đã cấu hình task `Start Admin Backend` tự khởi động khi mở folder.

## Clerk Backend

Để khóa user revoke được session Clerk, đặt biến môi trường trong `BACKEND/.env`:

```env
CLERK_SECRET_KEY=sk_test_...
```

Lấy key tại Clerk Dashboard → API Keys → Secret keys. Nếu để trống, khóa user chỉ update DB, không revoke session.
