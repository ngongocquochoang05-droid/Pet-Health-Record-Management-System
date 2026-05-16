# MyPuppy Backend

Thư mục `BACKEND` chứa phần xử lý server-side cho MyPuppy. Hiện tại đang dùng Node.js core HTTP + SQL Server (qua `mssql`).

## Cấu Trúc

```text
BACKEND/
├── TEAM_GUIDE.md
├── admin/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── customer/
└── shared/
    ├── config/
    └── database/
```

## Ý Nghĩa Từng Folder

- `admin/`: API admin (đã chạy được) — quản lý hệ thống, người dùng, nhân viên, báo cáo.
- `customer/`: dành cho API khách hàng (đặt lịch, dịch vụ, đánh giá) — chưa triển khai.
- `shared/`: cấu hình env và kết nối SQL Server dùng chung.

## Quy Tắc

- Mỗi thành viên chỉ làm trong folder được phân công.
- Không sửa `shared/` nếu chưa thống nhất với nhóm.
- Không trộn code backend vào `FRONTEND/`.
