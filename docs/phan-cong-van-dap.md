# Phân công học code và vấn đáp PetHealth

Tài liệu này dùng để cả nhóm học code trước khi vấn đáp. Mục tiêu không phải học thuộc từng dòng, mà phải hiểu:

- Chức năng nằm ở file nào.
- Khi bấm một nút trên giao diện thì frontend gọi hàm nào.
- Hàm frontend gọi API nào.
- Backend controller nào nhận API đó.
- Service/Repository nào xử lý nghiệp vụ và truy vấn database.
- Dữ liệu trả về frontend như thế nào.

Khi demo, nên làm chậm, nói rõ từng bước và giải thích code thật. Không nên chỉ bấm nhanh rồi bỏ qua.

## 0. Cách nói tổng quan khi bắt đầu vấn đáp

Đề tài là hệ thống quản lý và đặt lịch dịch vụ chăm sóc thú cưng. Hệ thống chia thành 3 nhóm người dùng:

1. Khách hàng:
   - Đăng ký/đăng nhập.
   - Quản lý hồ sơ cá nhân.
   - Quản lý thú cưng.
   - Xem dịch vụ.
   - Đặt lịch.
   - Xem lịch hẹn.
   - Đặt cọc và upload biên lai.
   - Xem ưu đãi, hóa đơn, hồ sơ bệnh án, ảnh trước/sau dịch vụ.
   - Nhận thông báo.

2. Nhân viên:
   - Xem lịch được phân công.
   - Cập nhật trạng thái công việc.
   - Quét QR để tra cứu hồ sơ thú cưng.
   - Upload ảnh trước/sau dịch vụ.
   - Tạo/cập nhật hồ sơ bệnh án.
   - Xem thông báo.

3. Admin:
   - Quản lý tài khoản và phân quyền.
   - Quản lý dịch vụ.
   - Quản lý lịch hẹn.
   - Quản lý nhân viên.
   - Phân ca.
   - Quản lý đặt cọc.
   - Cấp QR cho thú cưng.
   - Tạo nhắc lịch tái khám.
   - Quản lý hóa đơn, ưu đãi.
   - Xem báo cáo và xuất CSV.
   - Xem thông báo.

Kiến trúc:

- Frontend: React + TypeScript, đóng vai trò tầng View.
- Backend: ASP.NET Core Web API, tổ chức theo phân tầng gần MVC.
- Database: SQL Server, database `PetHealth`.
- Frontend gọi backend qua RESTful API bằng Axios.

## 1. Cách trả lời nếu thầy hỏi Frontend có MVC không

Không nên nói frontend là MVC thuần.

Cách trả lời đúng:

> Frontend của em dùng React nên chủ yếu là tầng View. Em tổ chức các màn hình trong `views/pages`, component dùng lại trong `views/components`, các hàm gọi API trong `views/api`, và kiểu dữ liệu TypeScript trong `views/types`. MVC/phân tầng chính được áp dụng ở backend ASP.NET Core Web API.

Backend mới là phần có phân tầng rõ:

- `Controllers`: nhận request và trả response.
- `DTOs`: dữ liệu vào/ra.
- `Models`: ánh xạ database.
- `Services`: xử lý nghiệp vụ.
- `Repositories`: truy vấn SQL Server.
- `Data`: DbContext.

## 2. Cách demo chung để không bị hỏi dồn

Khi demo một chức năng, nói theo mẫu này:

1. Đây là giao diện của chức năng.
2. Người dùng nhập/chọn dữ liệu.
3. Khi bấm nút, frontend gọi hàm trong file nào.
4. Hàm đó gọi API nào.
5. Backend controller nào nhận API.
6. Service nào xử lý nghiệp vụ.
7. Repository nào truy vấn database.
8. Backend trả JSON.
9. Frontend cập nhật lại giao diện.

Ví dụ mẫu:

> Khi khách hàng bấm đặt lịch, file `BookingPage.tsx` gọi hàm `createBooking` trong `bookingApi.ts`. Hàm này gửi request `POST /api/lichhen` xuống backend. Backend nhận ở `LichHenController`, sau đó gọi `BookingService` để kiểm tra dữ liệu và gọi `LichHenRepository` để lưu lịch hẹn vào SQL Server. Sau khi tạo thành công, API trả JSON về frontend và giao diện cập nhật danh sách lịch hẹn.

