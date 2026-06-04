using Microsoft.AspNetCore.Mvc;
using PetHealth_BE.src.DTOs;
using PetHealth_BE.src.Repositories;

namespace PetHealth_BE.src.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DichVuController : ControllerBase
{
    private readonly DichVuRepository _serviceRepository;

    public DichVuController(DichVuRepository serviceRepository)
    {
        _serviceRepository = serviceRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var services = await _serviceRepository.GetCatalogAsync();
        return Ok(ApiResponseDto<IEnumerable<DichVuDto>>.Ok(services));
    }
}
