using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    private readonly NguoiDungRepository _userRepository;
    private readonly DichVuRepository _serviceRepository;
    private readonly LichHenRepository _bookingRepository;
    private readonly BookingNotificationService _bookingNotificationService;
    private readonly PasswordHasherService _passwordHasher;
    private readonly AuthService _authService;

    public AdminController(
        NguoiDungRepository userRepository,
        DichVuRepository serviceRepository,
        LichHenRepository bookingRepository,
        BookingNotificationService bookingNotificationService,
        PasswordHasherService passwordHasher,
        AuthService authService)
    {
        _userRepository = userRepository;
        _serviceRepository = serviceRepository;
        _bookingRepository = bookingRepository;
        _bookingNotificationService = bookingNotificationService;
        _passwordHasher = passwordHasher;
        _authService = authService;
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
        return await _bookingRepository.AssignStaffAsync(maLichHen, request.MaNhanVien)
            ? Ok(ApiResponseDto<object>.Ok(null, "Đã phân công nhân viên."))
            : BadRequest(ApiResponseDto<object>.Fail("Không thể phân công nhân viên cho lịch này."));
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
        builder.AppendLine("Loai,Ngay,Nam,Thang,MaDichVu,TenDichVu,SoLuong");

        foreach (var item in report.LichTheoNgay)
        {
            builder.AppendLine($"Ngay,{EscapeCsv(item.NgayHen)},,,,{EscapeCsv(string.Empty)},{item.SoLich}");
        }

        foreach (var item in report.LichTheoThang)
        {
            builder.AppendLine($"Thang,,{item.Nam},{item.Thang},,,{item.SoLich}");
        }

        foreach (var item in report.TopDichVu)
        {
            builder.AppendLine($"TopDichVu,,,,{item.MaDichVu},{EscapeCsv(item.TenDichVu)},{item.SoLanDat}");
        }
        builder.AppendLine($"TongQuan,,,,,,DoanhThu={report.TongDoanhThu};TongKhach={report.TongKhachHang};KhachMoi={report.KhachHangMoiThangNay}");
        foreach (var item in report.HieuSuatNhanVien)
        {
            builder.AppendLine($"NhanVien,,,,{EscapeCsv(item.MaNhanVien)},{EscapeCsv(item.HoVaTen)},{item.SoLichHoanThanh}");
        }

        return File(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(builder.ToString())).ToArray(), "text/csv", "pethealth-report.csv");
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