## 3. Nhân - FrontEnd khách hàng

Nhân phụ trách phần giao diện khách hàng. Cần hiểu luồng từ màn hình đến API, không cần giải thích sâu SQL.

### File phải học

#### `PetHealth_FE/src/App.tsx`

Vai trò:

- Khai báo route toàn bộ frontend.
- Kiểm tra session/token.
- Điều hướng theo vai trò.
- Gọi dữ liệu ban đầu: user, dịch vụ, thú cưng, lịch hẹn.

Các route khách hàng cần nhớ:

- `/customer`
- `/customer/booking`
- `/customer/appointments`
- `/customer/profile`
- `/customer/billing`
- `/customer/rewards`
- `/customer/medical-records`
- `/customer/notifications`

Thầy có thể hỏi:

- Route khách hàng được khai báo ở đâu?
- Làm sao biết người dùng là khách hàng?
- Khi reload trang thì session lấy lại thế nào?

Trả lời:

- Route nằm trong `App.tsx`.
- Vai trò nằm trong `session.user.vaiTro`.
- Session được lấy từ localStorage qua `getStoredSession`, sau đó gọi API `getCurrentUser` để xác thực lại.

#### `PetHealth_FE/src/views/components/Header.tsx`

Vai trò:

- Hiển thị thanh điều hướng.
- Menu thay đổi theo vai trò.
- Khách hàng có menu đặt lịch, lịch hẹn, hồ sơ, ưu đãi, thông báo.

Thầy có thể hỏi:

- Vì sao admin, nhân viên, khách hàng thấy menu khác nhau?

Trả lời:

- Component kiểm tra `session.user.vaiTro`, sau đó render danh sách navigation tương ứng.

#### `PetHealth_FE/src/views/pages/AuthPage.tsx`

Vai trò:

- Form đăng nhập.
- Form đăng ký.
- Nút tiếp tục với Google.

Luồng đăng nhập frontend:

1. Người dùng nhập email/password.
2. Submit form.
3. Gọi `login` trong `views/api/authApi.ts`.
4. Nếu thành công, lưu session bằng `saveSession`.
5. Điều hướng về trang phù hợp theo vai trò.

Thầy có thể hỏi:

- Token lưu ở đâu?
- Sau khi đăng nhập thành công thì làm gì?

Trả lời:

- Token được lưu trong localStorage qua `authStorage.ts`.
- Sau khi đăng nhập, frontend cập nhật session và điều hướng theo vai trò.

#### `PetHealth_FE/src/views/pages/BookingPage.tsx`

Vai trò:

- Khách hàng đặt lịch.
- Chọn thú cưng.
- Chọn một hoặc nhiều dịch vụ.
- Chọn ngày/giờ.
- Nhập ghi chú.

Luồng đặt lịch frontend:

1. Component nhận `pets`, `services`, `session`.
2. Người dùng chọn dữ liệu.
3. Submit form.
4. Gọi `createBooking` trong `views/api/bookingApi.ts`.
5. Nếu thành công, hiện thông báo và cập nhật dữ liệu.

API liên quan:

- `POST /api/lichhen`
- `GET /api/lichhen/availability`

Thầy có thể hỏi:

- Dữ liệu đặt lịch gửi xuống gồm gì?
- Vì sao có thể chọn nhiều dịch vụ?
- Nếu chưa đăng nhập thì sao?

Trả lời:

- Dữ liệu gồm mã thú cưng, danh sách mã dịch vụ, ngày hẹn, giờ bắt đầu, ghi chú.
- Danh sách dịch vụ được lưu dạng mảng `maDichVu`.
- Nếu chưa đăng nhập thì chuyển về trang đăng nhập hoặc yêu cầu đăng nhập.

#### `PetHealth_FE/src/views/pages/AppointmentsPage.tsx`

Vai trò:

- Hiển thị lịch hẹn của khách hàng.
- Cho phép cập nhật/hủy lịch theo điều kiện.

Luồng:

1. Nhận danh sách lịch từ `App.tsx`.
2. Hiển thị trạng thái lịch.
3. Khi bấm cập nhật/hủy, gọi API trong `bookingApi.ts`.

API liên quan:

- `GET /api/lichhen`
- `PUT /api/lichhen/{id}`
- `PUT /api/lichhen/{id}/status`

Thầy có thể hỏi:

