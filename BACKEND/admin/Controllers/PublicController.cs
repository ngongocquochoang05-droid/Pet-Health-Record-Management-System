using Microsoft.AspNetCore.Mvc;
using MyPuppy.Admin.Models;
using MyPuppy.Admin.Repositories;

namespace MyPuppy.Admin.Controllers;

/// <summary>
/// Endpoints public cho frontend customer (khong can auth admin).
/// Tra du lieu cho landing page, trang dich vu, dat lich, phu kien.
/// </summary>
[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AdminRepository _repository;

    public PublicController(AdminRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// GET /api/public/services
    /// Tra ve tat ca dich vu cua MyPuppy, kem ranking theo so lan dat lich.
    /// </summary>
    [HttpGet("services")]
    public async Task<IActionResult> GetServices()
    {
        var services = await _repository.GetPublicServicesAsync();
        return Ok(ApiResponse<IEnumerable<PublicServiceDto>>.Ok(services));
    }
}
