# MyPuppy

Web app đặt lịch và chăm sóc thú cưng. Frontend tĩnh (HTML/CSS/JS), backend Node.js + SQL Server, auth qua Clerk.

## Tech Stack

- Frontend: `HTML5`, `CSS3`, `JavaScript`, `Tailwind CSS CDN`, `Google Fonts`
- Backend: `Node.js` (HTTP core) + `mssql`
- Auth: `Clerk` (Publishable Key cho frontend, Secret Key cho session revoke)
- Database: `SQL Server` (database `PetHealth`)

## Cấu Trúc Thư Mục

```text
.
├── README.md                # File này
├── package.json             # Script setup frontend
├── vercel.json              # Cấu hình deploy Vercel
├── .env.local.example       # Template env cho Clerk Publishable Key
├── .vscode/                 # Task tự bật backend khi mở folder
├── scripts/
│   └── generate-clerk-keys.mjs   # Sinh clerk-keys.js + api-config.js từ .env.local
│
├── BACKEND/                 # API server
│   ├── package.json
│   ├── .env.example
│   ├── admin/               # API admin (ĐÃ chạy được)
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── models/
│   ├── staff/               # Skeleton dành cho team staff
│   ├── customer/            # Skeleton dành cho team customer
│   └── shared/
│       ├── clerk/           # Helper gọi Clerk Backend API
│       ├── config/          # Đọc .env
│       └── database/        # Kết nối SQL Server
│
└── FE/                      # Giao diện
    ├── index.html           # Redirect → customer/index.html
    ├── customer/            # Landing + dịch vụ + đặt lịch + auth
    │   ├── index.html
    │   ├── pages/
    │   │   └── auth/        # dang-nhap, dang-ky, sso-callback, sso-continue, auth-complete
    │   └── assets/
    │       ├── css/
    │       ├── images/
    │       └── js/
    │           ├── auth/    # login, register, customer-auth
    │           ├── pages/   # home
    │           └── shared/  # reveal, tailwind-config
    ├── admin/               # Dashboard quản trị
    │   ├── index.html
    │   └── assets/{css,js,images}/
    ├── staff/               # Giao diện nhân viên
    │   ├── index.html
    │   ├── pages/
    │   └── assets/{css,js,images}/
    └── shared/              # Dùng chung 3 vai trò
        ├── auth/            # clerk-config.js + clerk-keys.js (gitignore)
        └── config/          # api-config.js (gitignore)
```

## Phân Công Nhóm

| Vai trò | Frontend | Backend | Phạm vi |
| --- | --- | --- | --- |
| Admin | `FE/admin/` | `BACKEND/admin/` | Quản lý hệ thống, tài khoản, nhân viên, báo cáo |
| Nhân viên cửa hàng | `FE/staff/` | `BACKEND/staff/` | Lịch hẹn, khách hàng, thú cưng, dịch vụ, thanh toán, sản phẩm |
| Khách hàng | `FE/customer/` | `BACKEND/customer/` | Landing, đặt lịch, dịch vụ, đánh giá, hồ sơ, auth |

**Quy tắc làm việc:**

- Mỗi người chỉ chỉnh trong folder được phân công.
- Folder `BACKEND/shared/` và `FE/shared/` là vùng dùng chung — chỉ sửa khi cả nhóm thống nhất.
- Không trộn code backend vào frontend.

## Setup Lần Đầu

```bash
# 1. Cài dependency backend
cd BACKEND
npm install
cd ..

# 2. Tạo file env cho Clerk Publishable Key
cp .env.local.example .env.local
# sửa .env.local, dán Clerk Publishable Key + Frontend API URL

# 3. Sinh file clerk-keys.js + api-config.js cho frontend
npm run setup

# 4. Tạo BACKEND/.env từ template
cp BACKEND/.env.example BACKEND/.env
# sửa BACKEND/.env, dán SQL Server credentials và (tùy chọn) CLERK_SECRET_KEY

# 5. Test kết nối SQL Server
cd BACKEND
npm run db:test
```

## Cách Chạy