- Trạng thái lịch hẹn lấy ở đâu?
- Hủy lịch gọi API nào?

#### `PetHealth_FE/src/views/pages/ProfilePage.tsx`

Vai trò:

- Cập nhật hồ sơ cá nhân.
- Thêm/sửa/xóa thú cưng.

Luồng CRUD thú cưng:

1. Form nhập thông tin thú cưng.
2. Bấm thêm/sửa/xóa.
3. Gọi `createPet`, `updatePet`, `deletePet` trong `petApi.ts`.
4. Backend cập nhật database.
5. Frontend refresh lại danh sách.

API liên quan:

- `GET /api/thucung`
- `POST /api/thucung`
- `PUT /api/thucung/{id}`
- `DELETE /api/thucung/{id}`

Thầy có thể hỏi:

- CRUD thú cưng nằm ở đâu?
- Vì sao khách hàng chỉ thấy thú cưng của mình?

Trả lời:

- Frontend gọi API thú cưng; backend dựa vào JWT để biết user hiện tại và lọc theo `MaNguoiDung`.

#### `PetHealth_FE/src/views/pages/CustomerRewardsPage.tsx`

Vai trò:

- Tạo yêu cầu đặt cọc chuyển khoản.
- Upload ảnh biên lai.
- Nhận phiếu ưu đãi thân thiết.

Luồng upload biên lai:

1. Khách hàng chọn lịch hẹn.
2. Tạo yêu cầu đặt cọc.
3. Chọn ảnh biên lai.
4. Gửi `multipart/form-data`.
5. Backend lưu ảnh và cập nhật trạng thái đặt cọc.

API liên quan:

- `POST /api/advanced/deposits/bank-transfer`
- `POST /api/advanced/deposits/{id}/receipt`
- `GET /api/advanced/deposits`

#### `PetHealth_FE/src/views/pages/MedicalRecordsPage.tsx`

Vai trò với khách hàng:

- Xem hồ sơ bệnh án.
- Xem ảnh trước/sau dịch vụ.

Khách hàng chỉ xem, không tạo bệnh án.

Thầy có thể hỏi:

- Vì sao khách hàng không sửa được bệnh án?

Trả lời:

- Vì quyền cập nhật bệnh án thuộc nhân viên. Frontend kiểm tra role và chỉ render form cập nhật khi vai trò là Staff.

### Nhân nên demo chức năng nào?

Nên demo: đặt lịch hoặc CRUD thú cưng.

Demo đặt lịch dễ nói nhất:

1. Đăng nhập khách hàng.
2. Vào đặt lịch.
3. Chọn thú cưng.
4. Chọn dịch vụ.
5. Chọn ngày giờ.
6. Bấm đặt lịch.
7. Qua lịch hẹn để thấy lịch vừa tạo.
8. Mở code `BookingPage.tsx` và `bookingApi.ts` giải thích.

## 4. Khánh - BackEnd khách hàng

Khánh phụ trách backend liên quan đến khách hàng. Cần hiểu Controller, Service, Repository và database.

### File phải học

#### `PetHealth_BE/src/Program.cs`

Vai trò:

- Đăng ký service cho DI container.
- Cấu hình SQL Server.
- Cấu hình CORS.
- Cấu hình JWT.
- Cấu hình Google OAuth.
- Cấu hình Swagger.
- Cấu hình SignalR.
- Cấu hình static file để đọc ảnh upload.

Thầy có thể hỏi:

- CORS để làm gì?
- JWT cấu hình ở đâu?
- Swagger bật ở đâu?

Trả lời:

- CORS cho phép frontend `localhost:5173` gọi backend `localhost:5050`.
- JWT được cấu hình trong `AddAuthentication().AddJwtBearer(...)`.
- Swagger được bật bằng `AddSwaggerGen`, `UseSwagger`, `UseSwaggerUI`.

#### `PetHealth_BE/src/Controllers/AuthController.cs`

Chức năng:

- Đăng ký.
- Đăng nhập.
- Refresh token.
- Đăng nhập Google.
- Quên mật khẩu.
- Xác minh email.

Luồng đăng nhập:

1. Nhận `LoginRequestDto`.
2. Gọi `AuthService.LoginAsync`.
3. Nếu hợp lệ, trả `AuthResponseDto`.
4. Nếu sai, trả thông báo lỗi.

