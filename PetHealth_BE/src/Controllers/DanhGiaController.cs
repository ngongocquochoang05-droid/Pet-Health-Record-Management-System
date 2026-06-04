using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DanhGiaController : ControllerBase
{
    private readonly FeatureRepository _featureRepository;

    public DanhGiaController(FeatureRepository featureRepository)
    {
        _featureRepository = featureRepository;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] int? maDichVu)
    {
        var reviews = await _featureRepository.GetReviewsAsync(maDichVu, null);
        return Ok(ApiResponseDto<IEnumerable<DanhGiaDto>>.Ok(reviews));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateDanhGiaDto request)
    {
        if (request.SoSao is < 1 or > 5)
        {
            return BadRequest(ApiResponseDto<object>.Fail("Số sao đánh giá phải từ 1 đến 5."));
        }

        var userId = GetCurrentUserId();
        if (!await _featureRepository.CanReviewAsync(request.MaLichHen, userId))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Chỉ được đánh giá lịch hẹn đã hoàn thành và chưa từng đánh giá."));
        }

        var id = await _featureRepository.CreateReviewAsync(request, userId);
        return Created($"/api/danhgia/{id}", ApiResponseDto<object>.Ok(new { maDanhGia = id }, "Gửi đánh giá thành công."));
    }

    private string GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    }
}
