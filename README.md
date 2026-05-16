# MyPuppy

`MyPuppy` là web app đặt lịch và chăm sóc thú cưng. Frontend tĩnh (HTML/CSS/JS), backend Node.js + SQL Server.

## Tech Stack

- `HTML5`, `CSS3`, `JavaScript` thuần
- `Tailwind CSS CDN`
- `Google Fonts`
- Backend: `Node.js` (HTTP core) + `mssql`
- Auth: `Clerk` (Publishable Key + Secret Key cho session revoke)
- Database: `SQL Server`

## Cấu Trúc Thư Mục

```text
BACKEND/
├── TEAM_GUIDE.md
├── admin/         # Backend admin (đã chạy được)
├── staff/         # Skeleton cho team staff
├── customer/      # Skeleton cho team customer
└── shared/
    ├── clerk/     # Clerk Backend API helper
    ├── config/
    └── database/

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

scripts/
└── generate-clerk-keys.mjs   # Sinh clerk-keys.js từ .env.local
```

## Phân Chia Công Việc

- `FRONTEND/`: giao diện người dùng, chia riêng `customer`, `admin`, `staff`.
- `BACKEND/`: API, chia riêng `customer`, `admin`, `staff`.
- `BACKEND/shared/`: phần dùng chung như config, database, helper Clerk.

## Setup Lần Đầu

```bash
# 1. Cài dependency backend
cd BACKEND
npm install
cd ..

# 2. Tạo file env cho Clerk Publishable Key
cp .env.local.example .env.local
# sửa .env.local, dán Clerk Publishable Key + Frontend API URL

# 3. Sinh file clerk-keys.js cho frontend
npm run setup

# 4. Tạo BACKEND/.env từ template
cp BACKEND/.env.example BACKEND/.env
# sửa BACKEND/.env, dán SQL Server credentials và (optional) CLERK_SECRET_KEY

# 5. Test kết nối SQL Server
cd BACKEND
npm run db:test
```

## Cách Chạy

**Backend** (port 4000) — VS Code task `Start Admin Backend` tự bật khi mở folder. Hoặc chạy thủ công:

```bash
cd BACKEND
node admin/server.js
```

**Frontend** — mở `FRONTEND/customer/index.html`, `FRONTEND/admin/index.html`, hoặc `FRONTEND/staff/index.html` qua Live Server.

## Tài Khoản Demo

- Khách hàng: `minhnguyen@gmail.com` / `customer123`
- Nhân viên: `staff@mypuppy.vn` / `staff123`
- Admin: `admin@mypuppy.vn` / `admin123`

## Cách Chỉnh Giao Diện

- Thành viên customer chỉ chỉnh trong `FRONTEND/customer/`.
- Thành viên admin chỉ chỉnh trong `FRONTEND/admin/`.
- Thành viên staff chỉ chỉnh trong `FRONTEND/staff/`.
- Nếu cần sửa file ngoài folder của mình, hãy thống nhất với nhóm trước.
