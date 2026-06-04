using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UuDaiController : ControllerBase
{
    private readonly FeatureRepository _featureRepository;

    public UuDaiController(FeatureRepository featureRepository)
    {
        _featureRepository = featureRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPromotions()
    {
        var promotions = await _featureRepository.GetPromotionsAsync(activeOnly: !User.IsInRole("Admin"));
        return Ok(ApiResponseDto<IEnumerable<ChuongTrinhUuDaiDto>>.Ok(promotions));
    }

    [HttpGet("my-vouchers")]
    public async Task<IActionResult> GetMyVouchers()
    {
        var vouchers = await _featureRepository.GetVouchersAsync(GetCurrentUserId());
        return Ok(ApiResponseDto<IEnumerable<PhieuUuDaiDto>>.Ok(vouchers));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableVouchers([FromQuery] int maLichHen)
    {
        var vouchers = await _featureRepository.GetAvailableVouchersForBookingAsync(
            maLichHen,
            GetCurrentUserId(),
            User.IsInRole("Admin"));
        return Ok(ApiResponseDto<IEnumerable<PhieuUuDaiDto>>.Ok(vouchers));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> CreatePromotion([FromBody] UpsertUuDaiDto request)
    {
        var validationMessage = ValidatePromotion(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var id = await _featureRepository.CreatePromotionAsync(request);
        return Created($"/api/uudai/{id}", ApiResponseDto<object>.Ok(new { maUuDai = id }, "Thêm ưu đãi thành công."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{maUuDai:int}")]
    public async Task<IActionResult> UpdatePromotion(int maUuDai, [FromBody] UpsertUuDaiDto request)
    {
        var validationMessage = ValidatePromotion(request);
        if (validationMessage is not null)
        {
            return BadRequest(ApiResponseDto<object>.Fail(validationMessage));
        }

        var updated = await _featureRepository.UpdatePromotionAsync(maUuDai, request);
        return updated
            ? Ok(ApiResponseDto<object>.Ok(null, "Cập nhật ưu đãi thành công."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy ưu đãi."));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("issue")]
    public async Task<IActionResult> IssueVoucher([FromBody] IssueUuDaiDto request)
    {
        var id = await _featureRepository.IssueVoucherAsync(request);
        return id > 0
            ? Ok(ApiResponseDto<object>.Ok(new { maPhieu = id }, "Cấp phiếu ưu đãi thành công."))
            : BadRequest(ApiResponseDto<object>.Fail("Không cấp được phiếu ưu đãi."));
    }

    private static string? ValidatePromotion(UpsertUuDaiDto request)
    {
        if (string.IsNullOrWhiteSpace(request.TenUuDai))
        {
            return "Tên ưu đãi là bắt buộc.";
        }

        if (request.SoLuotYeuCau < 0 || request.ThoiHanThang <= 0)
        {
            return "Số lượt yêu cầu và thời hạn ưu đãi không hợp lệ.";
        }

        var discountTypes = new[] { "Full", "Percent", "Fixed" };
        if (!discountTypes.Contains(request.LoaiGiamGia, StringComparer.OrdinalIgnoreCase))
        {
            return "Loai giam gia khong hop le.";
        }

        request.LoaiGiamGia = discountTypes.First(type => type.Equals(request.LoaiGiamGia, StringComparison.OrdinalIgnoreCase));
        if (request.LoaiGiamGia == "Percent" && request.GiaTriGiam is <= 0 or > 100)
        {
            return "Gia tri phan tram phai nam trong khoang 1-100.";
        }

        if (request.LoaiGiamGia == "Fixed" && request.GiaTriGiam <= 0)
        {
            return "So tien giam phai lon hon 0.";
        }

        if (request.LoaiGiamGia == "Full")
        {
            request.GiaTriGiam = 0;
        }

        return null;
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }
}
