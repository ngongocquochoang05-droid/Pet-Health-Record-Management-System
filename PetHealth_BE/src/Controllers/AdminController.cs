using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;
using System.Text;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Repositories;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private const int ReportCsvColumnCount = 9;

    private readonly NguoiDungRepository _userRepository;
    private readonly DichVuRepository _serviceRepository;
    private readonly LichHenRepository _bookingRepository;
    private readonly BookingNotificationService _bookingNotificationService;
    private readonly PasswordHasherService _passwordHasher;
    private readonly AuthService _authService;
    private readonly IWebHostEnvironment _environment;
    private readonly NotificationRepository _notificationRepository;

    public AdminController(
        NguoiDungRepository userRepository,
        DichVuRepository serviceRepository,
        LichHenRepository bookingRepository,
        BookingNotificationService bookingNotificationService,
        PasswordHasherService passwordHasher,
        AuthService authService,
        IWebHostEnvironment environment,
        NotificationRepository notificationRepository)
    {
        _userRepository = userRepository;
        _serviceRepository = serviceRepository;
        _bookingRepository = bookingRepository;
        _bookingNotificationService = bookingNotificationService;
        _passwordHasher = passwordHasher;
        _authService = authService;
        _environment = environment;
        _notificationRepository = notificationRepository;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? vaiTro)
    {
        var users = await _userRepository.GetAllAsync(vaiTro);
        return Ok(ApiResponseDto<IEnumerable<NguoiDungDto>>.Ok(users));
    }

    [HttpGet("staff")]
    public async Task<IActionResult> GetStaff()
    {
        await _userRepository.EnsureMissingStaffProfilesAsync();
        var staff = await _bookingRepository.GetStaffAsync();
        return Ok(ApiResponseDto<IEnumerable<StaffDto>>.Ok(staff));
    }

    [HttpPatch("users/{maNguoiDung}/role")]
    public async Task<IActionResult> UpdateUserRole(string maNguoiDung, [FromBody] UpdateUserRoleDto request)
    {
        var allowedRoles = new[] { "Admin", "Staff", "Customer" };
        if (!allowedRoles.Contains(request.VaiTro, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Vai trò không hợp lệ."));
        }

        request.VaiTro = allowedRoles.First(role => role.Equals(request.VaiTro, StringComparison.OrdinalIgnoreCase));
        var updated = await _userRepository.UpdateRoleAsync(maNguoiDung, request);
        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, "Cập nhật phân quyền thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy người dùng."));
    }

    [HttpGet("services")]
    public async Task<IActionResult> GetServices()
    {
        var services = await _serviceRepository.GetCatalogAsync(includeInactive: true);
        return Ok(ApiResponseDto<IEnumerable<DichVuDto>>.Ok(services));
    }

    [HttpPost("services/image")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadServiceImage([FromForm] IFormFile? file)
    {
        if (file is null || file.Length <= 0)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng chọn ảnh dịch vụ."));
        }

        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Kích thước ảnh không được vượt quá 5 MB."));
        }

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };
        var extension = Path.GetExtension(file.FileName);
        if (!allowedExtensions.Contains(extension))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp."));
        }

        var allowedContentTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };
        if (!allowedContentTypes.Contains(file.ContentType))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Định dạng ảnh không hợp lệ."));
        }

        var uploadsRoot = Path.Combine(_environment.ContentRootPath, "src", "wwwroot", "uploads", "services");
        Directory.CreateDirectory(uploadsRoot);
        var safeFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsRoot, safeFileName);

        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/services/{safeFileName}";
        return Ok(ApiResponseDto<object>.Ok(new { anhDichVuUrl = imageUrl }, "Đã upload ảnh dịch vụ."));
    }

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff([FromBody] StaffUpsertDto request)
    {
        var validationMessage = ValidateStaff(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var temporaryPassword = Guid.NewGuid().ToString("N");
        var id = await _userRepository.CreateStaffAsync(request, _passwordHasher.Hash(temporaryPassword));
        await _authService.SendPasswordResetEmailAsync(request.Email);
        return Created($"/api/admin/staff/{id}", ApiResponseDto<object>.Ok(new { maNhanVien = id }, "Thêm nhân viên thành công."));
    }

    [HttpPut("staff/{maNhanVien}")]
    public async Task<IActionResult> UpdateStaff(string maNhanVien, [FromBody] StaffUpsertDto request)
    {
        var validationMessage = ValidateStaff(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var updated = await _userRepository.UpdateStaffAsync(maNhanVien, request);
        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, "Cập nhật nhân viên thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy nhân viên."));
    }

    [HttpDelete("staff/{maNhanVien}")]
    public async Task<IActionResult> DeleteStaff(string maNhanVien)
    {
        var deleted = await _userRepository.DeactivateStaffAsync(maNhanVien);
        return deleted
            ? Ok(ApiResponseDto<object>.Ok(null, "Đã khóa tài khoản nhân viên."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy nhân viên."));
    }

    [HttpPost("services")]
    public async Task<IActionResult> CreateService([FromBody] ServiceUpsertDto request)
    {
        var validationMessage = ValidateService(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var id = await _serviceRepository.CreateAsync(request);
        return Created($"/api/dichvu/{id}", ApiResponseDto<object>.Ok(new { maDichVu = id }, "Thêm dịch vụ thành công."));
    }

    [HttpPut("services/{maDichVu:int}")]
    public async Task<IActionResult> UpdateService(int maDichVu, [FromBody] ServiceUpsertDto request)
    {
        var validationMessage = ValidateService(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var updated = await _serviceRepository.UpdateAsync(maDichVu, request);
        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, "Cập nhật dịch vụ thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy dịch vụ."));
    }

    [HttpDelete("services/{maDichVu:int}")]
    public async Task<IActionResult> DeleteService(int maDichVu)
    {
        try
        {
            var deleted = await _serviceRepository.DeleteAsync(maDichVu);
            return deleted
                ? Ok(ApiResponseDto<object>.Ok(null, "Xóa dịch vụ thành công."))
                : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy dịch vụ."));
        }
        catch
        {
            return BadRequest(ApiResponseDto<object>.Fail("Dịch vụ đã có lịch hẹn, không nên xóa trực tiếp."));
        }
    }

    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments()
    {
        var bookings = await _bookingRepository.GetAllAsync(null);
        return Ok(ApiResponseDto<IEnumerable<LichHenDto>>.Ok(bookings));
    }

    [HttpPatch("appointments/{maLichHen:int}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(int maLichHen, [FromBody] UpdateLichHenStatusDto request)
    {
        if (!LichHenStatus.IsValid(request.TrangThai))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Trạng thái lịch hẹn không hợp lệ."));
        }

        var updated = await _bookingRepository.UpdateStatusAsync(maLichHen, LichHenStatus.Normalize(request.TrangThai), request.GhiChu);
        if (updated)
        {
            var booking = await _bookingRepository.GetByIdAsync(maLichHen);
            if (booking is not null)
            {
                await _bookingNotificationService.SendStatusChangedAsync(booking);
                await _notificationRepository.NotifyBookingStatusChangedAsync(booking);
            }
        }

        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, "Cập nhật lịch hẹn thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy lịch hẹn."));
    }

    [HttpPatch("appointments/{maLichHen:int}/assign")]
    public async Task<IActionResult> AssignStaff(int maLichHen, [FromBody] AssignStaffDto request)
    {
        if (string.IsNullOrWhiteSpace(request.MaNhanVien))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Vui lòng chọn nhân viên."));
        }

        var updated = await _bookingRepository.AssignStaffAsync(maLichHen, request.MaNhanVien);
        if (!updated)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Không thể phân công nhân viên cho lịch này."));
        }

        var booking = await _bookingRepository.GetByIdAsync(maLichHen);
        if (booking is not null)
        {
            await _notificationRepository.NotifyStaffAssignedAsync(booking);
        }

        return Ok(ApiResponseDto<object>.Ok(null, "Đã phân công nhân viên."));
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
    {
        var report = await _bookingRepository.GetReportSummaryAsync();
        return Ok(ApiResponseDto<ReportSummaryDto>.Ok(report));
    }

    [HttpGet("reports/export.csv")]
    public async Task<IActionResult> ExportReportsCsv()
    {
        var report = await _bookingRepository.GetReportSummaryAsync();
        var builder = new StringBuilder();
        AppendCsvRow(
            builder,
            "Nhóm báo cáo",
            "Thời gian",
            "Mã",
            "Tên",
            "Số lịch",
            "Lịch hoàn thành",
            "Doanh thu (VND)",
            "Tổng khách hàng",
            "Khách mới");

        foreach (var item in report.LichTheoNgay)
        {
            var displayDate = DateTime.TryParseExact(
                item.NgayHen,
                "yyyy-MM-dd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var date)
                ? $"Ngày {date:dd/MM/yyyy}"
                : $"Ngày {item.NgayHen}";
            AppendCsvRow(builder, "Lịch theo ngày", displayDate, string.Empty, string.Empty, item.SoLich);
        }

        foreach (var item in report.LichTheoThang)
        {
            AppendCsvRow(builder, "Lịch theo tháng", $"Tháng {item.Thang:D2}/{item.Nam}", string.Empty, string.Empty, item.SoLich);
        }

        foreach (var item in report.TopDichVu)
        {
            AppendCsvRow(builder, "Dịch vụ phổ biến", string.Empty, item.MaDichVu, item.TenDichVu, item.SoLanDat);
        }

        AppendCsvRow(
            builder,
            "Tổng quan",
            string.Empty,
            string.Empty,
            string.Empty,
            string.Empty,
            string.Empty,
            report.TongDoanhThu,
            report.TongKhachHang,
            report.KhachHangMoiThangNay);

        foreach (var item in report.HieuSuatNhanVien)
        {
            AppendCsvRow(
                builder,
                "Hiệu suất nhân viên",
                string.Empty,
                item.MaNhanVien,
                item.HoVaTen,
                item.SoLichDuocGiao,
                item.SoLichHoanThanh,
                item.DoanhThu);
        }

        var fileName = $"pethealth-report-{DateTime.Now:yyyyMMdd-HHmm}.csv";
        return File(
            Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(builder.ToString())).ToArray(),
            "text/csv; charset=utf-8",
            fileName);
    }

    private static string? ValidateService(ServiceUpsertDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TenDichVu))
        {
            return "Tên dịch vụ là bắt buộc.";
        }

        if (request.GiaTien < 0)
        {
            return "Giá dịch vụ không được âm.";
        }

        if (request.ThoiGianThucHien <= 0)
        {
            return "Thời gian thực hiện phải lớn hơn 0.";
        }

        return null;
    }

    private static void AppendCsvRow(StringBuilder builder, params object?[] values)
    {
        var cells = values
            .Concat(Enumerable.Repeat<object?>(null, Math.Max(0, ReportCsvColumnCount - values.Length)))
            .Take(ReportCsvColumnCount)
            .Select(value => EscapeCsv(value?.ToString() ?? string.Empty));
        builder.AppendLine(string.Join(',', cells));
    }

    private static string EscapeCsv(string value)
    {
        return $"\"{value.Replace("\"", "\"\"")}\"";
    }

    private static string? ValidateStaff(StaffUpsertDto request)
    {
        if (string.IsNullOrWhiteSpace(request.HoVaTen) || string.IsNullOrWhiteSpace(request.Email))
        {
            return "Họ tên và email nhân viên là bắt buộc.";
        }

        if (request.NamKinhNghiem < 0 || request.DiemDanhGia is < 0 or > 5)
        {
            return "Năm kinh nghiệm hoặc điểm đánh giá không hợp lệ.";
        }

        return null;
    }
}


