# MyPuppy Backend

Thư mục `BACKEND` dùng để chuẩn bị phần xử lý bên trong cho MyPuppy. Hiện tại backend chưa khóa vào framework hoặc ngôn ngữ cụ thể, để nhóm có thể thống nhất công nghệ sau mà không làm rối phần frontend đang có.

## Cấu Trúc

```text
BACKEND/
├── TEAM_GUIDE.md
├── admin/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── staff/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
├── customer/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── models/
└── shared/
    ├── config/
    ├── database/
    ├── middlewares/
    └── utils/
```

## Ý Nghĩa Từng Folder

- `admin/`: xử lý quản lý hệ thống, quản lý nhân viên, báo cáo và thống kê.
- `staff/`: xử lý khách hàng tại cửa hàng, lịch hẹn, hồ sơ thú cưng, đăng ký dịch vụ, thanh toán và sản phẩm.
- `customer/`: xử lý tài khoản khách hàng, đặt lịch, dịch vụ, đánh giá và phụ kiện.
- `shared/`: cấu hình, kết nối database, middleware và tiện ích dùng chung.

## Quy Tắc

- Mỗi thành viên chỉ làm trong folder được phân công.
- Không sửa `shared/` nếu chưa thống nhất với nhóm.
- Không trộn code backend vào `FRONTEND/`.
- Khi chọn tech stack backend sau này, giữ nguyên ranh giới `admin`, `staff`, `customer` để dễ bảo trì.