Thầy có thể hỏi:

- Mật khẩu có lưu thẳng trong database không?

Trả lời:

- Không. Mật khẩu được hash bằng `PasswordHasherService`, database lưu `PasswordHash`.

#### `PetHealth_BE/src/Services/AuthService.cs`

Vai trò:

- Xử lý nghiệp vụ tài khoản.
- Kiểm tra email/password.
- Tạo session.
- Liên kết Google account.
- Tạo token xác minh email/quên mật khẩu.

Các điểm cần nhớ:

- `RegisterAsync`: đăng ký tài khoản.
- `LoginAsync`: đăng nhập local.
- `LoginWithGoogleAsync`: đăng nhập Google.
- `CreateSessionAsync`: tạo access token/refresh token.

#### `PetHealth_BE/src/Services/JwtTokenService.cs`

Vai trò:

- Tạo JWT access token.
- Đưa thông tin user/role vào claim.

Thầy có thể hỏi:

- Backend biết user là Admin/Staff/Customer bằng cách nào?

Trả lời:

- Khi tạo JWT, backend đưa vai trò vào claim. Các API dùng `[Authorize(Roles = "...")]` hoặc `User.IsInRole(...)` để kiểm tra quyền.

#### `PetHealth_BE/src/Controllers/ThuCungController.cs`

Chức năng:

- Lấy danh sách thú cưng.
- Thêm thú cưng.
- Sửa thú cưng.
- Xóa thú cưng.

Luồng thêm thú cưng:

1. FE gọi `POST /api/thucung`.
2. Controller lấy user hiện tại từ JWT.
3. Gọi `ThuCungRepository.CreateAsync`.
4. Lưu vào SQL Server.
5. Trả dữ liệu thú cưng mới.

Thầy có thể hỏi:

- Làm sao khách hàng không sửa được thú cưng của người khác?

Trả lời:

- Backend lấy `MaNguoiDung` từ JWT và kiểm tra thú cưng có thuộc user đó không. Nếu không phải chủ sở hữu thì trả lỗi.

#### `PetHealth_BE/src/Controllers/LichHenController.cs`

Chức năng:

- Lấy lịch hẹn.
- Tạo lịch hẹn.
- Cập nhật lịch hẹn.
- Cập nhật trạng thái/hủy lịch.

Luồng tạo lịch:

1. Nhận `CreateLichHenDto`.
2. Gán `MaNguoiDung` theo user hiện tại.
3. Gọi `BookingService.CreateAsync`.
4. `BookingService` kiểm tra nghiệp vụ.
5. `LichHenRepository` lưu database.

#### `PetHealth_BE/src/Services/BookingService.cs`

Vai trò:

- Kiểm tra dữ liệu đặt lịch.
- Kiểm tra thú cưng/dịch vụ có hợp lệ không.
- Kiểm tra trùng lịch.
- Tạo lịch hẹn.

Thầy có thể hỏi:

- Vì sao không để Controller tự lưu lịch?

Trả lời:

- Vì Controller chỉ nên nhận request/trả response. Logic nghiệp vụ đặt lịch để trong Service giúp code dễ bảo trì và dễ kiểm tra.

#### `PetHealth_BE/src/Repositories/LichHenRepository.cs`

Vai trò:

- Truy vấn bảng lịch hẹn bằng SQL/Dapper.
- Tạo lịch.
- Cập nhật lịch.
- Cập nhật trạng thái.
- Lấy lịch theo khách hàng/nhân viên/admin.

Thầy có thể hỏi:

- Repository dùng ORM hay SQL?

Trả lời:

- Dự án có EF Core để cấu hình DbContext, nhưng phần truy vấn nghiệp vụ chính dùng Dapper và SQL thuần trong Repository.

### Khánh nên demo chức năng nào?

Nên demo backend của đặt lịch:

1. Mở `BookingPage.tsx` để chỉ frontend gọi API.
2. Mở `bookingApi.ts`.
3. Mở `LichHenController.cs`.
4. Mở `BookingService.cs`.
5. Mở `LichHenRepository.cs`.
6. Chỉ database có lịch mới.

## 5. Ken - FrontEnd và BackEnd nhân viên

Ken phụ trách luồng nhân viên, trong đó phần quan trọng nhất là lịch phân công, quét QR, upload ảnh và bệnh án.

