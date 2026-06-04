using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/clinical")]
public class ClinicalController : ControllerBase
{
    private readonly ClinicalRepository _repository;

    public ClinicalController(ClinicalRepository repository)
    {
        _repository = repository;
    }

    [HttpGet("records")]
    public async Task<IActionResult> GetRecords([FromQuery] int? maThuCung)
    {
        var records = await _repository.GetAsync(CurrentUserId(), User.IsInRole("Admin"), User.IsInRole("Staff"), maThuCung);
        return Ok(ApiResponseDto<IEnumerable<MedicalRecordDto>>.Ok(records));
    }

    [Authorize(Roles = "Admin,Staff")]
    [HttpPost("records")]
    public async Task<IActionResult> UpsertRecord([FromBody] UpsertMedicalRecordDto request)
    {
        if (request.MaLichHen <= 0 || request.MaThuCung <= 0 || string.IsNullOrWhiteSpace(request.ChanDoan))
        {
            return BadRequest(ApiResponseDto<object>.Fail("Lịch hẹn, thú cưng và chẩn đoán là bắt buộc."));
        }

        var id = await _repository.UpsertAsync(request, CurrentUserId(), User.IsInRole("Admin"));
        return id.HasValue
            ? Ok(ApiResponseDto<object>.Ok(new { maHoSo = id.Value }, "Đã lưu hồ sơ bệnh án."))
            : BadRequest(ApiResponseDto<object>.Fail("Lịch hẹn không hợp lệ hoặc bạn không được phân công."));
    }

    private string CurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
}
