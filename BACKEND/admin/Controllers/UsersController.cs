using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Services;

namespace MyPuppy.Admin.Controllers;

[ApiController]
[Route("api/admin/users")]
public class UsersController : ControllerBase
{
    private readonly UserService _userService;

    public UsersController(UserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] string? search)
    {
        var data = await _userService.ListUsersAsync(role, status, search);
        return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(data));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    [HttpPatch("{id}/role")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleRequest payload)
    {
        var updated = await _userService.UpdateRoleAsync(id, payload.Role);
        return Ok(ApiResponse<UserDto>.Ok(updated));
    }

    [HttpPost("{id}/lock")]
    public async Task<IActionResult> Lock(string id)
    {
        var (user, revoked, skipped, error) = await _userService.SetUserActiveAsync(id, false);
        var result = new
        {
            user.Id, user.FullName, user.Email, user.Phone, user.Address,
            user.Gender, user.Role, user.Status, user.CreatedAt,
            clerk = new { revoked, skipped, error }
        };
        return Ok(ApiResponse<object>.Ok(result));
    }

    [HttpPost("{id}/unlock")]
    public async Task<IActionResult> Unlock(string id)
    {
        var (user, revoked, skipped, error) = await _userService.SetUserActiveAsync(id, true);
        var result = new
        {
            user.Id, user.FullName, user.Email, user.Phone, user.Address,
            user.Gender, user.Role, user.Status, user.CreatedAt,
            clerk = new { revoked, skipped, error }
        };
        return Ok(ApiResponse<object>.Ok(result));
    }
}
