# Customer UI

Folder danh cho thanh vien phu trach giao dien khach hang cua MyPuppy.

## Duoc Chinh

- `index.html`
- `pages/`
- `assets/css/`
- `assets/js/`

## Khong Chinh

- Khong chinh `../admin/`
- Khong chinh `../staff/`

## Pham Vi

Landing page, dich vu, dat lich, phu kien, danh gia, form dang nhap va form dang ky.

## Clerk Auth

- Cau hinh Clerk dung chung nam tai `../shared/auth/clerk-config.js`.
- Key Clerk doc tu file `.env.local` o root project (file da gitignore, khong commit).
- Lan dau setup: copy `.env.local.example` thanh `.env.local` o root, dien key.
- Sau do chay `npm run setup` de sinh `FRONTEND/shared/auth/clerk-keys.js`.
- Khi deploy Vercel: dat 2 bien moi truong `CLERK_PUBLISHABLE_KEY` va `CLERK_FRONTEND_API_URL` trong project settings. Build command tu dong sinh `clerk-keys.js`.
- Chi dung `Publishable Key` o frontend. Khong dua `Secret Key` vao HTML/CSS/JS.
- Chay web bang localhost hoac Live Server. Khong mo trang auth bang `file://`.
- Trang dang nhap: `pages/dang-nhap.html`.
- Trang dang ky: `pages/dang-ky.html`.
- Gan role tren Clerk Dashboard bang `publicMetadata`.

```json
{
  "role": "customer"
}
```

Role hop le: `customer`, `staff`, `admin`.