### FrontEnd phải học

#### `PetHealth_FE/src/views/pages/StaffPage.tsx`

Vai trò:

- Hiển thị lịch phân công của nhân viên.
- Nhân viên cập nhật trạng thái lịch.

Luồng:

1. Component gọi `getStaffAppointments`.
2. Hiển thị danh sách lịch.
3. Khi đổi trạng thái, gọi `updateStaffAppointmentStatus`.

API:

- `GET /api/staff/appointments`
- `PUT /api/staff/appointments/{id}/status`

Thầy có thể hỏi:

- Vì sao nhân viên chỉ thấy lịch của mình?

Trả lời:

- Backend lấy `MaNhanVien` từ JWT và chỉ query lịch có `MaNhanVien` tương ứng.

#### `PetHealth_FE/src/views/pages/StaffWorkPage.tsx`

Vai trò:

- Tra cứu hồ sơ thú cưng bằng QR.
- Quét QR bằng camera.
- Upload ảnh trước/sau dịch vụ.

Luồng quét QR:

1. Bấm quét QR.
2. Frontend dùng thư viện `html5-qrcode`.
3. Camera đọc mã QR.
4. Gọi `getPetHistory`.
5. Hiển thị lịch sử chăm sóc.

Luồng upload ảnh:

1. Chọn lịch hẹn được phân công.
2. Hệ thống tự lấy thú cưng từ lịch hẹn.
3. Chọn loại ảnh Before/After.
4. Chọn file ảnh.
5. Gọi `uploadVisitImage`.
6. Backend lưu file vào `wwwroot/uploads`.

Thầy có thể hỏi:

- Vì sao upload ảnh dùng `multipart/form-data`?

Trả lời:

- Vì gửi file ảnh từ frontend sang backend cần dùng FormData. Axios gửi FormData, backend nhận bằng `IFormFile`.

#### `PetHealth_FE/src/views/pages/MedicalRecordsPage.tsx`

Vai trò với nhân viên:

- Tạo/cập nhật hồ sơ bệnh án.

Luồng:

1. Nhân viên chọn lịch hẹn.
2. Nhập chẩn đoán, điều trị, thuốc, tiêm chủng, ghi chú.
3. Gọi `saveMedicalRecord`.
4. Backend lưu hồ sơ bệnh án.

### BackEnd phải học

#### `PetHealth_BE/src/Controllers/StaffController.cs`

Chức năng:

- Lấy lịch của nhân viên.
- Cập nhật trạng thái lịch được phân công.

Điểm cần nhớ:

- Dùng `[Authorize(Roles = "Staff")]`.
- Lấy user hiện tại từ JWT.

#### `PetHealth_BE/src/Controllers/AdvancedController.cs`

Chức năng liên quan nhân viên:

- Tra cứu lịch sử thú cưng bằng QR.
- Upload ảnh trước/sau dịch vụ.
- Xóa ảnh dịch vụ.

Thầy có thể hỏi:

- Khi upload ảnh backend làm gì?

Trả lời:

- Backend nhận `IFormFile`, kiểm tra lịch hẹn/thú cưng có hợp lệ, lưu file vào `wwwroot/uploads`, sau đó lưu đường dẫn ảnh vào database.

#### `PetHealth_BE/src/Controllers/ClinicalController.cs`

Chức năng:

- Lấy danh sách hồ sơ bệnh án.
- Tạo/cập nhật hồ sơ bệnh án.

#### `PetHealth_BE/src/Repositories/ClinicalRepository.cs`

Vai trò:

- SQL lưu và lấy hồ sơ bệnh án.

#### `PetHealth_BE/src/Repositories/FeatureRepository.cs`

Vai trò:

- SQL cho lịch sử thú cưng.
- SQL cho ảnh trước/sau dịch vụ.
- SQL cho QR.

### Ken nên demo chức năng nào?

Nên demo quét QR hoặc upload ảnh trước/sau dịch vụ:

1. Đăng nhập nhân viên.
2. Vào công việc.
3. Chọn lịch hẹn được phân công.
4. Upload ảnh trước/sau.
5. Mở trang hồ sơ bệnh án của khách hàng để thấy ảnh.
6. Mở code `StaffWorkPage.tsx`, `featureApi.ts`, `AdvancedController.cs`, `FeatureRepository.cs`.

