using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class HoaDonController : ControllerBase
{
    private readonly FeatureRepository _featureRepository;

    public HoaDonController(FeatureRepository featureRepository)
    {
        _featureRepository = featureRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var customerId = User.IsInRole("Admin") || User.IsInRole("Staff") ? null : GetCurrentUserId();
        var staffId = User.IsInRole("Staff") ? GetCurrentUserId() : null;
        var invoices = await _featureRepository.GetInvoicesAsync(customerId, staffId);
        return Ok(ApiResponseDto<IEnumerable<HoaDonDto>>.Ok(invoices));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPost]
    public async Task<IActionResult> Upsert([FromBody] UpsertHoaDonDto request)
    {
        if (request.TongTien < 0)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Tổng tiền hóa đơn không được âm."));
        }

        var paymentMethods = new[] { "Cash", "BankTransfer", "Deposit" };
        var paymentStatuses = new[] { "Unpaid", "Paid" };
        if (!paymentMethods.Contains(request.PhuongThucThanhToan, StringComparer.OrdinalIgnoreCase)
            || !paymentStatuses.Contains(request.TrangThaiThanhToan, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Phương thức hoặc trạng thái thanh toán không hợp lệ."));
        }

        request.PhuongThucThanhToan = paymentMethods.First(item => item.Equals(request.PhuongThucThanhToan, StringComparison.OrdinalIgnoreCase));
        request.TrangThaiThanhToan = paymentStatuses.First(item => item.Equals(request.TrangThaiThanhToan, StringComparison.OrdinalIgnoreCase));

        var id = await _featureRepository.UpsertInvoiceAsync(request, GetCurrentUserId(), User.IsInRole("Admin"));
        if (!id.HasValue)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Lịch hẹn không hợp lệ hoặc không thuộc nhân viên được phân công."));
        }

        return Ok(ApiResponseDto<object>.Ok(new { maHoaDon = id.Value }, "Lưu hóa đơn thành công."));
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }
}
