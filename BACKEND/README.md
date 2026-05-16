# MyPuppy Backend

Thư mục `BACKEND` chứa phần xử lý server-side cho MyPuppy. Hiện tại đang dùng Node.js core HTTP + SQL Server (qua `mssql`).

## Cấu Trúc

```text
BACKEND/
├── TEAM_GUIDE.md
├── admin/                 # API admin (đã chạy được)
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── staff/                 # Skeleton dành cho team staff
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── customer/              # Skeleton dành cho team customer
└── shared/
    ├── clerk/             # Clerk Backend API helper
    ├── config/
    └── database/
```

## Ý Nghĩa Từng Folder

- `admin/`: API admin (đã chạy được) — quản lý hệ thống, người dùng, nhân viên, báo cáo.
- `staff/`: dành cho API nhân viên cửa hàng (lịch hẹn, thú cưng, thanh toán, sản phẩm) — bạn phụ trách.
- `customer/`: dành cho API khách hàng (đặt lịch, dịch vụ, đánh giá) — chưa triển khai.
- `shared/`: cấu hình env, kết nối SQL Server và helper Clerk dùng chung.

## Quy Tắc

- Mỗi thành viên chỉ làm trong folder được phân công.
- Không sửa `shared/` nếu chưa thống nhất với nhóm.
- Không trộn code backend vào `FRONTEND/`.
