using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Services;

namespace MyPuppy.Admin.Controllers;

[ApiController]
[Route("api/admin")]
public class SystemController : ControllerBase
{
    private readonly SystemService _systemService;

    public SystemController(SystemService systemService)
    {
        _systemService = systemService;
    }

    [HttpGet("health")]
    public IActionResult GetHealth()
        => Ok(ApiResponse<object>.Ok(_systemService.GetHealth()));

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
        => Ok(ApiResponse<object>.Ok(await _systemService.GetDashboardAsync()));
}
