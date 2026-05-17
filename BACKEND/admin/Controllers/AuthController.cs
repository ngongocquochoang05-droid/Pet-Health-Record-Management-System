using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Services;

namespace MyPuppy.Admin.Controllers;

/// <summary>
/// Endpoint cho frontend tu dong sync user moi vao DB khi login Clerk thanh cong.
/// Day la fallback khi chua setup webhook (Clerk -> backend public URL).
/// </summary>
[ApiController]
[Route("api/admin/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthSyncService _authSyncService;

    public AuthController(AuthSyncService authSyncService)
    {
        _authSyncService = authSyncService;
    }

    [HttpPost("sync")]
    public async Task<IActionResult> SyncUser([FromBody] SyncUserRequest payload)
    {
        if (payload == null || string.IsNullOrWhiteSpace(payload.ClerkUserId))
            return BadRequest(ApiResponse<object>.Fail("Missing clerkUserId."));

        var user = await _authSyncService.SyncFromFrontendAsync(payload);
        return Ok(ApiResponse<UserDto>.Ok(user));
    }
}

public record SyncUserRequest(
    string ClerkUserId,
    string? FullName,
    string? Email,
    string? Phone,
    string? Role
);