## 6. Hoàng - FrontEnd và BackEnd Admin

Hoàng phụ trách phần lớn nhất: Admin. Cần nắm quản trị tài khoản, dịch vụ, lịch hẹn, nhân viên, phân ca, đặt cọc, QR, ưu đãi, báo cáo.

### FrontEnd phải học

#### `PetHealth_FE/src/views/pages/AdminPage.tsx`

Vai trò:

- Quản lý tài khoản.
- Phân quyền.
- Khóa/mở tài khoản.
- Quản lý dịch vụ.
- Upload ảnh dịch vụ.
- Quản lý lịch hẹn.
- Xuất báo cáo CSV.

Luồng phân quyền:

1. Admin xem danh sách user.
2. Chọn vai trò mới.
3. Gọi `updateUserRole`.
4. Backend cập nhật role.

Luồng quản lý dịch vụ:

1. Admin nhập thông tin dịch vụ.
2. Bấm thêm/sửa/xóa.
3. Gọi API trong `managementApi.ts`.
4. Backend cập nhật bảng dịch vụ.

Thầy có thể hỏi:

- CRUD dịch vụ nằm ở đâu?
- Khi upload ảnh dịch vụ thì xử lý thế nào?
- Vì sao danh sách tài khoản có thanh cuộn?

Trả lời:

- CRUD dịch vụ nằm trong `AdminPage.tsx` gọi `managementApi.ts`, backend xử lý ở `AdminController`.
- Upload ảnh dùng FormData/IFormFile, file lưu trong `wwwroot/uploads/services`.
- Thanh cuộn giúp danh sách dài không làm vỡ bố cục giao diện.

#### `PetHealth_FE/src/views/pages/AdminSystemPage.tsx`

Vai trò:

- Cấp QR thú cưng.
- Quản lý đặt cọc.
- Tạo nhắc lịch tái khám.

Luồng cấp QR:

1. Admin chọn khách hàng.
2. Chọn thú cưng.
3. Bấm cấp QR.
4. Frontend gọi `issuePetQr`.
5. Backend tạo mã QR, lưu database và gửi email.

Luồng đặt cọc:

1. Admin xem danh sách đặt cọc.
2. Xem trạng thái/chứng từ.
3. Bấm xác nhận hoặc từ chối.
4. Backend cập nhật trạng thái.

#### `PetHealth_FE/src/views/pages/OperationsPage.tsx`

Vai trò:

- Quản lý nhân viên.
- Phân ca.
- Quản lý ưu đãi.
- Quản lý hóa đơn.

Luồng phân ca:

1. Admin chọn nhân viên.
2. Chọn ngày/giờ ca làm.
3. Gửi API tạo ca.
4. Nhân viên thấy lịch phân công.

### BackEnd phải học

#### `PetHealth_BE/src/Controllers/AdminController.cs`

Chức năng:

- Lấy danh sách user.
- Phân quyền tài khoản.
- Khóa/mở tài khoản.
- CRUD dịch vụ.
- Upload ảnh dịch vụ.
- Quản lý lịch hẹn.
- Báo cáo/xuất CSV.

Thầy có thể hỏi:

- API Admin bảo vệ bằng gì?

Trả lời:

- Dùng `[Authorize(Roles = "Admin")]`, chỉ token có role Admin mới gọi được.

#### `PetHealth_BE/src/Controllers/AdvancedController.cs`

Chức năng Admin:

- Cấp QR.
- Gửi email QR.
- Quản lý đặt cọc.
- Tạo nhắc lịch tái khám.
- Upload/xóa ảnh dịch vụ.

#### `PetHealth_BE/src/Controllers/CaLamController.cs`

Chức năng:

- Quản lý ca làm/phân ca.

#### `PetHealth_BE/src/Controllers/UuDaiController.cs`

Chức năng:

- Quản lý chương trình ưu đãi.
- Cấp/xem phiếu ưu đãi.

#### `PetHealth_BE/src/Controllers/HoaDonController.cs`

Chức năng:

- Quản lý hóa đơn.

#### `PetHealth_BE/src/Services/BookingNotificationService.cs`

Vai trò:

- Gửi email khi trạng thái lịch hẹn thay đổi.

#### `PetHealth_BE/src/Services/ReminderBackgroundService.cs`

Vai trò:

- Chạy nền để gửi nhắc lịch tái khám tự động.

