# MyPuppy Frontend Team Guide

Dự án frontend được chia thành 3 khu vực độc lập để mỗi thành viên làm trong folder của mình, hạn chế conflict và tránh sửa nhầm giao diện của người khác.

## Phân Công Folder

| Vai trò | Folder được chỉnh | Phạm vi |
| --- | --- | --- |
| Giao diện khách hàng | `FRONTEND/customer/` | Landing page, dịch vụ, đặt lịch, phụ kiện, đánh giá, đăng nhập |
| Giao diện admin | `FRONTEND/admin/` | Quản lý hệ thống, quản lý nhân viên, báo cáo và thống kê |
| Giao diện nhân viên cửa hàng | `FRONTEND/staff/` | Khách hàng, lịch hẹn, hồ sơ thú cưng, đăng ký dịch vụ, thanh toán, sản phẩm |

## Quy Tắc Làm Việc

- Mỗi người chỉ chỉnh file trong folder được phân công.
- Không sửa trực tiếp folder của người khác nếu chưa thống nhất trong nhóm.
- Không đưa logic backend vào frontend ở giai đoạn này.
- Chỉ dùng `HTML`, `CSS`, `JavaScript`.
- Nếu cần style hoặc icon dùng chung, hãy thống nhất trước rồi mới tạo khu vực shared ở bước sau.

## Điểm Vào Giao Diện

- Khách hàng: `FRONTEND/customer/index.html`
- Admin: `FRONTEND/admin/index.html`
- Nhân viên cửa hàng: `FRONTEND/staff/index.html`

## Tài Khoản Demo

- Khách hàng: `minhnguyen@gmail.com` / `customer123`
- Nhân viên: `staff@mypuppy.vn` / `staff123`
- Admin: `admin@mypuppy.vn` / `admin123`