**Backend** (port 4000) — VS Code task `Start Admin Backend` tự bật khi mở folder. Hoặc thủ công:

```bash
cd BACKEND
node admin/server.js
```

Health check: `http://localhost:4000/api/admin/health`. Đổi port qua biến `ADMIN_PORT`.

**Frontend** — mở Live Server (đã cấu hình root `/FE`):
- Khách hàng: `http://127.0.0.1:5500/customer/index.html`
- Admin: `http://127.0.0.1:5500/admin/index.html`
- Nhân viên: `http://127.0.0.1:5500/staff/index.html`

## Backend Admin — API

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

**Chức năng admin:**

1. **Quản lý tài khoản** — xem/tìm theo Tên-SĐT-Email, đổi vai trò, khóa/mở khóa (revoke session Clerk). Không tạo mới và không xóa.
2. **Quản lý nhân viên** — tự xuất hiện sau khi promote user lên Staff. Chỉnh `ChuyenMon`, `NamKinhNghiem`, `SanSangLamViec`.
3. **Báo cáo thống kê** — doanh thu Paid theo ngày/tháng, cơ cấu Dịch vụ vs Sản phẩm, lịch hẹn Completed/Pending/Cancelled, top 5 nhân viên/dịch vụ/sản phẩm.

## Clerk Auth

- Cấu hình Clerk dùng chung: `FE/shared/auth/clerk-config.js`.
- Publishable Key đọc từ `.env.local` (gitignore). Chạy `npm run setup` mỗi khi đổi key.
- **Chỉ dùng Publishable Key ở frontend.** Không đưa Secret Key vào HTML/CSS/JS.
- Trang đăng nhập: `FE/customer/pages/auth/dang-nhap.html`.
- Trang đăng ký: `FE/customer/pages/auth/dang-ky.html`.
- Phải mở qua Live Server hoặc localhost, **không mở bằng `file://`**.
- Gán role trên Clerk Dashboard bằng `publicMetadata`:
  ```json
  { "role": "customer" }
  ```
  Role hợp lệ: `customer`, `staff`, `admin`.

**Backend session revoke:** đặt `CLERK_SECRET_KEY=sk_test_...` trong `BACKEND/.env`. Lấy ở Clerk Dashboard → API Keys → Secret keys. Nếu để trống, khóa user chỉ update DB, không revoke session ngay.

## SQL Server

- Database: `PetHealth`. Backend đọc cấu hình từ `BACKEND/.env`.
- Recommend dùng SQL Server Authentication (tạo SQL Login). Windows-only Authentication thì phải tạo thêm SQL Login để backend kết nối.
- Test kết nối: `cd BACKEND && npm run db:test`.
- Không commit `BACKEND/.env` (chứa mật khẩu DB).

## Tài Khoản Demo

- Khách hàng: `minhnguyen@gmail.com` / `customer123`
- Nhân viên: `staff@mypuppy.vn` / `staff123`
- Admin: `admin@mypuppy.vn` / `admin123`

## Deploy Vercel

`vercel.json` cấu hình sẵn:
- `outputDirectory: FE` (frontend tĩnh)
- `buildCommand: node scripts/generate-clerk-keys.mjs` (sinh key file lúc build)

**Trước khi deploy**, vào Vercel → Project Settings → Environment Variables, thêm:
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_FRONTEND_API_URL`
- `ADMIN_API_BASE` (tùy chọn — URL backend public, vd ngrok hoặc Render)

**Lưu ý**: backend admin chỉ chạy ở localhost máy bạn. Bạn deploy trên Vercel, người khác đăng nhập được (Clerk public) nhưng admin/staff data sẽ trống nếu không tunnel backend ra ngoài.

## Backend Skeleton (`BACKEND/customer/`, `BACKEND/staff/`)

Hai folder này giữ structure `routes/controllers/services/models` để team triển khai sau:

- `routes/`: định nghĩa endpoint API.
- `controllers/`: nhận request, gọi service, trả response.
- `services/`: logic nghiệp vụ.
- `models/`: thao tác database.
