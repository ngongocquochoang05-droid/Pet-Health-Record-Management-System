using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Models;
using PetHealth_BE.src.Repositories;
using PetHealth_BE.src.Services;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class LichHenController : ControllerBase
{
    private readonly LichHenRepository _bookingRepository;
    private readonly BookingService _bookingService;
    private readonly BookingNotificationService _bookingNotificationService;
    private readonly NotificationRepository _notificationRepository;

    public LichHenController(
        LichHenRepository bookingRepository,
        BookingService bookingService,
        BookingNotificationService bookingNotificationService,
        NotificationRepository notificationRepository)
    {
        _bookingRepository = bookingRepository;
        _bookingService = bookingService;
        _bookingNotificationService = bookingNotificationService;
        _notificationRepository = notificationRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? maNguoiDung)
    {
        var currentUserId = GetCurrentUserId();
        var ownerId = User.IsInRole("Admin") && !string.IsNullOrWhiteSpace(maNguoiDung)
            ? maNguoiDung
            : currentUserId;
        var bookings = await _bookingRepository.GetAllAsync(ownerId);
        return Ok(ApiResponseDto<IEnumerable<LichHenDto>>.Ok(bookings));
    }

    [HttpGet("availability")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailability([FromQuery] string ngayHen, [FromQuery] string gioHen)
    {
        if (!DateTime.TryParse(ngayHen, out var date) || !TimeSpan.TryParse(gioHen, out var time))
        {
            return BadRequest(ApiResponseDto<BookingAvailabilityDto>.Fail("Ngày hẹn hoặc giờ hẹn không hợp lệ."));
        }

        var availability = await _bookingRepository.GetAvailabilityAsync(date, time);
        return Ok(ApiResponseDto<BookingAvailabilityDto>.Ok(availability));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLichHenDto request)
    {
        try
        {
            request.MaNguoiDung = User.IsInRole("Admin") && !string.IsNullOrWhiteSpace(request.MaNguoiDung)
                ? request.MaNguoiDung
                : GetCurrentUserId();
            var created = await _bookingService.CreateAsync(request);
            return Created($"/api/lichhen/{created.MaLichHen}", ApiResponseDto<LichHenDto>.Ok(created, "Đặt lịch thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponseDto<LichHenDto>.Fail(ex.Message));
        }
    }

    [HttpPut("{maLichHen:int}")]
    public async Task<IActionResult> Update(int maLichHen, [FromBody] UpdateLichHenDto request)
    {
        try
        {
            var updated = await _bookingService.UpdateAsync(maLichHen, GetCurrentUserId(), request);
            return Ok(ApiResponseDto<LichHenDto>.Ok(updated, "Cập nhật lịch hẹn thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponseDto<LichHenDto>.Fail(ex.Message));
        }
    }

    [HttpPatch("{maLichHen}/status")]
    public async Task<IActionResult> UpdateStatus(int maLichHen, [FromBody] UpdateLichHenStatusDto request)
    {
        if (!LichHenStatus.IsValid(request.TrangThai))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Trạng thái lịch hẹn không hợp lệ."));
        }

        var normalizedStatus = LichHenStatus.Normalize(request.TrangThai);
        if (normalizedStatus != LichHenStatus.Cancelled && !User.IsInRole("Admin"))
        {
            return Forbid();
        }

        var existing = await _bookingRepository.GetByIdAsync(maLichHen);
        if (existing is null)
        {
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy lịch hẹn."));
        }

        if (existing.TrangThai is LichHenStatus.Completed or LichHenStatus.NoShow)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Không thể hủy lịch đã kết thúc."));
        }

        if (DateTime.TryParse($"{existing.NgayHen} {existing.GioHen}", out var appointmentTime)
            && appointmentTime <= DateTime.Now.AddHours(2)
            && !User.IsInRole("Admin"))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Chỉ có thể hủy lịch trước giờ hẹn tối thiểu 2 tiếng."));
        }

        var updated = User.IsInRole("Admin")
            ? await _bookingRepository.UpdateStatusAsync(maLichHen, normalizedStatus, request.GhiChu)
            : await _bookingRepository.UpdateStatusForOwnerAsync(maLichHen, GetCurrentUserId(), normalizedStatus, request.GhiChu);
        if (!updated)
        {
            return NotFound(ApiResponseDto<object>.Fail("Không tìm thấy lịch hẹn."));
        }

        if (normalizedStatus == LichHenStatus.Confirmed)
        {
            var confirmedBooking = await _bookingRepository.GetByIdAsync(maLichHen);
            if (confirmedBooking is not null)
            {
                await _bookingNotificationService.SendConfirmedAsync(confirmedBooking);
                await _notificationRepository.NotifyBookingStatusChangedAsync(confirmedBooking);
            }
        }
        else
        {
            var changedBooking = await _bookingRepository.GetByIdAsync(maLichHen);
            if (changedBooking is not null)
            {
                await _bookingNotificationService.SendStatusChangedAsync(changedBooking);
                await _notificationRepository.NotifyBookingStatusChangedAsync(changedBooking);
            }
        }

        return Ok(ApiResponseDto<object>.Ok(null, "Cập nhật trạng thái thành công."));
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }

}
