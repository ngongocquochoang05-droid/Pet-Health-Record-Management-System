using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize(Roles = "Staff,Admin")]
[Route("api/[controller]")]
public class CaLamController : ControllerBase
{
    private readonly FeatureRepository _featureRepository;

    public CaLamController(FeatureRepository featureRepository)
    {
        _featureRepository = featureRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? maNhanVien)
    {
        var staffId = User.IsInRole("Admin") ? maNhanVien : GetCurrentUserId();
        await _featureRepository.SynchronizeShiftAssignmentsAsync();
        var shifts = await _featureRepository.GetShiftsAsync(staffId);
        return Ok(ApiResponseDto<IEnumerable<CaLamViecDto>>.Ok(shifts));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertCaLamViecDto request)
    {
        var validationMessage = ValidateShift(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var id = await _featureRepository.CreateShiftAsync(request);
        return Created($"/api/calam/{id}", ApiResponseDto<object>.Ok(new { maCaLam = id }, "Thêm ca làm thành công."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{maCaLam:int}")]
    public async Task<IActionResult> Update(int maCaLam, [FromBody] UpsertCaLamViecDto request)
    {
        var validationMessage = ValidateShift(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var updated = await _featureRepository.UpdateShiftAsync(maCaLam, request);
        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, "Cập nhật ca làm thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy ca làm."));
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{maCaLam:int}")]
    public async Task<IActionResult> Delete(int maCaLam)
    {
        var deleted = await _featureRepository.DeleteShiftAsync(maCaLam);
        return deleted
            ? Ok(ApiResponseDto<object>.Ok(null, "Xóa ca làm thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy ca làm."));
    }

    private static string? ValidateShift(UpsertCaLamViecDto request)
    {
        if (string.IsNullOrWhiteSpace(request.MaNhanVien))
        {
            return "Nhân viên là bắt buộc.";
        }

        if (!DateTime.TryParse(request.NgayLam, out _)
            || !TimeSpan.TryParse(request.GioBatDau, out var start)
            || !TimeSpan.TryParse(request.GioKetThuc, out var end)
            || start >= end)
        {
            return "Ngày làm hoặc giờ làm không hợp lệ.";
        }

        return null;
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }
}
