using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Repositories;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize(Roles = "Staff,Admin")]
[Route("api/[controller]")]
public class StaffController : ControllerBase
{
    private readonly LichHenRepository _bookingRepository;
    private readonly FeatureRepository _featureRepository;
    private readonly BookingNotificationService _bookingNotificationService;

    public StaffController(LichHenRepository bookingRepository, FeatureRepository featureRepository, BookingNotificationService bookingNotificationService)
    {
        _bookingRepository = bookingRepository;
        _featureRepository = featureRepository;
        _bookingNotificationService = bookingNotificationService;
    }

    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments([FromQuery] string? maNhanVien = null)
    {
        var staffId = User.IsInRole("Admin") && !string.IsNullOrWhiteSpace(maNhanVien)
            ? maNhanVien
            : User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        await _featureRepository.SynchronizeShiftAssignmentsAsync();
        var bookings = await _bookingRepository.GetAllAsync(null, staffId);
        return Ok(ApiResponseDto<IEnumerable<LichHenDto>>.Ok(bookings));
    }

    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability([FromQuery] string ngayHen, [FromQuery] string gioHen)
    {
        if (!DateTime.TryParse(ngayHen, out var date) || !TimeSpan.TryParse(gioHen, out var time))
        {
            return BadRequest(ApiResponseDto<BookingAvailabilityDto>.Fail("Ngày hẹn hoặc giờ hẹn không hợp lệ."));
        }

        var availability = await _bookingRepository.GetAvailabilityAsync(date, time);
        return Ok(ApiResponseDto<BookingAvailabilityDto>.Ok(availability));
    }

    [HttpPatch("appointments/{maLichHen:int}/status")]
    public async Task<IActionResult> UpdateAppointmentStatus(int maLichHen, [FromBody] UpdateLichHenStatusDto request)
    {
        if (!LichHenStatus.IsValid(request.TrangThai))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Trạng thái lịch hẹn không hợp lệ."));
        }

        var normalizedStatus = LichHenStatus.Normalize(request.TrangThai);
        if (normalizedStatus is not (LichHenStatus.Completed or LichHenStatus.NoShow))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Nhân viên chỉ được cập nhật lịch thành Completed hoặc NO_SHOW."));
        }

        var updated = User.IsInRole("Admin")
            ? await _bookingRepository.UpdateStatusAsync(maLichHen, normalizedStatus, request.GhiChu)
            : await _bookingRepository.UpdateStatusForStaffAsync(
                maLichHen,
                User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty,
                normalizedStatus,
                request.GhiChu);
        if (!updated) return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy lịch hẹn."));
        var booking = await _bookingRepository.GetByIdAsync(maLichHen);
        if (booking is not null) await _bookingNotificationService.SendStatusChangedAsync(booking);
        return Ok(ApiResponseDto<object>.Ok(null, "Cập nhật lịch hẹn thành công."));
    }
}