#### `PetHealth_BE/src/Hubs/PetHealthHub.cs`

Vai trò:

- SignalR hub.
- Gom kết nối theo user/role.

#### `PetHealth_BE/src/Middleware/RealtimeChangeMiddleware.cs`

Vai trò:

- Sau khi các API thay đổi dữ liệu, middleware phát tín hiệu realtime để frontend refresh.

### Hoàng nên demo chức năng nào?

Nên demo quản lý dịch vụ hoặc cấp QR.

Demo quản lý dịch vụ:

1. Đăng nhập admin.
2. Vào quản trị.
3. Thêm dịch vụ mới.
4. Upload ảnh dịch vụ.
5. Qua trang dịch vụ/đặt lịch để thấy dịch vụ mới.
6. Mở code `AdminPage.tsx`, `managementApi.ts`, `AdminController.cs`, `DichVuRepository.cs`.

Demo cấp QR:

1. Admin chọn khách hàng.
2. Chọn thú cưng.
3. Bấm cấp QR.
4. Xem QR hiển thị trên giao diện.
5. Kiểm tra email hoặc database.
6. Mở code `AdminSystemPage.tsx`, `featureApi.ts`, `AdvancedController.cs`, `FeatureRepository.cs`, `EmailService.cs`.

## 7. Các chức năng CRUD cần liệt kê khi thầy hỏi

### CRUD khách hàng

- Tài khoản:
  - Đăng ký.
  - Đăng nhập.
  - Cập nhật hồ sơ.
- Thú cưng:
  - Thêm thú cưng.
  - Xem danh sách thú cưng.
  - Sửa thú cưng.
  - Xóa thú cưng.
- Lịch hẹn:
  - Thêm lịch hẹn.
  - Xem lịch hẹn.
  - Sửa lịch hẹn.
  - Hủy lịch hẹn.
- Đặt cọc:
  - Tạo yêu cầu đặt cọc.
  - Upload biên lai.
  - Xem lịch sử đặt cọc.
- Đánh giá:
  - Thêm đánh giá.
  - Xem đánh giá.

### CRUD nhân viên

- Lịch phân công:
  - Xem lịch được phân công.
  - Cập nhật trạng thái.
- Hồ sơ bệnh án:
  - Tạo/cập nhật bệnh án.
  - Xem bệnh án.
- Ảnh dịch vụ:
  - Upload ảnh trước/sau.
  - Xem ảnh.
  - Xóa ảnh.
- QR:
  - Quét QR.
  - Tra cứu hồ sơ thú cưng.

### CRUD Admin

- Tài khoản:
  - Xem danh sách.
  - Phân quyền.
  - Khóa/mở tài khoản.
- Dịch vụ:
  - Thêm dịch vụ.
  - Xem danh sách dịch vụ.
  - Sửa dịch vụ.
  - Xóa dịch vụ.
  - Upload ảnh dịch vụ.
- Lịch hẹn:
  - Xem tất cả lịch.
  - Cập nhật trạng thái.
  - Phân nhân viên.
- Nhân viên:
  - Thêm/cập nhật hồ sơ nhân viên.
  - Xem danh sách nhân viên.
- Ca làm:
  - Thêm ca.
  - Xem ca.
  - Sửa ca.
  - Xóa ca.
- Ưu đãi:
  - Thêm chương trình ưu đãi.
  - Xem ưu đãi.
  - Sửa ưu đãi.
  - Cấp phiếu ưu đãi.
- Hóa đơn:
  - Tạo/cập nhật hóa đơn.
  - Xem hóa đơn.
- Đặt cọc:
  - Xem danh sách.
  - Xác nhận/từ chối.
- QR:
  - Cấp QR cho thú cưng.
  - Gửi email QR.
- Báo cáo:
  - Xem thống kê.
  - Xuất CSV.

## 8. Các chức năng nâng cao nên nhấn mạnh

1. Đăng nhập Google OAuth.
2. JWT phân quyền theo vai trò.
3. QR thú cưng.
4. Quét QR bằng camera.
5. Gửi email bằng Brevo/SMTP.
6. Nhắc lịch tái khám tự động bằng BackgroundService.
7. Upload ảnh dịch vụ và biên lai.
8. SignalR thông báo/cập nhật realtime.
9. Phân ca nhân viên.
10. Đặt cọc và xác nhận biên lai.
11. Ưu đãi khách hàng thân thiết.
12. Báo cáo và xuất CSV.

