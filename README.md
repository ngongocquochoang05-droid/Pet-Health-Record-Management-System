# MyPuppy

Web app đặt lịch và chăm sóc thú cưng. Frontend tĩnh (HTML/CSS/JS), backend admin viết bằng **ASP.NET Core (.NET 10) + Dapper**, auth qua Clerk.

## Tech Stack

- Frontend: `HTML5`, `CSS3`, `JavaScript`, `Tailwind CSS CDN`, `Google Fonts`
- Backend admin: `ASP.NET Core (.NET 10)` + `Dapper` + `Microsoft.Data.SqlClient`
- Backend staff/customer: skeleton, để team triển khai sau (có thể là Node.js, .NET hoặc khác)
- Auth: `Clerk` (Publishable Key cho frontend, Secret Key cho session revoke)
- Database: `SQL Server` (database `PetHealth`)

## Yêu cầu môi trường

- **.NET 10 SDK** (cho backend admin)
- **Node.js 18+** (chỉ để chạy `npm run setup` sinh `clerk-keys.js` cho frontend)
- **SQL Server** với database `PetHealth`

## Cấu Trúc Thư Mục

```text
.
├── README.md
├── package.json             # npm run setup
├── vercel.json              # Deploy frontend Vercel
├── .env.example             # Template Clerk Publishable Key
├── .vscode/                 # Task tự bật .NET backend khi mở folder
├── scripts/
│   └── generate-clerk-keys.mjs   # Sinh clerk-keys.js + api-config.js cho FE
│
├── BACKEND/
│   ├── admin/               # ASP.NET Core API (đã chạy được)
│   │   ├── MyPuppy.Admin.csproj
│   │   ├── Program.cs
│   │   ├── appsettings.json # Connection string + Clerk Secret Key
│   │   ├── Controllers/
│   │   ├── Services/
│   │   ├── Repositories/
│   │   └── Models/
│   ├── staff/               # Skeleton (Node.js Express - chưa hoạt động đầy đủ)
│   ├── customer/            # Skeleton
│   └── shared/
│       └── database/        # schema.sql + create-dev-login.sql (script DB)
│
└── FE/
    ├── index.html           # Redirect → customer/index.html
    ├── customer/
    ├── admin/
    ├── staff/
    └── shared/
        ├── auth/
        └── config/
```

## Phân Công Nhóm

| Vai trò | Frontend | Backend | Tech Backend |
| --- | --- | --- | --- |
| Admin | `FE/admin/` | `BACKEND/admin/` | **ASP.NET Core** |
| Nhân viên cửa hàng | `FE/staff/` | `BACKEND/staff/` | (team staff tự chọn) |
| Khách hàng | `FE/customer/` | `BACKEND/customer/` | (team customer tự chọn) |

**Quy tắc:**

- Mỗi người chỉ chỉnh trong folder được phân công.
- Folder `BACKEND/shared/` và `FE/shared/` chỉ sửa khi cả nhóm thống nhất.

## Setup Lần Đầu

```bash
# 1. Sinh clerk-keys.js cho frontend
cp .env.example .env
# sửa .env, dán Clerk Publishable Key + Frontend API URL
npm run setup

# 2. Cấu hình SQL Server cho backend admin
# Mở BACKEND/admin/appsettings.json, chỉnh connection string nếu khác:
#   "ConnectionStrings": {
#     "PetHealth": "Server=127.0.0.1,1433;Database=PetHealth;User Id=...;Password=...;TrustServerCertificate=True;"
#   }

# 3. (Tùy chọn) Bật Clerk session revoke khi khóa user
# Trong BACKEND/admin/appsettings.json, đặt Clerk:SecretKey:
#   "Clerk": { "SecretKey": "sk_test_..." }
```

## Cách Chạy

**Backend admin** (port 4000) — VS Code task `Start Admin Backend` tự bật khi mở folder. Hoặc thủ công:

```bash
cd BACKEND/admin
dotnet run
```

Health check: `http://localhost:4000/api/admin/health`

Đổi port: chỉnh `applicationUrl` trong `BACKEND/admin/Properties/launchSettings.json`, hoặc set env `ASPNETCORE_URLS=http://localhost:5000`.

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

**Chức năng:**

1. **Quản lý tài khoản** — xem/tìm theo Tên/SĐT/Email, đổi vai trò, khóa/mở khóa (revoke session Clerk). Không tạo và không xóa user (Clerk lo auth).
2. **Quản lý nhân viên** — tự xuất hiện sau khi promote user lên Staff. Chỉnh `ChuyenMon`, `NamKinhNghiem`, `SanSangLamViec`.
3. **Báo cáo thống kê** — doanh thu Paid theo ngày/tháng, cơ cấu Dịch vụ vs Sản phẩm, lịch hẹn Completed/Pending/Cancelled, top 5 nhân viên/dịch vụ/sản phẩm.

## Clerk Auth

- Cấu hình Clerk dùng chung: `FE/shared/auth/clerk-config.js`.
- Publishable Key đọc từ `.env` (gitignore). Chạy `npm run setup` mỗi khi đổi key.
- **Chỉ dùng Publishable Key ở frontend.** Không đưa Secret Key vào HTML/CSS/JS.
- Trang đăng nhập: `FE/customer/pages/auth/dang-nhap.html`.
- Trang đăng ký: `FE/customer/pages/auth/dang-ky.html`.
- Phải mở qua Live Server hoặc localhost, **không mở bằng `file://`**.
- Gán role trên Clerk Dashboard bằng `publicMetadata`:
  ```json
  { "role": "customer" }
  ```
  Role hợp lệ: `customer`, `staff`, `admin`.

**Backend session revoke:** đặt `Clerk:SecretKey` trong `BACKEND/admin/appsettings.json`. Lấy ở Clerk Dashboard → API Keys → Secret keys. Để trống thì khóa user chỉ update DB, không revoke session ngay.

## SQL Server

- Database: `PetHealth`. Backend admin đọc connection string từ `BACKEND/admin/appsettings.json`.
- Recommend dùng SQL Server Authentication (tạo SQL Login).
- Test kết nối nhanh: chạy backend admin (`cd BACKEND/admin && dotnet run`) rồi gọi `http://localhost:4000/api/admin/health`.
- Script SQL hỗ trợ tạo dev login: `BACKEND/shared/database/create-dev-login.sql`.

## Tài Khoản Demo

- Khách hàng: `minhnguyen@gmail.com` / `customer123`
- Nhân viên: `staff@mypuppy.vn` / `staff123`
- Admin: `admin@mypuppy.vn` / `admin123`

## Deploy Vercel (chỉ frontend)

`vercel.json` cấu hình:
- `outputDirectory: FE`
- `buildCommand: node scripts/generate-clerk-keys.mjs`

**Trước khi deploy**, vào Vercel → Project Settings → Environment Variables, thêm:
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_FRONTEND_API_URL`
- `ADMIN_API_BASE` (tùy chọn — URL backend public, vd ngrok hoặc backend cloud)

**Lưu ý**: backend admin .NET chỉ chạy ở localhost máy bạn. Bạn của bạn truy cập Vercel sẽ login Clerk được, nhưng admin/staff data trống nếu không tunnel backend ra public.
