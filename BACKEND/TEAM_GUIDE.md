# MyPuppy Backend Team Guide

Backend được chia theo vai trò giống `FRONTEND` để nhóm tránh sửa nhầm phần của nhau.

## Phân Công Folder

| Vai trò | Folder được chỉnh | Phạm vi backend |
| --- | --- | --- |
| Admin | `BACKEND/admin/` | Quản lý hệ thống, quản lý nhân viên, báo cáo và thống kê |
| Nhân viên cửa hàng | `BACKEND/staff/` | Khách hàng, lịch hẹn, hồ sơ thú cưng, đăng ký dịch vụ, thanh toán, sản phẩm |
| Khách hàng | `BACKEND/customer/` | Đăng nhập/đăng ký khách hàng, đặt lịch, dịch vụ, đánh giá, phụ kiện |

## Quy Tắc Làm Việc

- Người phụ trách admin chỉ chỉnh trong `BACKEND/admin/`.
- Người phụ trách nhân viên cửa hàng chỉ chỉnh trong `BACKEND/staff/`.
- Người phụ trách khách hàng chỉ chỉnh trong `BACKEND/customer/`.
- Folder `BACKEND/shared/` là vùng dùng chung, chỉ sửa khi cả nhóm đã thống nhất.
- Không đưa file giao diện vào `BACKEND/`; giao diện vẫn nằm trong `FRONTEND/`.

## Gợi Ý Luồng Xử Lý

- `routes/`: định nghĩa endpoint/API route.
- `controllers/`: nhận request, gọi service và trả response.
- `services/`: chứa logic nghiệp vụ chính.
- `models/`: mô tả dữ liệu hoặc thao tác với database.