## 9. Câu hỏi vấn đáp thường gặp và cách trả lời

### Hỏi: Vì sao dùng DTO?

Trả lời:

> DTO giúp kiểm soát dữ liệu nhận từ frontend và dữ liệu trả về frontend. Nhờ DTO, backend không phải trả trực tiếp model database, tránh lộ dữ liệu không cần thiết và dễ thay đổi giao diện API.

### Hỏi: Vì sao dùng Repository?

Trả lời:

> Repository tách phần truy vấn database ra khỏi Controller và Service. Controller chỉ nhận request, Service xử lý nghiệp vụ, Repository làm việc với SQL Server.

### Hỏi: Vì sao dùng Service?

Trả lời:

> Service chứa nghiệp vụ chính, ví dụ kiểm tra trùng lịch, kiểm tra quyền, tạo token, gửi email. Nếu để hết trong Controller thì Controller sẽ dài và khó bảo trì.

### Hỏi: Vì sao dùng JWT?

Trả lời:

> JWT dùng để xác thực API. Sau khi đăng nhập, backend cấp token cho frontend. Mỗi request sau đó gửi kèm token để backend biết người dùng là ai và có quyền gì.

### Hỏi: Vì sao dùng SignalR?

Trả lời:

> SignalR dùng để cập nhật thông báo hoặc dữ liệu mới nhanh hơn mà không cần người dùng refresh thủ công.

### Hỏi: Vì sao dùng QR?

Trả lời:

> QR giúp nhân viên tra cứu nhanh hồ sơ thú cưng. Thay vì nhập mã hoặc tìm trong database, nhân viên chỉ cần quét mã QR để lấy lịch sử chăm sóc.

### Hỏi: Ảnh upload lưu ở đâu?

Trả lời:

> File ảnh lưu trong thư mục `wwwroot/uploads`, còn đường dẫn ảnh được lưu trong SQL Server. Khi frontend cần hiển thị ảnh, backend trả đường dẫn ảnh về.

### Hỏi: Email gửi bằng gì?

Trả lời:

> Hệ thống dùng `EmailService` để gửi email qua Brevo hoặc SMTP. Email dùng cho xác nhận lịch, gửi QR, nhắc lịch tái khám và thông báo trạng thái.

### Hỏi: Database kết nối ở đâu?

Trả lời:

> Chuỗi kết nối nằm trong `appsettings.json` hoặc `appsettings.Local.json`. Backend đọc cấu hình trong `Program.cs` và dùng SQL Server database `PetHealth`.

### Hỏi: Frontend gọi API ở đâu?

Trả lời:

> Các hàm gọi API nằm trong `PetHealth_FE/src/views/api`. Ví dụ đặt lịch dùng `bookingApi.ts`, quản trị dùng `managementApi.ts`, chức năng nâng cao dùng `featureApi.ts`.

### Hỏi: Backend trả dữ liệu dạng gì?

Trả lời:

> Backend là Web API nên trả JSON. Response thường bọc trong `ApiResponseDto` gồm `success`, `message`, `data`.

## 10. Cách chạy source khi demo

Backend:

```powershell
cd E:\DoAnCNTT02\PetHealth_BE
dotnet run --project .\PetHealth_BE.csproj -- --urls http://localhost:5050
```

Frontend:

```powershell
cd E:\DoAnCNTT02\PetHealth_FE
npm.cmd run dev
```

Swagger:

```text
http://localhost:5050/swagger
```

Frontend:

```text
http://localhost:5173
```

## 11. Lời khuyên khi vấn đáp

- Không nói “em không biết code này”.
- Nếu không nhớ chi tiết, hãy nói theo luồng: UI -> API -> Controller -> Service -> Repository -> SQL Server.
- Khi bị hỏi một file, mở đúng file và chỉ vào hàm chính.
- Demo chậm, giải thích từng thao tác.
- Không cần demo quá nhiều chức năng. Chọn 1 chức năng tiêu biểu rồi nói các chức năng khác làm tương tự.
- Nên chọn chức năng tiêu biểu:
  - Khách hàng: đặt lịch.
  - Nhân viên: quét QR hoặc upload ảnh trước/sau.
  - Admin: quản lý dịch vụ hoặc cấp QR.

