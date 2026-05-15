# Shared Backend

Folder chứa phần dùng chung giữa `admin`, `staff` và `customer`.

## Phạm Vi

- `config/`: cấu hình hệ thống.
- `database/`: kết nối database và migration nếu có.
- `middlewares/`: xác thực, phân quyền, validate request.
- `utils/`: helper dùng chung.

## Quy Tắc

Chỉ chỉnh `shared/` khi nhóm đã thống nhất, vì thay đổi ở đây có thể ảnh hưởng cả 3 khu vực backend.
