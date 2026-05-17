using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Services;

namespace MyPuppy.Admin.Controllers;

[ApiController]
[Route("api/admin/staff")]
public class StaffController : ControllerBase
{
    private readonly StaffService _staffService;

    public StaffController(StaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] string? search)
    {
        var data = await _staffService.ListStaffAsync(status, search);
        return Ok(ApiResponse<IEnumerable<StaffDto>>.Ok(data));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var staff = await _staffService.GetStaffByIdAsync(id);
        return Ok(ApiResponse<StaffDto>.Ok(staff));
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateStaffRequest payload)
    {
        var updated = await _staffService.UpdateStaffAsync(id, payload);
        return Ok(ApiResponse<StaffDto>.Ok(updated));
    }

    [HttpPost("{id}/availability")]
    public async Task<IActionResult> SetAvailability(string id, [FromBody] SetStaffAvailabilityRequest payload)
    {
        var updated = await _staffService.SetAvailabilityAsync(id, payload.Status);
        return Ok(ApiResponse<StaffDto>.Ok(updated));
    }
}
