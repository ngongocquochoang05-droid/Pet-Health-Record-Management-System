# MyPuppy Shared Database

Folder này chứa cấu hình kết nối SQL Server dùng chung cho `admin`, `staff` và `customer`.

## Vì Sao Không Dùng Trực Tiếp Extension SQL Server?

Extension SQL Server trong VS Code giúp bạn xem database và chạy query thủ công. Backend không tự đọc connection tên `PetHealth_Local` từ extension đó, nên code vẫn cần file cấu hình riêng trong `BACKEND/.env`.

## Cách Thiết Lập

1. Mở terminal tại thư mục dự án.
2. Chạy `cd BACKEND`.
3. Chạy `npm install`.
4. Copy `.env.example` thành `.env`.
5. Sửa `.env` theo server/database của bạn.
6. Chạy `npm run db:test`.

## Ví Dụ `.env`

```env
SQLSERVER_HOST=localhost
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=PetHealth
SQLSERVER_USER=sa
SQLSERVER_PASSWORD=your_password_here
SQLSERVER_ENCRYPT=false
SQLSERVER_TRUST_SERVER_CERTIFICATE=true
```

Nếu database của bạn đang đặt tên là `PetHeatlh` thì đổi dòng `SQLSERVER_DATABASE=PetHealth` thành `SQLSERVER_DATABASE=PetHeatlh`.

## Cách Dùng Trong Code

```js
const { query } = require("../../shared/database");

async function getUsers() {
  const result = await query("SELECT * FROM dbo.Users WHERE Role = @role", {
    role: "customer",
  });

  return result.recordset;
}
```

## Lưu Ý

- Không commit `BACKEND/.env` vì file đó chứa mật khẩu database.
- Nên dùng SQL Server Authentication cho backend để kết nối đơn giản và ổn định.
- Nếu bạn chỉ có Windows Authentication, hãy tạo thêm một SQL Login riêng trong SQL Server Management Studio.
