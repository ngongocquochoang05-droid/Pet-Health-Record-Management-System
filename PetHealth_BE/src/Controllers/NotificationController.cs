using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly NotificationRepository _repository;
    public NotificationController(NotificationRepository repository) => _repository = repository;

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(ApiResponseDto<IEnumerable<NotificationDto>>.Ok(await _repository.GetAsync(UserId())));

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id) =>
        await _repository.MarkReadAsync(id, UserId())
            ? Ok(ApiResponseDto<object>.Ok(null, "Đã đánh dấu thông báo đã đọc."))
            : NotFound(ApiResponseDto<object>.Fail("Không tìm thấy thông báo."));

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _repository.MarkAllReadAsync(UserId());
        return Ok(ApiResponseDto<object>.Ok(null, "Đã đọc tất cả thông báo."));
    }

    private string UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
}
